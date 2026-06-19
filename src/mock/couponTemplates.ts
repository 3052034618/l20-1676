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


