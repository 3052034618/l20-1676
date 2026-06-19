import type { CouponPackType, CouponTemplate, UserRoleType, UserRole } from '@/types';

export const couponTemplates: Record<CouponPackType, CouponTemplate> = {
  new_user: {
    name: '新用户追更包',
    description: '专为新用户设计的追更福利，包含热门作品最新章节，让新用户快速入坑。',
    defaultTicketCount: 5,
    defaultValidDays: 30,
    icon: 'rocket',
  },
  completed: {
    name: '完结篇补券包',
    description: '已完结作品的完整阅读券包，让用户一口气看到底，不留遗憾。',
    defaultTicketCount: 10,
    defaultValidDays: 60,
    icon: 'trophy',
  },
  member_return: {
    name: '会员回流包',
    description: '欢迎老会员回归，精选热门作品畅读福利，唤醒沉睡用户。',
    defaultTicketCount: 8,
    defaultValidDays: 45,
    icon: 'heart',
  },
};

export const userRoles: Record<UserRoleType, UserRole> = {
  new_user: {
    type: 'new_user',
    label: '新用户',
    description: '注册7天内的新用户',
  },
  existing_user: {
    type: 'existing_user',
    label: '老用户',
    description: '注册超过7天的活跃用户',
  },
  expired_member: {
    type: 'expired_member',
    label: '会员过期用户',
    description: '曾经是会员但已过期的用户',
  },
};

export const getPreviewConfig = (
  packType: CouponPackType | null,
  userRole: UserRoleType
) => {
  const template = packType ? couponTemplates[packType] : null;
  
  const configs: Record<UserRoleType, { showEntry: boolean; entryText: string; description: string; usageTips: string[] }> = {
    new_user: {
      showEntry: true,
      entryText: `领取${template?.name || '新人礼包'}`,
      description: template 
        ? `欢迎加入！专享${template.name}，包含${template.defaultTicketCount}张漫画券，${template.defaultValidDays}天内有效。`
        : '欢迎加入！领取您的新人专属礼包。',
      usageTips: [
        '券包领取后立即生效，请在有效期内使用',
        '每张券可抵扣一话付费章节',
        '券包仅限本人使用，不可转让',
        '逾期未使用的券将自动失效',
      ],
    },
    existing_user: {
      showEntry: packType === 'completed',
      entryText: packType === 'completed' ? '查看完结礼包' : '暂无可用礼包',
      description: packType === 'completed'
        ? `您关注的作品已完结，专属${template?.name}已为您备好！`
        : '感谢您的支持，暂无专属活动。',
      usageTips: packType === 'completed' ? [
        '完结作品专属券包，可阅读全部付费章节',
        '券包有效期内可随时阅读',
        '阅读进度自动保存',
      ] : [
        '请持续关注平台活动',
        '会员用户可享受更多专属福利',
      ],
    },
    expired_member: {
      showEntry: packType === 'member_return',
      entryText: packType === 'member_return' ? '欢迎回来，领取回归礼包' : '开通会员享更多福利',
      description: packType === 'member_return'
        ? `好久不见！专属${template?.name}已为您备好，${template?.defaultTicketCount}张券等您来领！`
        : '开通会员即可畅享全站漫画，还有更多专属福利。',
      usageTips: packType === 'member_return' ? [
        '回归礼包仅限曾经是会员的用户领取',
        '券包领取后有效期内均可使用',
        '再次开通会员可享受更多优惠',
      ] : [
        '会员可免费阅读千部作品',
        '开通会员享无广告阅读体验',
        '专属客服优先解答您的问题',
      ],
    },
  };

  return {
    role: userRole,
    ...configs[userRole],
  };
};
