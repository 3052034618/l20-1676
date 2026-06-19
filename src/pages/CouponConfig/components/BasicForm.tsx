import { Minus, Plus, Calendar, Ticket, BookLock } from 'lucide-react';
import { useCouponStore } from '@/store/useCouponStore';
import { formatDate } from '@/utils/formatters';

export default function BasicForm() {
  const { config, updateConfig, errors } = useCouponStore();
  const isDisabled = !config.type;

  const handleTicketCountChange = (delta: number) => {
    const newValue = Math.max(1, Math.min(30, config.ticketCount + delta));
    updateConfig({ ticketCount: newValue });
  };

  const handleInputChange = (field: string, value: string | number | boolean) => {
    updateConfig({ [field]: value });
  };

  return (
    <div className="space-y-6">
      <h3 className="font-display text-lg font-semibold text-white">基础参数配置</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="form-label">
              <span className="flex items-center gap-2">
                <Ticket className="w-4 h-4 text-accent-orange" />
                活动名称
              </span>
            </label>
            <input
              type="text"
              value={config.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              disabled={isDisabled}
              placeholder="请输入活动名称"
              className="input-field disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="form-label">
              <span className="flex items-center gap-2">
                <Ticket className="w-4 h-4 text-accent-orange" />
                券张数
                <span className="text-xs text-ink-500 font-normal">(1-30张)</span>
              </span>
            </label>
            {errors.ticketCount && (
              <p className="text-sm text-red-400 mb-2">{errors.ticketCount}</p>
            )}
            <div className="flex items-center gap-4">
              <button
                onClick={() => handleTicketCountChange(-1)}
                disabled={isDisabled || config.ticketCount <= 1}
                className="w-10 h-10 rounded-card bg-ink-700 hover:bg-ink-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-paper-200 transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="number"
                min={1}
                max={30}
                value={config.ticketCount}
                onChange={(e) => handleInputChange('ticketCount', parseInt(e.target.value) || 1)}
                disabled={isDisabled}
                className="w-24 input-field text-center text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                onClick={() => handleTicketCountChange(1)}
                disabled={isDisabled || config.ticketCount >= 30}
                className="w-10 h-10 rounded-card bg-ink-700 hover:bg-ink-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-paper-200 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
              <span className="text-sm text-ink-400">张</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-ink-800/50 rounded-card border border-ink-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-card bg-ink-700 flex items-center justify-center">
                <BookLock className="w-5 h-5 text-accent-yellow" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">限制单本使用</p>
                <p className="text-xs text-ink-500">开启后券包只能用于一部漫画</p>
              </div>
            </div>
            <button
              onClick={() => handleInputChange('singleBookOnly', !config.singleBookOnly)}
              disabled={isDisabled}
              className={`relative w-14 h-8 rounded-full transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
                config.singleBookOnly ? 'bg-accent-orange' : 'bg-ink-600'
              }`}
            >
              <span
                className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all duration-300 shadow-md ${
                  config.singleBookOnly ? 'left-7' : 'left-1'
                }`}
              />
              <span className="sr-only">限制单本使用</span>
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="form-label">
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-accent-orange" />
                有效期开始
              </span>
            </label>
            {errors.validFrom && (
              <p className="text-sm text-red-400 mb-2">{errors.validFrom}</p>
            )}
            <div className="relative">
              <input
                type="date"
                value={config.validFrom}
                onChange={(e) => handleInputChange('validFrom', e.target.value)}
                disabled={isDisabled}
                className="input-field disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {config.validFrom && (
                <p className="mt-2 text-xs text-ink-500">{formatDate(config.validFrom)}</p>
              )}
            </div>
          </div>

          <div>
            <label className="form-label">
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-accent-orange" />
                有效期结束
              </span>
            </label>
            {errors.validTo && (
              <p className="text-sm text-red-400 mb-2">{errors.validTo}</p>
            )}
            <div className="relative">
              <input
                type="date"
                value={config.validTo}
                onChange={(e) => handleInputChange('validTo', e.target.value)}
                disabled={isDisabled}
                className="input-field disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {config.validTo && (
                <p className="mt-2 text-xs text-ink-500">{formatDate(config.validTo)}</p>
              )}
            </div>
          </div>

          {config.validFrom && config.validTo && (
            <div className="p-4 bg-gradient-to-r from-accent-orange/10 to-accent-yellow/10 rounded-card border border-accent-orange/20">
              <p className="text-sm text-paper-200">
                <span className="text-accent-orange font-medium">有效期：</span>
                {formatDate(config.validFrom)} 至 {formatDate(config.validTo)}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
