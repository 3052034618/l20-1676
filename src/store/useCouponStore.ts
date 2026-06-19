import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  CouponPackConfig,
  CouponPackType,
  FormErrors,
  ChapterRange,
  Comic,
  ComicTicketAllocation,
  DepartmentType,
  DepartmentApproval,
  CouponPackVersion,
  VersionStatus,
  VersionDiff,
  AudienceRule,
  UserRoleType,
  LaunchCheckItem,
  ActivityDashboard,
  ActivityStatus,
  ComicConsumptionStat,
} from '@/types';
import { couponTemplates } from '@/mock/couponTemplates';
import { getComicById } from '@/mock/comics';
import { validateConfig, calculateChapterRangesWithAllocations, hasErrors } from '@/utils/validators';
import {
  getDefaultDateRange,
  formatDateInput,
  calculateOverallStatus,
  generateActivitySummary,
} from '@/utils/formatters';
import { addDays, format, eachDayOfInterval, parseISO } from 'date-fns';

const DEPARTMENTS: DepartmentType[] = ['editor', 'business', 'customer_service'];
const ROLES: UserRoleType[] = ['new_user', 'existing_user', 'expired_member'];

const ROLE_LABELS: Record<UserRoleType, { label: string; defaultText: string }> = {
  new_user: { label: '新用户', defaultText: '领取新人礼包' },
  existing_user: { label: '老用户', defaultText: '查看专属福利' },
  expired_member: { label: '会员过期用户', defaultText: '欢迎回来领取回归礼' },
};

const createInitialApprovals = (): DepartmentApproval[] => {
  return DEPARTMENTS.map(dep => ({
    department: dep,
    status: 'pending',
    remark: '',
    operator: '',
    updatedAt: '',
  }));
};

const createInitialAudienceRules = (): AudienceRule[] => {
  return ROLES.map(role => ({
    role,
    enabled: role === 'new_user',
    entryText: ROLE_LABELS[role].defaultText,
    limitPerUser: 1,
    customDescription: '',
  }));
};

const createInitialConfig = (): CouponPackConfig => {
  return {
    id: `pack-${Date.now()}`,
    type: null,
    name: '',
    ticketCount: 5,
    validFrom: '',
    validTo: '',
    singleBookOnly: false,
    selectedComicIds: [],
    comicAllocations: [],
    chapterRanges: [],
    audienceRules: createInitialAudienceRules(),
    activityStatus: 'draft',
    estimatedReach: 10000,
  };
};

interface CouponState {
  config: CouponPackConfig;
  errors: FormErrors;
  isDirty: boolean;
  approvals: DepartmentApproval[];
  versions: CouponPackVersion[];
  currentVersionNo: number;

  setType: (type: CouponPackType) => void;
  updateConfig: (updates: Partial<CouponPackConfig>) => void;
  toggleComic: (comicId: string) => void;
  updateComicAllocation: (comicId: string, count: number) => void;
  autoAllocateTickets: () => void;
  recalculateRanges: () => void;
  validate: () => boolean;
  resetConfig: () => void;
  clearErrors: () => void;

  updateApproval: (dept: DepartmentType, status: 'approved' | 'rejected', remark: string, operator: string) => void;
  resetApprovals: () => void;

  saveVersion: (versionName: string, changeLog: string, status?: VersionStatus) => CouponPackVersion;
  restoreVersion: (versionId: string) => void;
  deleteVersion: (versionId: string) => void;
  getVersionDiff: (v1Id: string, v2Id: string) => VersionDiff[];

  updateAudienceRule: (role: UserRoleType, updates: Partial<AudienceRule>) => void;
  resetAudienceRules: () => void;

  getLaunchChecklist: () => LaunchCheckItem[];
  publishActivity: () => boolean;
  endActivity: () => void;
  getDashboard: () => ActivityDashboard | null;
}

