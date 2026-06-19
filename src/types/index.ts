export type CouponPackType = 'new_user' | 'completed' | 'member_return';

export type UserRoleType = 'new_user' | 'existing_user' | 'expired_member';

export interface Chapter {
  id: string;
  chapterNo: number;
  title: string;
  isExtra: boolean;
  isFree: boolean;
}

export interface Comic {
  id: string;
  title: string;
  author: string;
  cover: string;
  description: string;
  totalChapters: number;
  chapters: Chapter[];
}

export interface ChapterRange {
  couponIndex: number;
  comicId: string;
  startChapter: number;
  endChapter: number;
  extraChapterIds: string[];
}

export interface CouponPackConfig {
  id: string;
  type: CouponPackType | null;
  name: string;
  ticketCount: number;
  validFrom: string;
  validTo: string;
  singleBookOnly: boolean;
  selectedComicIds: string[];
  chapterRanges: ChapterRange[];
}

export interface CouponTemplate {
  name: string;
  description: string;
  defaultTicketCount: number;
  defaultValidDays: number;
  icon: string;
}

export interface ActivitySummary {
  comicList: {
    comic: Comic;
    chapterCount: number;
    range: string;
  }[];
  rules: string[];
  customerServiceScripts: {
    title: string;
    content: string;
  }[];
}

export interface PreviewConfig {
  role: UserRoleType;
  showEntry: boolean;
  entryText: string;
  description: string;
  usageTips: string[];
}

export interface UserRole {
  type: UserRoleType;
  label: string;
  description: string;
}

export interface FormErrors {
  type?: string;
  ticketCount?: string;
  validFrom?: string;
  validTo?: string;
  selectedComicIds?: string;
  [key: string]: string | undefined;
}
