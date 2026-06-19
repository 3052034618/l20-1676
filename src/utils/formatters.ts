import { format, differenceInDays } from 'date-fns';
import type { CouponPackConfig, ActivitySummary, Comic, ChapterRange } from '@/types';
import { couponTemplates } from '@/mock/couponTemplates';
import { getComicById } from '@/mock/comics';

export const formatDate = (dateStr: string): string => {
  if (!dateStr) return '';
  return format(new Date(dateStr), 'yyyy年MM月dd日');
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

export const generateActivitySummary = (
  config: CouponPackConfig
): ActivitySummary => {
  const selectedComics = config.selectedComicIds
    .map(id => getComicById(id))
    .filter(Boolean) as Comic[];

  const comicList = selectedComics.map(comic => {
    const comicRanges = config.chapterRanges.filter(r => r.comicId === comic.id);
    const chapterCount = comicRanges.reduce((sum, r) => {
      return sum + (r.endChapter - r.startChapter + 1);
    }, 0);
    
    const minChapter = Math.min(...comicRanges.map(r => r.startChapter));
    const maxChapter = Math.max(...comicRanges.map(r => r.endChapter));
    
    return {
      comic,
      chapterCount,
      range: `第${minChapter}话 ~ 第${maxChapter}话`,
    };
  });

  const template = config.type ? couponTemplates[config.type] : null;
  const rules = generateRules(config);
  const customerServiceScripts = generateServiceScripts(config, template?.name || '券包');

  return {
    comicList,
    rules,
    customerServiceScripts,
  };
};

const generateRules = (config: CouponPackConfig): string[] => {
  const template = config.type ? couponTemplates[config.type] : null;
  const rules: string[] = [];

  rules.push(`活动名称：${config.name || template?.name || '漫画券包活动'}`);
  rules.push(`券包类型：${template?.name || '自定义'}`);
  rules.push(`券包包含：${config.ticketCount} 张漫画阅读券`);
  rules.push(`有效期：${getValidityPeriod(config.validFrom, config.validTo)}`);
  rules.push(`使用限制：${config.singleBookOnly ? '仅限单部作品使用' : '可用于多部作品'}`);
  
  if (config.selectedComicIds.length > 0) {
    const comicNames = config.selectedComicIds
      .map(id => getComicById(id)?.title)
      .filter(Boolean)
      .join('、');
    rules.push(`适用作品：${comicNames}`);
  }

  rules.push('每张券可抵扣一话付费章节');
  rules.push('券包领取后立即生效，逾期未使用将自动失效');
  rules.push('券包仅限本人使用，不可转让、不可兑现');

  return rules;
};

const generateServiceScripts = (
  config: CouponPackConfig,
  packName: string
): { title: string; content: string }[] => {
  const template = config.type ? couponTemplates[config.type] : null;
  const comicNames = config.selectedComicIds
    .map(id => getComicById(id)?.title)
    .filter(Boolean)
    .join('、');

  return [
    {
      title: '活动介绍话术',
      content: `您好！我们正在举办"${config.name || packName}"活动。\n\n活动时间：${getValidityPeriod(config.validFrom, config.validTo)}\n\n活动内容：用户可领取包含 ${config.ticketCount} 张漫画阅读券的${template?.name || '券包'}，可用于阅读${comicNames}${config.singleBookOnly ? '（仅限其中一部）' : ''}的付费章节。\n\n每张券可抵扣一话付费章节，领取后请在有效期内使用哦~`,
    },
    {
      title: '领取规则说明',
      content: `您好，关于${packName}的领取规则说明如下：\n\n1. 领取条件：${getEligibilityDescription(config.type)}\n2. 领取方式：在活动页面点击"立即领取"即可\n3. 券包数量：每人限领1次\n4. 有效期：${getValidityPeriod(config.validFrom, config.validTo)}\n5. 适用范围：${comicNames}${config.singleBookOnly ? '（仅限选择其中一部）' : ''}\n\n如有其他疑问，请随时联系我们~`,
    },
    {
      title: '使用问题解答',
      content: `您好，关于${packName}的使用问题解答：\n\nQ: 券怎么用？\nA: 进入付费章节阅读页面，系统会自动使用券抵扣。\n\nQ: 可以退券吗？\nA: 券包一旦领取，不支持退还，请在有效期内使用。\n\nQ: 为什么用不了？\nA: 请检查：①是否在有效期内 ②作品是否在适用范围内 ③券是否已用完\n\nQ: 可以看番外吗？\nA: 券包范围${hasExtraInRanges(config.chapterRanges) ? '包含' : '不包含'}付费番外，具体请查看活动说明。\n\n如有其他问题，请继续提问~`,
    },
    {
      title: '异常情况处理',
      content: `您好，针对${packName}的异常情况处理：\n\n情况1：领不到券\n→ 请检查是否符合领取条件：${getEligibilityDescription(config.type)}\n→ 请检查是否已领取过\n\n情况2：券用不了\n→ 请检查券是否在有效期内\n→ 请检查阅读的作品是否在适用范围内\n→ 请检查券是否已用完\n\n情况3：券过期了\n→ 券过期后自动失效，无法恢复，请下次及时使用哦\n\n如仍有问题，请提供您的账号信息，我们会为您进一步排查。`,
    },
  ];
};

const getEligibilityDescription = (type: string | null): string => {
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

const hasExtraInRanges = (ranges: ChapterRange[]): boolean => {
  return ranges.some(r => r.extraChapterIds.length > 0);
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
