import { useState } from 'react';
import { Users, Eye, EyeOff, Edit3, RefreshCw, Sparkles, AlertCircle } from 'lucide-react';
import { useCouponStore } from '@/store/useCouponStore';
import { userRoles } from '@/mock/couponTemplates';
import type { UserRoleType, AudienceRule } from '@/types';

const ROLE_ICONS: Record<UserRoleType, string> = {
  new_user: '👋',
  existing_user: '👤',
  expired_member: '🔄',
};

export default function AudienceRuleEditor() {
  const { config, updateAudienceRule, resetAudienceRules } = useCouponStore();
  const [editingRole, setEditingRole] = useState<UserRoleType | null>(null);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-accent-orange" />
          <h3 className="text-lg font-semibold text-white">投放人群规则</h3>
          <span className="px-2 py-0.5 rounded-full text-xs bg-slate-600 text-slate-300 border border-slate-500/40">
            {config.audienceRules.filter(r => r.enabled).length} / 3 已启用
          </span>
        </div>
        <button
          onClick={resetAudienceRules}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          重置
        </button>
      </div>

      <div className="grid md:grid-cols-1 lg:grid-cols-3 gap-4">
        {config.audienceRules.map(rule => {
          const roleInfo = userRoles[rule.role];
          const isEditing = editingRole === rule.role;
          return (
            <div
              key={rule.role}
              className={`p-4 rounded-xl border transition-all ${
                rule.enabled
                  ? 'border-accent-orange/40 bg-gradient-to-br from-accent-orange/10 to-slate-800/50'
                  : 'border-slate-700 bg-slate-800/50 opacity-80'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{ROLE_ICONS[rule.role]}</span>
                  <div>
                    <div className="text-white font-semibold">{roleInfo.label}</div>
                    <div className="text-xs text-slate-400">{roleInfo.description}</div>
                  </div>
                </div>
                <button
                  onClick={() =>
                    updateAudienceRule(rule.role, { enabled: !rule.enabled })}
                  className={`p-1.5 rounded-lg transition-colors ${
                    rule.enabled
                      ? 'bg-accent-green/20 text-accent-green'
                      : 'bg-slate-700 text-slate-400 hover:text-white'
                  }`}
                  title={rule.enabled ? '点击隐藏' : '点击启用'}
                >
                  {rule.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>

              {rule.enabled && (
                <div className="space-y-3 mt-3 pt-3 border-t border-slate-700/60">
                  <div>
                  <label className="block text-xs text-slate-400 mb-1">入口文案</label>
                  {isEditing ? (
                    <input
                      type="text"
                      defaultValue={rule.entryText}
                      onBlur={(e) => {
                        updateAudienceRule(rule.role, { entryText: e.target.value });
                        setEditingRole(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          updateAudienceRule(rule.role, { entryText: (e.target as HTMLInputElement).value });
                          setEditingRole(null);
                        }
                      }}
                      className="input-field text-sm"
                      autoFocus
                    />
                  ) : (
                    <div
                    onClick={() => setEditingRole(rule.role)}
                    className="flex items-center gap-2 cursor-pointer group"
                  >
                    <span className="text-sm text-white bg-slate-700/70 px-2 py-1 rounded flex-1">
                      {rule.entryText || '点击设置入口文案'}
                    </span>
                    <Edit3 className="w-3.5 h-3.5 text-slate-500 group-hover:text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  )}
                </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">领取限制（每人限领）</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={rule.limitPerUser}
                        onChange={(e) => updateAudienceRule(rule.role, { limitPerUser: Math.max(1, parseInt(e.target.value) || 1) })}
                        className="input-field text-sm w-24"
                      />
                      <span className="text-xs text-slate-400">份</span>
                    </div>
                  </div>
                </div>
              )}

              {!rule.enabled && (
                <div className="mt-3 pt-3 border-t border-slate-700/60">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <AlertCircle className="w-3.5 h-3.5" />
                    该人群当前不可见活动
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-slate-800/40 border border-slate-700/60 rounded-lg p-3">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Sparkles className="w-4 h-4 text-accent-yellow" />
          <span>提示：在「发放预览」页可实时查看各人群看到的入口和文案效果</span>
        </div>
      </div>
    </div>
  );
}
