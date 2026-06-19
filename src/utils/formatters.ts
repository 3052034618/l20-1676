import { format, differenceInDays } from 'date-fns';
import type {
  CouponPackConfig,
  ActivitySummary,
  Comic,
  ChapterRange,
  PreviewConfig,
  UserRoleType,
  DepartmentApproval,
  ApprovalStatus,
  DepartmentInfo,
  ComicTicketAllocation,
  AudienceRule,
  ActivityStatus,
  LaunchCheckItem,
} from '@/types';
import { couponTemplates, userRoles } from '@/mock/couponTemplates';
import { getComicById } from '@/mock/comics';

export const DEPARTMENT_LIST: DepartmentInfo[] = [
  { type: 'editor', label: '主编', description: '审核内容质量与作品范围', icon: 'book-open' },
  { type: 'business', label: '商务', description: '审核版权与商务条款', icon: 'handshake' },
  { type: 'customer_service', label: '客服', description: '确认客服话术与应急预案', icon: 'headphones' },
];

export const formatDate = (dateStr: string): string => {
  if (!dateStr) return '';
  return format(new Date(dateStr), 'yyyy年MM月dd日');
};

export const formatDateTime = (dateStr: string): string => {
  if (!dateStr) return '';
  return format(new Date(dateStr), 'yyyy年MM月dd日 HH:mm');
};

export const formatDateInput = (date: Date): string => {
  return format(date, 'yyyy-MM-dd');
};

export const getValidityPeriod = (from: string, to: string): string => {
  if (!from || !to) return '';
  const fromDate = new Date(from);
  const toDate = new Date(to);
  const days = differenceInDays(toDate, fromDate) + 1;
  return `${formatDate(from)} 至 ${formatDate(to)}（共 ${days} 天）`;
};

export const getEligibilityDescription = (type: string | null): string => {
  switch (type) {
    case 'new_user':
      return '注册7天内的新用户';
    case 'completed':
      return '所有用户均可领取';
    case 'member_return':
      return '曾经是会员但已过期的用户';
    default:
      return '符合活动条件的用户';
  }
};

export const hasExtraInRanges = (ranges: ChapterRange[]): boolean => {
  return ranges.some(r => r.extraChapterIds.length > 0);
};

export const getComicRangesText = (
  comicRanges: ChapterRange[],
  comic?: Comic
): string => {
  if (comicRanges.length === 0) return '未覆盖';

  const parts = comicRanges.map(r => {
    let text = `第${r.startChapter}话 ~ 第${r.endChapter}话`;
    if (r.extraChapterIds.length > 0) {
      const extraCount = r.extraChapterIds.length;
      const extraNos = comic
        ? comic.chapters
            .filter(ch => r.extraChapterIds.includes(ch.id))
            .map(ch => ch.chapterNo)
            .join('、')
        : `${extraCount}个`;
      text += `（含番外${extraNos}话）`;
    }
    return text;
  });

  return parts.join('；');
};

export const generateActivitySummary = (
  config: CouponPackConfig,
  approvals?: DepartmentApproval[]
): ActivitySummary => {
  const selectedComics = config.selectedComicIds
    .map(id => getComicById(id))
    .filter(Boolean) as Comic[];

  const allocationsMap = new Map<string, ComicTicketAllocation>();
  config.comicAllocations.forEach(a => allocationsMap.set(a.comicId, a));

  const comicList = selectedComics.map(comic => {
    const comicRanges = config.chapterRanges.filter(r => r.comicId === comic.id);
    const chapterCount = comicRanges.reduce((sum, r) => {
      return sum + (r.endChapter - r.startChapter + 1);
    }, 0);

    const allocation = allocationsMap.get(comic.id);
    const ticketCount = allocation?.ticketCount || comicRanges.length;

    return {
      comic,
      ticketCount,
      chapterCount,
      range: getComicRangesText(comicRanges, comic),
      ranges: comicRanges,
    };
  });

  const template = config.type ? couponTemplates[config.type] : null;
  const rules = generateRules(config);
  const customerServiceScripts = generateServiceScripts(config, template?.name || '券包');

  const overallStatus = approvals ? calculateOverallStatus(approvals) : 'pending';

  return {
    comicList,
    rules,
    customerServiceScripts,
    approvals: approvals || [],
    overallStatus,
  };
};

