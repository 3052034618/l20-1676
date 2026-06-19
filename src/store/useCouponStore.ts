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
  ActivityChangeRecord,
  ChangeRecordType,
  ChannelType,
  ChannelConsumptionStat,
} from '@/types';
import { couponTemplates } from '@/mock/couponTemplates';
import { getComicById } from '@/mock/comics';
import { validateConfig, calculateChapterRangesWithAllocations, hasErrors } from '@/utils/validators';
import {
  getDefaultDateRange,
  formatDateInput,
  calculateOverallStatus,
  CHANNEL_LIST,
} from '@/utils/formatters';
import { addDays, format, parseISO, differenceInDays } from 'date-fns';

const DEPARTMENTS: DepartmentType[] = ['editor', 'business', 'customer_service'];
const ROLES: UserRoleType[] = ['new_user', 'existing_user', 'expired_member'];

const ROLE_LABELS: Record<UserRoleType, { label: string; defaultText: string }> = {
  new_user: { label: '新用户', defaultText: '领取新人礼包' },
  existing_user: { label: '老用户', defaultText: '查看专属福利' },
  expired_member: { label: '会员过期用户', defaultText: '欢迎回来领取回归礼' },
};

const ROLE_WEIGHTS: Record<UserRoleType, number> = {
  new_user: 0.45,
  existing_user: 0.35,
  expired_member: 0.20,
};

