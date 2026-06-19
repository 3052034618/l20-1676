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
} from '@/types';
import { couponTemplates } from '@/mock/couponTemplates';
import { getComicById } from '@/mock/comics';
import { validateConfig, calculateChapterRangesWithAllocations, hasErrors } from '@/utils/validators';
import { getDefaultDateRange, formatDateInput } from '@/utils/formatters';

const DEPARTMENTS: DepartmentType[] = ['editor', 'business', 'customer_service'];

const createInitialApprovals = (): DepartmentApproval[] => {
  return DEPARTMENTS.map(dep => ({
    department: dep,
    status: 'pending',
    remark: '',
    operator: '',
    updatedAt: '',
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
          },
          isDirty: true,
          errors: {},
        }));

        setTimeout(() => {
          get().recalculateRanges();
        }, 0);
      },

      updateConfig: (updates: Partial<CouponPackConfig>) => {
        set(state => ({
          config: {
            ...state.config,
            ...updates,
          },
          isDirty: true,
        }));

        if (
          'ticketCount' in updates ||
          'singleBookOnly' in updates ||
          'selectedComicIds' in updates
        ) {
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

          const newAllocations = state.config.comicAllocations.filter(a =>
            newSelectedIds.includes(a.comicId)
          );
          if (!isSelected && !newAllocations.find(a => a.comicId === comicId)) {
            newAllocations.push({ comicId, ticketCount: 0 });
          }

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
          const { autoAllocateTickets } = get();
          autoAllocateTickets();
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

      getVersionDiff: (v1Id: string, v2Id: string): VersionDiff[] => {
        const { versions } = get();
        const v1 = versions.find(v => v.versionId === v1Id);
        const v2 = versions.find(v => v.versionId === v2Id);
        if (!v1 || !v2) return [];

        const diffs: VersionDiff[] = [];
        const compareFields = [
          'type', 'name', 'ticketCount', 'validFrom', 'validTo',
          'singleBookOnly', 'selectedComicIds', 'comicAllocations',
        ];

        for (const field of compareFields) {
          const oldVal = (v1.config as unknown as Record<string, unknown>)[field];
          const newVal = (v2.config as unknown as Record<string, unknown>)[field];
          const oldStr = JSON.stringify(oldVal);
          const newStr = JSON.stringify(newVal);

          if (oldStr !== newStr) {
            if (!oldVal) {
              diffs.push({ field, oldValue: oldVal, newValue: newVal, type: 'added' });
            } else if (!newVal) {
              diffs.push({ field, oldValue: oldVal, newValue: newVal, type: 'removed' });
            } else {
              diffs.push({ field, oldValue: oldVal, newValue: newVal, type: 'changed' });
            }
          }
        }

        return diffs;
      },
    }),
    {
      name: 'coupon-config-storage-v2',
      partialize: (state) => ({
        config: state.config,
        isDirty: state.isDirty,
        approvals: state.approvals,
        versions: state.versions,
        currentVersionNo: state.currentVersionNo,
      }),
    }
  )
);
