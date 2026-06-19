export type CouponPackType = 'new_user' | 'completed' | 'member_return';

export type UserRoleType = 'new_user' | 'existing_user' | 'expired_member';

export type DepartmentType = 'editor' | 'business' | 'customer_service';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export type VersionStatus = 'draft' | 'submitted' | 'published' | 'archived';

export type ActivityStatus = 'draft' | 'ready' | 'published' | 'ended';

export type LaunchCheckItemKey =
  | 'ticketCount'
  | 'allocation'
  | 'validity'
  | 'comics'
  | 'approvals'
  | 'version'
  | 'audience'
  | 'name';

export interface LaunchCheckItem {
  key: LaunchCheckItemKey;
  label: string;
  description: string;
  passed: boolean;
  detail?: string;
}

export interface AudienceRule {
  role: UserRoleType;
  enabled: boolean;
  entryText: string;
  limitPerUser: number;
  customDescription?: string;
}

export interface ComicConsumptionStat {
  comicId: string;
  comicTitle: string;
  allocated: number;
  claimed: number;
  used: number;
  expired: number;
  remaining: number;
}

export interface ActivityDashboard {
  activityId: string;
  activityName: string;
  status: ActivityStatus;
  estimatedReach: number;
  totalAllocated: number;
  totalClaimed: number;
  totalUsed: number;
  totalExpired: number;
  totalRemaining: number;
  claimRate: number;
  usageRate: number;
  startDate: string;
  endDate: string;
  dailyClaims: { date: string; count: number }[];
  byComic: ComicConsumptionStat[];
  byRole: { role: UserRoleType; claimed: number; used: number }[];
}

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

export interface ComicTicketAllocation {
  comicId: string;
  ticketCount: number;
}

export interface DepartmentApproval {
  department: DepartmentType;
  status: ApprovalStatus;
  remark: string;
  operator: string;
  updatedAt: string;
}

export interface ComicCoverage {
  comicId: string;
  chapterRanges: ChapterRange[];
  totalTickets: number;
  totalChapters: number;
  minChapter: number;
  maxChapter: number;
  hasExtra: boolean;
}

export interface CouponPackVersion {
  versionId: string;
  versionName: string;
  versionNo: number;
  config: CouponPackConfig;
  approvals: DepartmentApproval[];
  status: VersionStatus;
  createdAt: string;
  createdBy: string;
  changeLog: string;
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
  comicAllocations: ComicTicketAllocation[];
  chapterRanges: ChapterRange[];
  audienceRules: AudienceRule[];
  activityStatus: ActivityStatus;
  publishedAt?: string;
  estimatedReach: number;
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
    ticketCount: number;
    chapterCount: number;
    range: string;
    ranges: ChapterRange[];
  }[];
  rules: string[];
  customerServiceScripts: {
    title: string;
    content: string;
  }[];
  approvals: DepartmentApproval[];
  overallStatus: ApprovalStatus;
}

export interface PreviewConfig {
  role: UserRoleType;
  showEntry: boolean;
  entryText: string;
  description: string;
  usageTips: string[];
  comicTitles: string[];
  ticketCount: number;
  validity: string;
  singleBookOnly: boolean;
}

export interface UserRole {
  type: UserRoleType;
  label: string;
  description: string;
}

export interface DepartmentInfo {
  type: DepartmentType;
  label: string;
  description: string;
  icon: string;
}

export interface FormErrors {
  type?: string;
  ticketCount?: string;
  validFrom?: string;
  validTo?: string;
  selectedComicIds?: string;
  allocations?: string;
  [key: string]: string | undefined;
}

export interface VersionDiff {
  field: string;
  oldValue: unknown;
  newValue: unknown;
  type: 'added' | 'removed' | 'changed';
}
