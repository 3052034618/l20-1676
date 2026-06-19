import { Rocket, Trophy, Heart } from 'lucide-react';
import type { CouponPackType } from '@/types';
import { couponTemplates } from '@/mock/couponTemplates';
import { useCouponStore } from '@/store/useCouponStore';

const icons = {
  new_user: Rocket,
  completed: Trophy,
  member_return: Heart,
};

const gradients = {
  new_user: 'from-blue-600/30 to-purple-600/30',
  completed: 'from-amber-600/30 to-orange-600/30',
  member_return: 'from-rose-600/30 to-pink-600/30',
};

export default function TypeSelector() {
  const { config, setType, errors } = useCouponStore();

  const types = Object.entries(couponTemplates) as [CouponPackType, typeof couponTemplates.new_user][];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold text-white">选择券包类型</h3>
        {errors.type && (
          <span className="text-sm text-red-400 flex items-center gap-1">
            <span className="w-1 h-1 bg-red-400 rounded-full" />
            {errors.type}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {types.map(([type, template]) => {
          const Icon = icons[type];
          const isSelected = config.type === type;
          const gradient = gradients[type];

          return (
            <button
              key={type}
              onClick={() => setType(type)}
              className={`card card-hover p-6 text-left transition-all duration-300 comic-frame ${
                isSelected
                  ? 'border-accent-orange ring-2 ring-accent-orange/30 shadow-inner-active scale-[1.02]'
                  : 'border-ink-600 hover:border-ink-500'
              }`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-${isSelected ? '60' : '30'} rounded-card transition-opacity duration-300`} />
              
              <div className="relative z-10">
                <div
                  className={`w-14 h-14 rounded-card flex items-center justify-center mb-4 transition-all duration-300 ${
                    isSelected
                      ? 'bg-accent-orange text-ink-950 shadow-lg'
                      : 'bg-ink-700 text-paper-200'
                  }`}
                >
                  <Icon className={`w-7 h-7 ${isSelected ? 'animate-float' : ''}`} />
                </div>

                <h4 className="font-display text-lg font-semibold text-white mb-2">
                  {template.name}
                </h4>
                <p className="text-sm text-ink-400 mb-4 line-clamp-2">
                  {template.description}
                </p>

                <div className="flex items-center gap-4 text-xs text-ink-500">
                  <span>默认 {template.defaultTicketCount} 张券</span>
                  <span>•</span>
                  <span>{template.defaultValidDays} 天有效期</span>
                </div>

                {isSelected && (
                  <div className="mt-4 flex items-center gap-2 text-accent-orange text-sm font-medium">
                    <span className="w-2 h-2 bg-accent-orange rounded-full animate-pulse" />
                    已选择
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