const FIELD_LABELS: Record<string, string> = {
  ticketCount: '券张数',
  validFrom: '有效期开始',
  validTo: '有效期结束',
  name: '活动名称',
  singleBookOnly: '单本使用限制',
  selectedComicIds: '绑定作品',
  comicAllocations: '作品券数分配',
  audienceRules: '投放人群规则',
  estimatedReach: '预计触达用户数',
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
    id: 'pack-' + Date.now(),
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

const formatValueForLog = (val: unknown): string => {
  if (val === undefined || val === null) return '-';
  if (typeof val === 'number') return String(val);
  if (typeof val === 'boolean') return val ? '开启' : '关闭';
  if (typeof val === 'string') return val || '(空)';
  if (Array.isArray(val)) {
    if (val.length === 0) return '(空)';
    if (typeof val[0] === 'string') return val.length + ' 项';
    if ((val[0] as any).comicId !== undefined) {
      return val
        .map((a: any) => {
          const c = getComicById(a.comicId);
          return (c?.title || a.comicId) + ':' + a.ticketCount + '张';
        })
        .join('、');
    }
    if ((val[0] as any).role !== undefined) {
      return val
        .filter((r: any) => r.enabled)
        .map((r: any) => ROLE_LABELS[r.role]?.label || r.role)
        .join('、') || '(未启用)';
    }
    return val.length + ' 项';
  }
  return JSON.stringify(val);
};

const createConfigSnapshot = (config: CouponPackConfig): ActivityChangeRecord['configSnapshot'] => {
  const comics = config.selectedComicIds
    .map(id => getComicById(id))
    .filter(Boolean) as Comic[];
  const allocMap = new Map<string, number>();
  config.comicAllocations.forEach(a => allocMap.set(a.comicId, a.ticketCount));

  return {
    name: config.name,
    ticketCount: config.ticketCount,
    validFrom: config.validFrom,
    validTo: config.validTo,
    comicAllocations: comics.map(c => ({
      comicTitle: c.title,
      ticketCount: allocMap.get(c.id) || 0,
    })),
    audienceRules: config.audienceRules.map(r => ({
      role: ROLE_LABELS[r.role]?.label || r.role,
      enabled: r.enabled,
      entryText: r.entryText,
      limitPerUser: r.limitPerUser,
    })),
  };
};

interface CouponState {
  config: CouponPackConfig;
  errors: FormErrors;
  isDirty: boolean;
  approvals: DepartmentApproval[];
  versions: CouponPackVersion[];
  currentVersionNo: number;
  changeRecords: ActivityChangeRecord[];
  lastOperator: string;

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
  getDashboard: (filterRole?: UserRoleType | 'all', filterChannel?: ChannelType | 'all') => (ActivityDashboard & { byChannel: ChannelConsumptionStat[] }) | null;

  addChangeRecord: (
    type: ChangeRecordType,
    operation: ActivityChangeRecord['operation'],
    oldValue: unknown,
    newValue: unknown,
    operator?: string,
    versionNo?: number,
    includeSnapshot?: boolean,
  ) => void;
  clearChangeRecords: () => void;
  setLastOperator: (name: string) => void;
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
      changeRecords: [],
      lastOperator: '运营专员',

      setLastOperator: (name: string) => {
        set({ lastOperator: name });
      },

      addChangeRecord: (
        type: ChangeRecordType,
        operation: ActivityChangeRecord['operation'],
        oldValue: unknown,
        newValue: unknown,
        operator?: string,
        versionNo?: number,
        includeSnapshot?: boolean,
      ) => {
        const state = get();
        const record: ActivityChangeRecord = {
          recordId: 'rec-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
          type,
          fieldLabel: FIELD_LABELS[type] || type,
          oldValue: formatValueForLog(oldValue),
          newValue: formatValueForLog(newValue),
          operator: operator || state.lastOperator,
          operation,
          timestamp: new Date().toISOString(),
          versionNo,
        };

        if (includeSnapshot) {
          record.configSnapshot = createConfigSnapshot(state.config);
        }

        set(state => ({
          changeRecords: [record, ...state.changeRecords].slice(0, 200),
        }));
      },

      clearChangeRecords: () => {
        set({ changeRecords: [] });
      },

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

        const oldType = get().config.type;
        if (oldType !== type) {
          get().addChangeRecord('name', 'update', oldType ? couponTemplates[oldType]?.name : '-', template.name);
        }

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
        const stateBefore = get().config;

        for (const key of Object.keys(updates)) {
          const typedKey = key as keyof CouponPackConfig;
          const oldVal = stateBefore[typedKey];
          const newVal = updates[typedKey];
          if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
            let recordType: ChangeRecordType | null = null;
            if (key === 'ticketCount') recordType = 'ticket_count';
            else if (key === 'validFrom' || key === 'validTo') recordType = 'validity';
            else if (key === 'name') recordType = 'name';
            else if (key === 'comicAllocations') recordType = 'comic_allocations';
            else if (key === 'audienceRules') recordType = 'audience_rules';
            else if (key === 'selectedComicIds') recordType = 'comics_selected';

            if (recordType) {
              get().addChangeRecord(
                recordType,
                'update',
                key === 'validFrom' || key === 'validTo'
                  ? stateBefore.validFrom + ' ~ ' + stateBefore.validTo
                  : oldVal,
                key === 'validFrom' || key === 'validTo'
                  ? (updates.validFrom ?? stateBefore.validFrom) + ' ~ ' + (updates.validTo ?? stateBefore.validTo)
                  : newVal
              );
            }
          }
        }

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
        const stateBefore = get().config.selectedComicIds;
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

        get().addChangeRecord('comics_selected', 'update', stateBefore, get().config.selectedComicIds);

        setTimeout(() => {
          get().recalculateRanges();
        }, 0);
      },

      updateComicAllocation: (comicId: string, count: number) => {
        const before = get().config.comicAllocations;
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

        const after = get().config.comicAllocations;
        if (JSON.stringify(before) !== JSON.stringify(after)) {
          get().addChangeRecord('comic_allocations', 'update', before, after);
        }

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

        const before = config.comicAllocations;
        set(state => ({
          config: {
            ...state.config,
            comicAllocations: allocations,
          },
        }));

        if (JSON.stringify(before) !== JSON.stringify(allocations)) {
          get().addChangeRecord('comic_allocations', 'update', before, allocations);
        }

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
          errors.allocations = '分配的券总数(' + allocatedTotal + ')与总券数(' + config.ticketCount + ')不一致';
        }
        if (config.comicAllocations.some(a => a.ticketCount <= 0)) {
          errors.allocations = '请为每部作品分配至少1张券';
        }
        if (!config.audienceRules || config.audienceRules.every(r => !r.enabled)) {
          errors.audience = '请至少启用一个投放人群';
        }
        if (config.validFrom && config.validTo) {
          try {
            if (differenceInDays(parseISO(config.validTo), parseISO(config.validFrom)) < 0) {
              errors.validTo = '有效期结束日期不能早于开始日期';
            }
          } catch {}
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
          changeRecords: [],
        });
      },

      clearErrors: () => {
        set({ errors: {} });
      },

      updateApproval: (dept: DepartmentType, status: 'approved' | 'rejected', remark: string, operator: string) => {
        const before = get().approvals.find(a => a.department === dept);
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

        get().addChangeRecord(
          'approval_changed',
          status === 'approved' ? 'approve' : 'reject',
          before?.status || 'pending',
          status,
          operator
        );
        get().setLastOperator(operator);
      },

      resetApprovals: () => {
        set({ approvals: createInitialApprovals() });
      },

      saveVersion: (versionName: string, changeLog: string, status: VersionStatus = 'draft') => {
        const { config, approvals, versions, lastOperator } = get();
        const newVersionNo = versions.length + 1;
        const version: CouponPackVersion = {
          versionId: 'v-' + Date.now(),
          versionName: versionName || '版本 ' + newVersionNo,
          versionNo: newVersionNo,
          config: JSON.parse(JSON.stringify(config)),
          approvals: JSON.parse(JSON.stringify(approvals)),
          status,
          createdAt: new Date().toISOString(),
          createdBy: lastOperator,
          changeLog,
        };

        set(state => ({
          versions: [...state.versions, version],
          currentVersionNo: newVersionNo,
          isDirty: false,
        }));

        get().addChangeRecord(
          'version_saved',
          'save',
          '-',
          version.versionName + ' (V' + newVersionNo + ')',
          lastOperator,
          newVersionNo,
          true,
        );

        return version;
      },

      restoreVersion: (versionId: string) => {
        const { versions, lastOperator } = get();
        const version = versions.find(v => v.versionId === versionId);
        if (!version) return;

        set({
          config: JSON.parse(JSON.stringify(version.config)),
          approvals: JSON.parse(JSON.stringify(version.approvals)),
          isDirty: true,
        });

        get().addChangeRecord(
          'version_saved',
          'update',
          '-',
          '恢复到 ' + version.versionName + ' (V' + version.versionNo + ')',
          lastOperator,
          version.versionNo,
          true,
        );
      },

      deleteVersion: (versionId: string) => {
        const { versions, lastOperator } = get();
        const version = versions.find(v => v.versionId === versionId);
        if (version) {
          get().addChangeRecord(
            'version_saved',
            'delete',
            version.versionName + ' (V' + version.versionNo + ')',
            '-',
            lastOperator,
            version.versionNo
          );
        }
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
        const before = get().config.audienceRules;
        set(state => ({
          config: {
            ...state.config,
            audienceRules: state.config.audienceRules.map(rule =>
              rule.role === role ? { ...rule, ...updates } : rule
            ),
          },
          isDirty: true,
        }));

        const after = get().config.audienceRules;
        if (JSON.stringify(before) !== JSON.stringify(after)) {
          get().addChangeRecord('audience_rules', 'update', before, after);
        }
      },

      resetAudienceRules: () => {
        const before = get().config.audienceRules;
        set(state => ({
          config: {
            ...state.config,
            audienceRules: createInitialAudienceRules(),
          },
          isDirty: true,
        }));

        get().addChangeRecord('audience_rules', 'update', before, createInitialAudienceRules());
      },

      getLaunchChecklist: (): LaunchCheckItem[] => {
        const { config, approvals, versions, errors } = get();
        const hasError = hasErrors(errors);

        let validityPassed = !!config.validFrom && !!config.validTo;
        let validityDetail = '';
        if (config.validFrom && config.validTo) {
          try {
            if (differenceInDays(parseISO(config.validTo), parseISO(config.validFrom)) < 0) {
              validityPassed = false;
              validityDetail = '⚠️ 结束日期早于开始日期';
            } else {
              validityDetail = config.validFrom + ' 至 ' + config.validTo;
            }
          } catch {
              validityDetail = config.validFrom + ' 至 ' + config.validTo;
            }
          } else {
            validityDetail = '尚未设置有效期';
          }

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
            detail: '当前配置：' + config.ticketCount + ' 张',
          },
          {
            key: 'validity',
            label: '有效期设置',
            description: '配置正确的起止时间，结束不早于开始',
            passed: validityPassed,
            detail: validityDetail,
          },
          {
            key: 'comics',
            label: '作品绑定',
            description: '至少绑定1部漫画作品',
            passed: config.selectedComicIds.length > 0,
            detail: '已绑定 ' + config.selectedComicIds.length + ' 部作品',
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
              return '分配合计 ' + total + ' 张 / 总券数 ' + config.ticketCount + ' 张';
            })(),
          },
          {
            key: 'audience',
            label: '投放人群',
            description: '至少启用一个用户群体',
            passed: config.audienceRules.some(r => r.enabled),
            detail: '已启用 ' + config.audienceRules.filter(r => r.enabled).length + ' / 3 类人群',
          },
          {
            key: 'approvals',
            label: '多部门确认',
            description: '主编、商务、客服全部通过',
            passed: calculateOverallStatus(approvals) === 'approved',
            detail: (() => {
              const approved = approvals.filter(a => a.status === 'approved').length;
              return approved + ' / ' + approvals.length + ' 部门已通过';
            })(),
          },
          {
            key: 'version',
            label: '版本保存',
            description: '至少保存一个版本快照',
            passed: versions.length > 0,
            detail: versions.length > 0
              ? '已保存 ' + versions.length + ' 个历史版本'
              : '尚未保存版本',
          },
        ];

        return items;
      },

      publishActivity: (): boolean => {
        const { validate, getLaunchChecklist, lastOperator } = get();
        const isValid = validate();
        if (!isValid) return false;

        const checklist = getLaunchChecklist();
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

        get().addChangeRecord(
          'published',
          'publish',
          'draft',
          'published',
          lastOperator,
          undefined,
          true,
        );

        return true;
      },

      endActivity: () => {
        const { lastOperator } = get();
        set(state => ({
          config: {
            ...state.config,
            activityStatus: 'ended',
          },
        }));

        get().addChangeRecord(
          'ended',
          'delete',
          'published',
          'ended',
          lastOperator,
          undefined,
          true,
        );
      },

      getDashboard: (
        filterRole: UserRoleType | 'all' = 'all', filterChannel: ChannelType | 'all' = 'all'): ActivityDashboard & { byChannel: ChannelConsumptionStat[] } | null => {
        const { config } = get();
        if (!config.type) return null;

        const comics = config.selectedComicIds
          .map(id => getComicById(id))
          .filter(Boolean) as Comic[];

        const enabledRoles = filterRole === 'all'
          ? config.audienceRules.filter(r => r.enabled)
          : config.audienceRules.filter(r => r.enabled && r.role === filterRole);

        if (enabledRoles.length === 0) {
          return null;
        }

        const totalRoleWeight = enabledRoles.reduce((s, r) => s + ROLE_WEIGHTS[r.role], 0);

        const channels = filterChannel === 'all'
          ? CHANNEL_LIST
          : CHANNEL_LIST.filter(c => c.type === filterChannel);
        const totalChannelWeight = channels.reduce((s, c) => s + c.weight, 0);

        const combinedWeight = totalRoleWeight * totalChannelWeight;

        const adjustedReach = Math.round(config.estimatedReach * combinedWeight);

        const totalAllocated = config.ticketCount * adjustedReach;
        const claimRate = config.activityStatus === 'published' ? 0.68 : 0;
        const totalClaimed = Math.round(totalAllocated * claimRate);
        const totalUsed = Math.round(totalClaimed * 0.72);
        const totalExpired = Math.round(totalClaimed * 0.08);
        const totalRemaining = totalClaimed - totalUsed - totalExpired;

        const byComic: ComicConsumptionStat[] = comics.map(comic => {
          const alloc = config.comicAllocations.find(a => a.comicId === comic.id);
          const perComicTickets = alloc?.ticketCount ?? 0;
          const allocated = perComicTickets * adjustedReach;
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

        const byRole = enabledRoles.map(rule => {
          const roleRatio = ROLE_WEIGHTS[rule.role] / totalRoleWeight;
          const roleTotalReach = Math.round(adjustedReach * roleRatio);
          const roleAllocated = config.ticketCount * roleTotalReach;
          const roleClaimed = Math.round(roleAllocated * claimRate * roleRatio);
          return {
            role: rule.role,
            claimed: roleClaimed,
            used: Math.round(roleClaimed * 0.72),
          };
        });

        const byChannel: ChannelConsumptionStat[] = channels.map(channel => {
          const channelRatio = channel.weight / totalChannelWeight;
          const channelTotalReach = Math.round(adjustedReach * channelRatio);
          const channelAllocated = config.ticketCount * channelTotalReach;
          const channelClaimed = Math.round(channelAllocated * claimRate * channelRatio);
          return {
            channel: channel.type,
            label: channel.label,
            allocated: channelAllocated,
            claimed: channelClaimed,
            used: Math.round(channelClaimed * 0.72),
            expired: Math.round(channelClaimed * 0.08),
            claimRate,
            usageRate: channelClaimed > 0 ? Math.round(channelClaimed * 0.72) / channelClaimed : 0,
          };
        });

        let startDate = new Date();
        let endDate = new Date();
        try {
          if (config.validFrom) startDate = parseISO(config.validFrom);
          if (config.validTo) endDate = parseISO(config.validTo);
        } catch { }

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
          estimatedReach: adjustedReach,
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
          byChannel,
        };
      },
    }),
    {
      name: 'coupon-config-storage-v5',
      partialize: (state) => ({
        config: state.config,
        errors: state.errors,
        isDirty: state.isDirty,
        approvals: state.approvals,
        versions: state.versions,
        currentVersionNo: state.currentVersionNo,
        changeRecords: state.changeRecords,
        lastOperator: state.lastOperator,
      }),
    }
  )
);

const DEPARTMENT_LIST = [
  { type: 'editor' as const, label: '主编', description: '审核内容质量与作品范围', icon: 'book-open' },
  { type: 'business' as const, label: '商务', description: '审核版权与商务条款', icon: 'handshake' },
  { type: 'customer_service' as const, label: '客服', description: '确认客服话术与应急预案', icon: 'headphones' },
];

