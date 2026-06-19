import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CouponPackConfig, CouponPackType, FormErrors, ChapterRange, Comic } from '@/types';
import { couponTemplates } from '@/mock/couponTemplates';
import { getComicById } from '@/mock/comics';
import { validateConfig, calculateChapterRanges, hasErrors } from '@/utils/validators';
import { getDefaultDateRange } from '@/utils/formatters';

interface CouponState {
  config: CouponPackConfig;
  errors: FormErrors;
  isDirty: boolean;
  setType: (type: CouponPackType) => void;
  updateConfig: (updates: Partial<CouponPackConfig>) => void;
  toggleComic: (comicId: string) => void;
  recalculateRanges: () => void;
  validate: () => boolean;
  resetConfig: () => void;
  clearErrors: () => void;
}

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
    chapterRanges: [],
  };
};

export const useCouponStore = create<CouponState>()(
  persist(
    (set, get) => ({
      config: createInitialConfig(),
      errors: {},
      isDirty: false,

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

          return {
            config: {
              ...state.config,
              selectedComicIds: newSelectedIds,
            },
            isDirty: true,
          };
        });

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

        const ranges = calculateChapterRanges(
          config.ticketCount,
          config.singleBookOnly,
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
        set({ errors });
        return !hasErrors(errors);
      },

      resetConfig: () => {
        set({
          config: createInitialConfig(),
          errors: {},
          isDirty: false,
        });
      },

      clearErrors: () => {
        set({ errors: {} });
      },
    }),
    {
      name: 'coupon-config-storage',
      partialize: (state) => ({
        config: state.config,
        isDirty: state.isDirty,
      }),
    }
  )
);