const generateRules = (config: CouponPackConfig): string[] => {
  const template = config.type ? couponTemplates[config.type] : null;
  const rules: string[] = [];

  rules.push(`活动名称：${config.name || template?.name || '漫画券包活动'}`);
  rules.push(`券包类型：${template?.name || '自定义'}`);
  rules.push(`适用人群：${getEligibilityDescription(config.type)}`);
  rules.push(`券包包含：${config.ticketCount} 张漫画阅读券`);

  if (config.selectedComicIds.length > 0) {
    const comics = config.selectedComicIds.map(id => getComicById(id)).filter(Boolean) as Comic[];
    const allocMap = new Map<string, number>();
    config.comicAllocations.forEach(a => allocMap.set(a.comicId, a.ticketCount));

    const detailParts = comics.map(c => {
      const count = allocMap.get(c.id) || 0;
      const ranges = config.chapterRanges.filter(r => r.comicId === c.id);
      const min = ranges.length > 0 ? Math.min(...ranges.map(r => r.startChapter)) : 0;
      const max = ranges.length > 0 ? Math.max(...ranges.map(r => r.endChapter)) : 0;
      return `${c.title}(${count}张，第${min}-${max}话)`;
    });
    rules.push(`适用作品明细：${detailParts.join('、')}`);
  }

  rules.push(`有效期：${getValidityPeriod(config.validFrom, config.validTo)}`);
  rules.push(`使用限制：${config.singleBookOnly ? '仅限单部作品使用' : '可用于多部作品'}`);
  rules.push('每张券可抵扣一话付费章节');
  rules.push('券包领取后立即生效，逾期未使用将自动失效');
  rules.push('券包仅限本人使用，不可转让、不可兑现');

  if (hasExtraInRanges(config.chapterRanges)) {
    rules.push('⚠️ 注意：本券包包含付费番外章节，请在活动说明中明确告知用户');
  }

  return rules;
};

const generateServiceScripts = (
  config: CouponPackConfig,
  packName: string
): { title: string; content: string }[] => {
  const template = config.type ? couponTemplates[config.type] : null;
  const comics = config.selectedComicIds
    .map(id => getComicById(id))
    .filter(Boolean) as Comic[];
  const comicNames = comics.map(c => c.title).join('、');

  const allocMap = new Map<string, number>();
  config.comicAllocations.forEach(a => allocMap.set(a.comicId, a.ticketCount));
  const comicDetail = comics.map(c => `${c.title}(${allocMap.get(c.id) || 0}张券)`).join('、');

  return [
    {
      title: '活动介绍话术',
      content: `您好！我们正在举办"${config.name || packName}"活动。\n\n活动时间：${getValidityPeriod(config.validFrom, config.validTo)}\n\n适用人群：${getEligibilityDescription(config.type)}\n\n活动内容：用户可领取包含 ${config.ticketCount} 张漫画阅读券的${template?.name || '券包'}。\n\n作品分配：${comicDetail}\n\n${config.singleBookOnly ? '⚠️ 注意：券包仅限选择其中一部作品使用。' : '✅ 多部作品可搭配使用。'}\n\n每张券可抵扣一话付费章节，领取后请在有效期内使用哦~`,
    },
    {
      title: '领取规则说明',
      content: `您好，关于${packName}的领取规则说明如下：\n\n1. 领取条件：${getEligibilityDescription(config.type)}\n2. 领取方式：在活动页面点击"立即领取"即可\n3. 券包数量：每人限领1次，共${config.ticketCount}张券\n4. 有效期：${getValidityPeriod(config.validFrom, config.validTo)}\n5. 适用作品：${comicNames}\n6. 使用限制：${config.singleBookOnly ? '仅限单部作品使用' : '多部作品均可使用'}\n\n如有其他疑问，请随时联系我们~`,
    },
    {
      title: '使用问题解答',
      content: `您好，关于${packName}的使用问题解答：\n\nQ: 券怎么用？\nA: 进入${comicNames}的付费章节阅读页面，系统会自动使用券抵扣。\n\nQ: 每部作品能用几张券？\nA: ${comicDetail}\n\nQ: 可以退券吗？\nA: 券包一旦领取，不支持退还，请在有效期内使用。\n\nQ: 为什么用不了？\nA: 请检查：①是否在有效期内(${getValidityPeriod(config.validFrom, config.validTo)}) ②作品是否在适用范围内 ③券是否已用完\n\nQ: 可以看番外吗？\nA: 券包范围${hasExtraInRanges(config.chapterRanges) ? '包含' : '不包含'}付费番外，具体请查看活动说明中的章节范围。\n\n如有其他问题，请继续提问~`,
    },
    {
      title: '异常情况处理',
      content: `您好，针对${packName}的异常情况处理：\n\n情况1：领不到券\n→ 请检查是否符合领取条件：${getEligibilityDescription(config.type)}\n→ 请检查是否已领取过（每人限领1次）\n\n情况2：券用不了\n→ 请检查券是否在有效期内：${getValidityPeriod(config.validFrom, config.validTo)}\n→ 请检查阅读的作品是否在适用范围内：${comicNames}\n→ 请检查券是否已用完（共${config.ticketCount}张）\n\n情况3：券过期了\n→ 券过期后自动失效，无法恢复，请下次及时使用哦\n\n情况4：看不到指定章节\n→ 请确认该章节是否在券包覆盖范围内，如有疑问请提供作品名称和章节号\n\n如仍有问题，请提供您的账号信息，我们会为您进一步排查。`,
    },
  ];
};

