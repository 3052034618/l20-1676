import { User, Bell, RotateCcw } from 'lucide-react';
import { useCouponStore } from '@/store/useCouponStore';
import { couponTemplates } from '@/mock/couponTemplates';

export default function Header() {
  const { config, resetConfig, isDirty } = useCouponStore();
  const template = config.type ? couponTemplates[config.type] : null;

  const handleReset = () => {
    if (isDirty && !window.confirm('确定要重置所有配置吗？未保存的更改将丢失。')) {
      return;
    }
    resetConfig();
  };

  return (
    <header className="h-16 bg-ink-900/80 backdrop-blur-sm border-b border-ink-700 flex items-center justify-between px-6 sticky top-0 z-50">
      <div className="flex items-center gap-4">
        <div>
          <h2 className="font-display text-xl font-semibold text-white">
            {template?.name || '新建券包'}
          </h2>
          {template && (
            <p className="text-xs text-ink-500">{template.description}</p>
          )}
        </div>
        {isDirty && (
          <span className="tag tag-active text-xs">
            编辑中
          </span>
        )}
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={handleReset}
          className="btn-ghost flex items-center gap-2 text-sm"
        >
          <RotateCcw className="w-4 h-4" />
          重置
        </button>

        <div className="h-6 w-px bg-ink-700" />

        <button className="relative p-2 text-ink-400 hover:text-white transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-accent-orange rounded-full" />
        </button>

        <div className="flex items-center gap-3 pl-2">
          <div className="w-8 h-8 bg-gradient-to-br from-accent-orange to-accent-yellow rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-ink-950" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-white">运营专员</p>
            <p className="text-xs text-ink-500">Admin</p>
          </div>
        </div>
      </div>
    </header>
  );
}