const autoAllocate = (
  totalTickets: number,
  selectedComics: Comic[],
  singleBookOnly: boolean
): ComicTicketAllocation[] => {
  if (selectedComics.length === 0 || totalTickets <= 0) return [];

  if (singleBookOnly) {
    return [{ comicId: selectedComics[0].id, ticketCount: totalTickets }];
  }

  const allocations: ComicTicketAllocation[] = [];
  const baseCount = Math.floor(totalTickets / selectedComics.length);
  const remainder = totalTickets % selectedComics.length;

  selectedComics.forEach((comic, index) => {
    allocations.push({
      comicId: comic.id,
      ticketCount: baseCount + (index < remainder ? 1 : 0),
    });
  });

  return allocations;
};

export const useCouponStore = create<CouponState>()(
  persist(
    (set, get) => ({
      config: createInitialConfig(),
      errors: {},
      isDirty: false,
      approvals: createInitialApprovals(),
      versions: [],
      currentVersionNo: 0,

      setType: (type: CouponPackType) => {
        const template = couponTemplates[type];
        const dateRange = getDefaultDateRange(template.defaultValidDays);

        const defaultEnabledByType: Record<CouponPackType, UserRoleType[]> = {
          new_user: ['new_user'],
          completed: ['existing_user', 'new_user'],
          member_return: ['expired_member'],
        };

        const newAudienceRules: AudienceRule[] = ROLES.map(role => ({
          role,
          enabled: defaultEnabledByType[type].includes(role),
          entryText: ROLE_LABELS[role].defaultText,
          limitPerUser: 1,
          customDescription: '',
        }));

        set(state => ({
          config: {
            ...state.config,
            type,
            name: template.name,
            ticketCount: template.defaultTicketCount,
            validFrom: dateRange.from,
            validTo: dateRange.to,
            chapterRanges: [],
            comicAllocations: [],
            audienceRules: newAudienceRules,
          },
          isDirty: true,
          errors: {},
        }));

        setTimeout(() => {
          const { autoAllocateTickets, recalculateRanges } = get();
          autoAllocateTickets();
          recalculateRanges();
        }, 0);
      },

      updateConfig: (updates: Partial<CouponPackConfig>) => {
        const needsReallocation = 'ticketCount' in updates || 'singleBookOnly' in updates;

        set(state => {
          let newState = {
            config: {
              ...state.config,
              ...updates,
            },
            isDirty: true,
          };

          if (needsReallocation) {
            const selectedComics = state.config.selectedComicIds
              .map(id => getComicById(id))
              .filter(Boolean) as Comic[];
            const newTicketCount = updates.ticketCount ?? state.config.ticketCount;
            const newSingleBook = updates.singleBookOnly ?? state.config.singleBookOnly;
            newState.config.comicAllocations = autoAllocate(newTicketCount, selectedComics, newSingleBook);
          }

          return newState;
        });

        if (needsReallocation || 'selectedComicIds' in updates) {
          setTimeout(() => {
            get().recalculateRanges();
          }, 0);
        }
      },

      toggleComic: (comicId: string) => {
        set(state => {
          const isSelected = state.config.selectedComicIds.includes(comicId);
          let newSelectedIds: string[];

          if (state.config.singleBookOnly) {
            newSelectedIds = isSelected ? [] : [comicId];
          } else {
            newSelectedIds = isSelected
              ? state.config.selectedComicIds.filter(id => id !== comicId)
              : [...state.config.selectedComicIds, comicId];
          }

          const selectedComics = newSelectedIds
            .map(id => getComicById(id))
            .filter(Boolean) as Comic[];
          const newAllocations = autoAllocate(state.config.ticketCount, selectedComics, state.config.singleBookOnly);

          return {
            config: {
              ...state.config,
              selectedComicIds: newSelectedIds,
              comicAllocations: newAllocations,
            },
            isDirty: true,
          };
        });

        setTimeout(() => {
          get().recalculateRanges();
        }, 0);
      },

      updateComicAllocation: (comicId: string, count: number) => {
        set(state => {
          const newAllocations = state.config.comicAllocations.map(a =>
            a.comicId === comicId ? { ...a, ticketCount: Math.max(0, count) } : a
          );
          const totalTickets = newAllocations.reduce((sum, a) => sum + a.ticketCount, 0);
          return {
            config: {
              ...state.config,
              comicAllocations: newAllocations,
              ticketCount: totalTickets,
            },
            isDirty: true,
          };
        });

        setTimeout(() => {
          get().recalculateRanges();
        }, 0);
      },

      autoAllocateTickets: () => {
        const { config } = get();
        const selectedComics = config.selectedComicIds
          .map(id => getComicById(id))
          .filter(Boolean) as Comic[];

        const allocations = autoAllocate(
          config.ticketCount,
          selectedComics,
          config.singleBookOnly
        );

        set(state => ({
          config: {
            ...state.config,
            comicAllocations: allocations,
          },
        }));

        setTimeout(() => {
          get().recalculateRanges();
        }, 0);
      },

      recalculateRanges: () => {
        const { config } = get();
        const selectedComics = config.selectedComicIds
          .map(id => getComicById(id))
          .filter(Boolean) as Comic[];

        if (selectedComics.length === 0 || config.ticketCount <= 0) {
          set(state => ({
            config: {
              ...state.config,
              chapterRanges: [],
            },
          }));
          return;
        }

        const ranges = calculateChapterRangesWithAllocations(
          config.comicAllocations,
          selectedComics
        );

        set(state => ({
          config: {
            ...state.config,
            chapterRanges: ranges,
          },
        }));
      },

      validate: () => {
        const { config } = get();
        const errors = validateConfig(config);

        const allocatedTotal = config.comicAllocations.reduce((sum, a) => sum + a.ticketCount, 0);
        if (config.selectedComicIds.length > 0 && allocatedTotal !== config.ticketCount) {
          errors.allocations = `分配的券总数(${allocatedTotal})与总券数(${config.ticketCount})不一致`;
        }
        if (config.comicAllocations.some(a => a.ticketCount <= 0)) {
          errors.allocations = '请为每部作品分配至少1张券';
        }
        if (!config.audienceRules || config.audienceRules.every(r => !r.enabled)) {
          errors.audience = '请至少启用一个投放人群';
        }

        set({ errors });
        return !hasErrors(errors);
      },

      resetConfig: () => {
        set({
          config: createInitialConfig(),
          errors: {},
          isDirty: false,
          approvals: createInitialApprovals(),
        });
      },

      clearErrors: () => {
        set({ errors: {} });
      },

      updateApproval: (dept: DepartmentType, status: 'approved' | 'rejected', remark: string, operator: string) => {
        set(state => ({
          approvals: state.approvals.map(a =>
            a.department === dept
              ? {
                  ...a,
                  status,
                  remark,
                  operator,
                  updatedAt: new Date().toISOString(),
                }
              : a
          ),
        }));
      },

      resetApprovals: () => {
        set({ approvals: createInitialApprovals() });
      },

      saveVersion: (versionName: string, changeLog: string, status: VersionStatus = 'draft') => {
        const { config, approvals, versions } = get();
        const newVersionNo = versions.length + 1;
        const version: CouponPackVersion = {
          versionId: `v-${Date.now()}`,
          versionName: versionName || `版本 ${newVersionNo}`,
          versionNo: newVersionNo,
          config: JSON.parse(JSON.stringify(config)),
          approvals: JSON.parse(JSON.stringify(approvals)),
          status,
          createdAt: new Date().toISOString(),
          createdBy: '运营专员',
          changeLog,
        };

        set(state => ({
          versions: [...state.versions, version],
          currentVersionNo: newVersionNo,
          isDirty: false,
        }));

        return version;
      },

      restoreVersion: (versionId: string) => {
        const { versions } = get();
        const version = versions.find(v => v.versionId === versionId);
        if (!version) return;

        set({
          config: JSON.parse(JSON.stringify(version.config)),
          approvals: JSON.parse(JSON.stringify(version.approvals)),
          isDirty: true,
        });
      },

      deleteVersion: (versionId: string) => {
        set(state => ({
          versions: state.versions.filter(v => v.versionId !== versionId),
        }));
      },

      getVersionDiff: (v1Id: string, v2Id: string) => {
        const { versions } = get();
        const v1 = versions.find(v => v.versionId === v1Id);
        const v2 = versions.find(v => v.versionId === v2Id);
        if (!v1 || !v2) return [];

        const diffs: VersionDiff[] = [];
        const compareFields = [
          'type', 'name', 'ticketCount', 'validFrom', 'validTo',
          'singleBookOnly', 'selectedComicIds', 'comicAllocations',
          'audienceRules', 'estimatedReach',
        ];

        for (const field of compareFields) {
          const oldVal = (v1.config as unknown as Record<string, unknown>)[field];
          const newVal = (v2.config as unknown as Record<string, unknown>)[field];
          const oldStr = JSON.stringify(oldVal);
          const newStr = JSON.stringify(newVal);

          if (oldStr !== newStr) {
            if (oldVal === undefined || oldVal === null) {
              diffs.push({ field, oldValue: oldVal, newValue: newVal, type: 'added' });
            } else if (newVal === undefined || newVal === null) {
              diffs.push({ field, oldValue: oldVal, newValue: newVal, type: 'removed' });
            } else {
              diffs.push({ field, oldValue: oldVal, newValue: newVal, type: 'changed' });
            }
          }
        }

        return diffs;
      },

      updateAudienceRule: (role: UserRoleType, updates: Partial<AudienceRule>) => {
        set(state => ({
          config: {
            ...state.config,
            audienceRules: state.config.audienceRules.map(rule =>
              rule.role === role ? { ...rule, ...updates } : rule
            ),
          },
          isDirty: true,
        }));
      },

      resetAudienceRules: () => {
        set(state => ({
          config: {
            ...state.config,
            audienceRules: createInitialAudienceRules(),
          },
          isDirty: true,
        }));
      },

      getLaunchChecklist: (): LaunchCheckItem[] => {
        const { config, approvals, versions, errors } = get();
        const hasError = hasErrors(errors);

        const items: LaunchCheckItem[] = [
          {
            key: 'name',
            label: '活动名称',
            description: '设置完整的活动名称',
            passed: !!config.name && config.name.trim().length > 0,
            detail: config.name || '尚未设置活动名称',
          },
          {
            key: 'ticketCount',
            label: '券数量配置',
            description: '总券数必须大于0',
            passed: config.ticketCount > 0,
            detail: `当前配置：${config.ticketCount} 张`,
          },
          {
            key: 'validity',
            label: '有效期设置',
            description: '配置正确的起止时间',
            passed: !!config.validFrom && !!config.validTo,
            detail: config.validFrom && config.validTo
              ? `${config.validFrom} 至 ${config.validTo}`
              : '尚未设置有效期',
          },
          {
            key: 'comics',
            label: '作品绑定',
            description: '至少绑定1部漫画作品',
            passed: config.selectedComicIds.length > 0,
            detail: `已绑定 ${config.selectedComicIds.length} 部作品`,
          },
          {
            key: 'allocation',
            label: '券数分配',
            description: '每部作品至少1张，分配总数等于总券数',
            passed: (() => {
              const total = config.comicAllocations.reduce((s, a) => s + a.ticketCount, 0);
              const hasZero = config.comicAllocations.some(a => a.ticketCount <= 0);
              return config.selectedComicIds.length === 0
                || (!hasZero && total === config.ticketCount && total > 0);
            })(),
            detail: (() => {
              const total = config.comicAllocations.reduce((s, a) => s + a.ticketCount, 0);
              if (config.selectedComicIds.length === 0) return '尚未绑定作品';
              return `分配合计 ${total} 张 / 总券数 ${config.ticketCount} 张`;
            })(),
          },
          {
            key: 'audience',
            label: '投放人群',
            description: '至少启用一个用户群体',
            passed: config.audienceRules.some(r => r.enabled),
            detail: `已启用 ${config.audienceRules.filter(r => r.enabled).length} / 3 类人群`,
          },
          {
            key: 'approvals',
            label: '多部门确认',
            description: '主编、商务、客服全部通过',
            passed: calculateOverallStatus(approvals) === 'approved',
            detail: (() => {
              const approved = approvals.filter(a => a.status === 'approved').length;
              return `${approved} / ${approvals.length} 部门已通过`;
            })(),
          },
          {
            key: 'version',
            label: '版本保存',
            description: '至少保存一个版本快照',
            passed: versions.length > 0,
            detail: versions.length > 0
              ? `已保存 ${versions.length} 个历史版本`
              : '尚未保存版本',
          },
        ];

        return items;
      },

      publishActivity: (): boolean => {
        const checklist = get().getLaunchChecklist();
        const allPassed = checklist.every(item => item.passed);
        if (!allPassed) return false;

        set(state => ({
          config: {
            ...state.config,
            activityStatus: 'published',
            publishedAt: new Date().toISOString(),
          },
          isDirty: true,
        }));
        return true;
      },

      endActivity: () => {
        set(state => ({
          config: {
            ...state.config,
            activityStatus: 'ended',
          },
        }));
      },

      getDashboard: (): ActivityDashboard | null => {
        const { config } = get();
        if (!config.type) return null;

        const comics = config.selectedComicIds
          .map(id => getComicById(id))
          .filter(Boolean) as Comic[];

        const totalAllocated = config.ticketCount * config.estimatedReach;
        const claimRate = config.activityStatus === 'published' ? 0.68 : 0;
        const totalClaimed = Math.round(totalAllocated * claimRate);
        const totalUsed = Math.round(totalClaimed * 0.72);
        const totalExpired = Math.round(totalClaimed * 0.08);
        const totalRemaining = totalClaimed - totalUsed - totalExpired;

        const byComic: ComicConsumptionStat[] = comics.map(comic => {
          const alloc = config.comicAllocations.find(a => a.comicId === comic.id);
          const perComicTickets = alloc?.ticketCount ?? 0;
          const allocated = perComicTickets * config.estimatedReach;
          const claimed = Math.round(allocated * claimRate);
          return {
            comicId: comic.id,
            comicTitle: comic.title,
            allocated,
            claimed,
            used: Math.round(claimed * 0.72),
            expired: Math.round(claimed * 0.08),
            remaining: claimed - Math.round(claimed * 0.72) - Math.round(claimed * 0.08),
          };
        });

        const byRole = config.audienceRules
          .filter(r => r.enabled)
          .map(rule => {
            const weights: Record<UserRoleType, number> = {
              new_user: 0.45,
              existing_user: 0.35,
              expired_member: 0.2,
            };
            const claimed = Math.round(totalClaimed * weights[rule.role]);
            return {
              role: rule.role,
              claimed,
              used: Math.round(claimed * 0.72),
            };
          });

        let startDate = new Date();
        let endDate = new Date();
        try {
          if (config.validFrom) startDate = parseISO(config.validFrom);
          if (config.validTo) endDate = parseISO(config.validTo);
        } catch {}

        const days = Math.min(30, Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / 86400000)));
        const dailyClaims = Array.from({ length: days }, (_, i) => {
          const d = addDays(startDate, i);
          const peakDay = Math.floor(days * 0.3);
          const decay = Math.exp(-Math.pow((i - peakDay) / (days * 0.4), 2));
          const base = totalClaimed / days;
          return {
            date: format(d, 'MM-dd'),
            count: Math.round(base * (0.4 + 1.2 * decay)),
          };
        });

        return {
          activityId: config.id,
          activityName: config.name,
          status: config.activityStatus,
          estimatedReach: config.estimatedReach,
          totalAllocated,
          totalClaimed,
          totalUsed,
          totalExpired,
          totalRemaining,
          claimRate,
          usageRate: totalClaimed > 0 ? totalUsed / totalClaimed : 0,
          startDate: config.validFrom,
          endDate: config.validTo,
          dailyClaims,
          byComic,
          byRole,
        };
      },
    }),
    {
      name: 'coupon-config-storage-v3',
    }
  )
);