export const generatePreviewConfig = (
  config: CouponPackConfig,
  role: UserRoleType
): PreviewConfig => {
  const template = config.type ? couponTemplates[config.type] : null;
  const roleInfo = Object.values(userRoles).find(r => r.type === role);
  const comics = config.selectedComicIds
    .map(id => getComicById(id))
    .filter(Boolean) as Comic[];
  const comicTitles = comics.map(c => c.title);

  const audienceRule = config.audienceRules?.find((r: AudienceRule) => r.role === role);
  const isEnabled = audienceRule?.enabled ?? false;
  const customEntryText = audienceRule?.entryText;
  const limitPerUser = audienceRule?.limitPerUser ?? 1;
  const customDescription = audienceRule?.customDescription;

  let showEntry = isEnabled;
  let entryText = customEntryText || '参与活动';
  let description = '';
  const usageTips: string[] = [];

  const allocMap = new Map<string, number>();
  config.comicAllocations.forEach(a => allocMap.set(a.comicId, a.ticketCount));
  const comicAllocationText = comics
    .map(c => `《${c.title}》${allocMap.get(c.id) || 0}张`)
    .join('、');

  if (isEnabled) {
    if (customDescription) {
      description = customDescription;
    } else {
      switch (role) {
        case 'new_user':
          description = `欢迎新朋友！${config.name || template?.name || '漫画券包'}包含 ${config.ticketCount} 张阅读券，\n${comicAllocationText || ''}\n助你畅快追更！`;
          break;
        case 'existing_user':
          description = `感谢您的支持！${config.name || template?.name || '专属福利'}包含 ${config.ticketCount} 张阅读券，\n${comicAllocationText || ''}\n尽情阅读吧！`;
          break;
        case 'expired_member':
          description = `老朋友好久不见！${config.name || template?.name || '回流礼包'}包含 ${config.ticketCount} 张阅读券，\n${comicAllocationText || ''}\n回来继续追更吧~`;
          break;
      }
    }
  } else {
    switch (role) {
      case 'new_user':
        entryText = '� 升级会员享更多福利';
        description = '当前活动仅适用于指定用户群体，可升级会员解锁更多内容';
        break;
      case 'existing_user':
        entryText = '� 关注更多活动预告';
        description = '当前暂无匹配的活动，请关注平台后续活动通知';
        break;
      case 'expired_member':
        entryText = '💎 立即续订会员';
        description = '成为VIP会员，解锁全站漫画无广告畅读';
        break;
    }
  }

  if (showEntry) {
    usageTips.push(`📅 有效期：${getValidityPeriod(config.validFrom, config.validTo)}`);
    usageTips.push(`🎫 券数：每人限领 ${limitPerUser} 份，每份 ${config.ticketCount} 张`);
    if (comics.length > 0) {
      usageTips.push(`📖 适用作品：${comicTitles.join('、')}`);
    }
    if (comicAllocationText) {
      usageTips.push(`📊 作品分配：${comicAllocationText}`);
    }
    if (config.singleBookOnly) {
      usageTips.push('⚠️ 使用限制：仅限选择其中一部作品使用');
    }
    usageTips.push('💡 使用方式：进入付费章节自动抵扣');
    usageTips.push('🔒 券包仅限本人使用，不可转让');
  } else {
    usageTips.push(`当前身份：${roleInfo?.label}`);
    usageTips.push('本活动仅针对特定用户群体开放');
    usageTips.push('如有疑问请联系客服咨询');
  }

  return {
    role,
    showEntry,
    entryText,
    description,
    usageTips,
    comicTitles,
    ticketCount: config.ticketCount,
    validity: getValidityPeriod(config.validFrom, config.validTo),
    singleBookOnly: config.singleBookOnly,
  };
};

