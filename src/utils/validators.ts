import type { CouponPackConfig, FormErrors, ChapterRange, Comic } from '@/types';

export const validateConfig = (config: CouponPackConfig): FormErrors => {
  const errors: FormErrors = {};

  if (!config.type) {
    errors.type = '请选择券包类型';
  }

  if (config.ticketCount < 1 || config.ticketCount > 30) {
    errors.ticketCount = '券张数必须在 1-30 张之间';
  }

  if (!config.validFrom) {
    errors.validFrom = '请选择有效期开始日期';
  } else {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const fromDate = new Date(config.validFrom);
    if (fromDate < today) {
      errors.validFrom = '有效期开始日期不能早于今天';
    }
  }

  if (!config.validTo) {
    errors.validTo = '请选择有效期结束日期';
  }

  if (config.validFrom && config.validTo) {
    const fromDate = new Date(config.validFrom);
    const toDate = new Date(config.validTo);
    if (toDate <= fromDate) {
      errors.validTo = '有效期结束日期必须晚于开始日期';
    }
  }

  if (config.selectedComicIds.length === 0) {
    errors.selectedComicIds = '请至少选择一部漫画';
  }

  if (config.singleBookOnly && config.selectedComicIds.length > 1) {
    errors.selectedComicIds = '限制单本使用时只能选择一部漫画';
  }

  return errors;
};

export const hasErrors = (errors: FormErrors): boolean => {
  return Object.keys(errors).length > 0;
};

export const calculateChapterRanges = (
  ticketCount: number,
  singleBookOnly: boolean,
  selectedComics: Comic[]
): ChapterRange[] => {
  const ranges: ChapterRange[] = [];

  if (selectedComics.length === 0 || ticketCount <= 0) {
    return ranges;
  }

  if (singleBookOnly) {
    const comic = selectedComics[0];
    const paidChapters = comic.chapters.filter(ch => !ch.isFree);
    const chaptersPerTicket = Math.max(1, Math.ceil(paidChapters.length / ticketCount));

    for (let i = 0; i < ticketCount; i++) {
      const startIdx = i * chaptersPerTicket;
      const endIdx = Math.min((i + 1) * chaptersPerTicket, paidChapters.length) - 1;
      
      if (startIdx >= paidChapters.length) break;

      const startChapter = paidChapters[startIdx];
      const endChapter = paidChapters[endIdx];
      const extraChapters = paidChapters
        .slice(startIdx, endIdx + 1)
        .filter(ch => ch.isExtra)
        .map(ch => ch.id);

      ranges.push({
        couponIndex: i + 1,
        comicId: comic.id,
        startChapter: startChapter.chapterNo,
        endChapter: endChapter.chapterNo,
        extraChapterIds: extraChapters,
      });
    }
  } else {
    let currentTicket = 1;
    let comicIndex = 0;
    let chapterIndex = 0;

    while (currentTicket <= ticketCount && comicIndex < selectedComics.length) {
      const comic = selectedComics[comicIndex];
      const paidChapters = comic.chapters.filter(ch => !ch.isFree);

      if (chapterIndex >= paidChapters.length) {
        comicIndex++;
        chapterIndex = 0;
        continue;
      }

      const chaptersPerTicket = Math.max(1, Math.ceil(paidChapters.length / ticketCount));
      const startIdx = chapterIndex;
      const endIdx = Math.min(chapterIndex + chaptersPerTicket, paidChapters.length) - 1;

      const startChapter = paidChapters[startIdx];
      const endChapter = paidChapters[endIdx];
      const extraChapters = paidChapters
        .slice(startIdx, endIdx + 1)
        .filter(ch => ch.isExtra)
        .map(ch => ch.id);

      ranges.push({
        couponIndex: currentTicket,
        comicId: comic.id,
        startChapter: startChapter.chapterNo,
        endChapter: endChapter.chapterNo,
        extraChapterIds: extraChapters,
      });

      chapterIndex = endIdx + 1;
      if (chapterIndex >= paidChapters.length) {
        comicIndex++;
        chapterIndex = 0;
      }
      currentTicket++;
    }
  }

  return ranges;
};

export const getChaptersInRange = (
  comic: Comic,
  startChapter: number,
  endChapter: number
) => {
  return comic.chapters.filter(
    ch => ch.chapterNo >= startChapter && ch.chapterNo <= endChapter
  );
};

export const hasExtraInRange = (
  comic: Comic,
  startChapter: number,
  endChapter: number
): boolean => {
  return comic.chapters.some(
    ch => ch.chapterNo >= startChapter && ch.chapterNo <= endChapter && ch.isExtra
  );
};