export const getActivityStatusLabel = (status: ActivityStatus): string => {
  switch (status) {
    case 'draft': return '草稿中';
    case 'ready': return '待发布';
    case 'published': return '进行中';
    case 'ended': return '已结束';
    default: return '未知';
  }
};

export const getActivityStatusColor = (status: ActivityStatus): string => {
  switch (status) {
    case 'draft': return 'text-gray-400';
    case 'ready': return 'text-accent-yellow';
    case 'published': return 'text-accent-green';
    case 'ended': return 'text-gray-500';
    default: return 'text-gray-400';
  }
};

export const getActivityStatusBadgeClass = (status: ActivityStatus): string => {
  switch (status) {
    case 'draft': return 'bg-gray-700/60 text-gray-300 border-gray-600';
    case 'ready': return 'bg-yellow-500/10 text-accent-yellow border-yellow-500/30';
    case 'published': return 'bg-green-500/10 text-accent-green border-green-500/30';
    case 'ended': return 'bg-gray-700/60 text-gray-400 border-gray-600';
    default: return 'bg-gray-700/60 text-gray-300 border-gray-600';
  }
};

export const getLaunchChecklistSummary = (items: LaunchCheckItem[]): {
  passed: number;
  total: number;
  allPassed: boolean;
  label: string;
} => {
  const passed = items.filter(i => i.passed).length;
  const total = items.length;
  const allPassed = passed === total;
  let label = '';
  if (allPassed) label = `✅ ${passed}/${total} 检查项已全部通过，可发布`;
  else if (passed === 0) label = `⚠️ ${total} 项待检查`;
  else label = `📋 ${passed}/${total} 项已通过，尚有 ${total - passed} 项待完成`;
  return { passed, total, allPassed, label };
};

export const calculateOverallStatus = (approvals: DepartmentApproval[]): ApprovalStatus => {
  if (approvals.length === 0) return 'pending';
  if (approvals.every(a => a.status === 'approved')) return 'approved';
  if (approvals.some(a => a.status === 'rejected')) return 'rejected';
  return 'pending';
};

export const getApprovalStatusLabel = (status: ApprovalStatus): string => {
  switch (status) {
    case 'approved': return '已确认';
    case 'rejected': return '已打回';
    default: return '待确认';
  }
};

export const getApprovalStatusColor = (status: ApprovalStatus): string => {
  switch (status) {
    case 'approved': return 'text-accent-green';
    case 'rejected': return 'text-red-400';
    default: return 'text-accent-yellow';
  }
};

export const getOverallStatusLabel = (status: ApprovalStatus): string => {
  switch (status) {
    case 'approved': return '✅ 全部确认通过';
    case 'rejected': return '❌ 存在打回意见';
    default: return '⏳ 等待多部门确认';
  }
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  }
};

export const getDefaultDateRange = (days: number) => {
  const today = new Date();
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + days);
  return {
    from: formatDateInput(today),
    to: formatDateInput(endDate),
  };
};

export const formatFieldForDiff = (field: string, value: unknown): string => {
  const fieldLabels: Record<string, string> = {
    type: '券包类型',
    name: '活动名称',
    ticketCount: '总券数',
    validFrom: '有效期开始',
    validTo: '有效期结束',
    singleBookOnly: '单本限制',
    selectedComicIds: '已选作品',
    comicAllocations: '券分配方案',
  };

  const label = fieldLabels[field] || field;

  if (field === 'type' && typeof value === 'string') {
    const tpl = couponTemplates[value as keyof typeof couponTemplates];
    return `${label}: ${tpl?.name || value}`;
  }
  if (field === 'validFrom' || field === 'validTo') {
    return `${label}: ${formatDate(value as string)}`;
  }
  if (field === 'singleBookOnly') {
    return `${label}: ${value ? '是' : '否'}`;
  }
  if (field === 'selectedComicIds' && Array.isArray(value)) {
    const names = (value as string[]).map(id => getComicById(id)?.title || id).join('、');
    return `${label}: [${names || '无'}]`;
  }
  if (field === 'comicAllocations' && Array.isArray(value)) {
    const parts = (value as ComicTicketAllocation[]).map(a => {
      const comic = getComicById(a.comicId);
      return `${comic?.title || a.comicId}=${a.ticketCount}张`;
    });
    return `${label}: {${parts.join(', ') || '无'}}`;
  }

  return `${label}: ${JSON.stringify(value)}`;
};
