import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserPlus,
  Users,
  UserX,
  ArrowRight,
  ArrowLeft,
  Gift,
  X,
  Info,
  CheckCircle2,
  Smartphone,
  Calendar,
  Ticket,
  BookOpen,
  AlertCircle,
  Eye,
  Lock,
} from 'lucide-react';
import type { UserRoleType } from '@/types';
import { userRoles } from '@/mock/couponTemplates';
import { useCouponStore } from '@/store/useCouponStore';
import { couponTemplates } from '@/mock/couponTemplates';
import {
  generatePreviewConfig,
  getValidityPeriod,
  getEligibilityDescription,
} from '@/utils/formatters';
import { getComicById } from '@/mock/comics';
import { getActivityStatusLabel, getActivityStatusBadgeClass } from '@/utils/formatters';

const roleIcons = {
  new_user: UserPlus,
  existing_user: Users,
  expired_member: UserX,
};

export default function Preview() {
  const navigate = useNavigate();
  const { config } = useCouponStore();
  const [selectedRole, setSelectedRole] = useState<UserRoleType>('new_user');
  const [showModal, setShowModal] = useState(false);
  const [showClaimed, setShowClaimed] = useState(false);

  const template = config.type ? couponTemplates[config.type] : null;
  const previewConfig = useMemo(
    () => generatePreviewConfig(config, selectedRole),
    [config, selectedRole]
  );

  const selectedComics = config.selectedComicIds
    .map(id => getComicById(id))
    .filter(Boolean);

  const allocMap = new Map<string, number>();
  config.comicAllocations.forEach(a => allocMap.set(a.comicId, a.ticketCount));

  const handleClaim = () => {
    if (!previewConfig.showEntry) return;
    setShowClaimed(true);
    setTimeout(() => setShowClaimed(false), 3000);
  };

  const handleDisabledClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleBack = () => navigate('/config');
  const handleNext = () => navigate('/summary');

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-bold text-white">发放预览</h1>
            <span className={`text-sm px-2.5 py-0.5 rounded-full border ${getActivityStatusBadgeClass(config.activityStatus)}`}>
              {getActivityStatusLabel(config.activityStatus)}
            </span>
          </div>
          <p className="text-ink-400 mt-1">
            模拟不同用户角色看到的活动效果 · 文案完全跟随当前配置
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleBack} className="btn-secondary flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            返回配置
          </button>
          <button onClick={handleNext} className="btn-primary flex items-center gap-2">
            生成摘要
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!config.type ? (
        <div className="card p-12 text-center">
          <Gift className="w-16 h-16 text-ink-600 mx-auto mb-4" />
          <h3 className="font-display text-xl font-semibold text-white mb-2">
            请先配置券包
          </h3>
          <p className="text-ink-400 mb-6">
            请先返回配置页面选择券包类型并完成基础配置
          </p>
          <button onClick={handleBack} className="btn-primary">
            前往配置
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <div className="card p-6">
              <h3 className="font-display text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-accent-orange" />
                选择用户角色
              </h3>
              <div className="space-y-3">
                {(Object.keys(userRoles) as UserRoleType[]).map((role) => {
                  const roleData = userRoles[role];
                  const Icon = roleIcons[role];
                  const isSelected = selectedRole === role;
                  const cfg = generatePreviewConfig(config, role);
                  const audienceRule = config.audienceRules?.find(r => r.role === role);
                  const limitPerUser = audienceRule?.limitPerUser ?? 1;

                  return (
                    <button
                      key={role}
                      onClick={() => setSelectedRole(role)}
                      className={`w-full p-4 rounded-card text-left transition-all duration-300 flex items-center gap-4 ${
                        isSelected
                          ? 'bg-accent-orange/20 border border-accent-orange text-white'
                          : 'bg-ink-800 border border-ink-700 text-paper-200 hover:border-ink-600'
                      }`}
                    >
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          isSelected ? 'bg-accent-orange text-ink-950' : 'bg-ink-700 text-paper-200'
                        }`}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold">{roleData.label}</p>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                            cfg.showEntry
                              ? 'bg-accent-green/20 text-accent-green'
                              : 'bg-ink-700 text-ink-400'
                          }`}>
                            {cfg.showEntry ? '可领' : '不可领'}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-ink-700 text-ink-400">
                            每人限领 {limitPerUser} 份
                          </span>
                        </div>
                        <p className={`text-sm ${isSelected ? 'text-paper-200' : 'text-ink-500'}`}>
                          {roleData.description}
                        </p>
                        {!cfg.showEntry && (
                          <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            此活动未对{roleData.label}开放
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-display text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Info className="w-5 h-5 text-accent-orange" />
                当前配置快照
              </h3>
              <div className="space-y-3 text-sm">
                <ConfigRow icon={Gift} label="券包类型" value={template?.name || '-'} />
                <ConfigRow icon={Ticket} label="总券数" value={`${config.ticketCount} 张`} />
                <ConfigRow
                  icon={Calendar}
                  label="有效期"
                  value={getValidityPeriod(config.validFrom, config.validTo)}
                  multiLine
                />
                <ConfigRow icon={BookOpen} label="适用作品" value={`${selectedComics.length} 部`} />
                <ConfigRow
                  icon={AlertCircle}
                  label="使用限制"
                  value={config.singleBookOnly ? '仅限单本使用' : '多部作品可用'}
                />
                <ConfigRow
                  icon={Users}
                  label="适用人群"
                  value={getEligibilityDescription(config.type)}
                />
              </div>

              {config.audienceRules && (
                <div className="mt-4 pt-4 border-t border-ink-700">
                  <h4 className="text-xs text-ink-500 mb-2 font-medium flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    当前角色投放规则
                  </h4>
                  {(() => {
                    const currentRule = config.audienceRules.find(r => r.role === selectedRole);
                    const currentCfg = generatePreviewConfig(config, selectedRole);
                    if (!currentRule) return null;
                    return (
                      <div className="space-y-2">
                        <div className="text-xs p-2 rounded bg-ink-900/50 flex items-center justify-between">
                          <span className="text-ink-400">是否可见</span>
                          <span className={currentCfg.showEntry ? 'text-accent-green font-medium' : 'text-red-400 font-medium'}>
                            {currentCfg.showEntry ? '✓ 可见' : '✗ 不可见'}
                          </span>
                        </div>
                        <div className="text-xs p-2 rounded bg-ink-900/50 flex items-center justify-between">
                          <span className="text-ink-400">入口文案</span>
                          <span className="text-white font-medium">{currentCfg.entryText}</span>
                        </div>
                        <div className="text-xs p-2 rounded bg-ink-900/50 flex items-center justify-between">
                          <span className="text-ink-400">每人限领份数</span>
                          <span className="text-accent-orange font-medium">{currentRule.limitPerUser} 份</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {config.audienceRules && (
                <div className="mt-4 pt-4 border-t border-ink-700">
                  <h4 className="text-xs text-ink-500 mb-2 font-medium flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    全部人群规则
                  </h4>
                  <div className="space-y-1.5">
                    {config.audienceRules.map(rule => {
                      const roleInfo = userRoles[rule.role];
                      const isCurrent = rule.role === selectedRole;
                      return (
                        <div
                          key={rule.role}
                          className={`text-xs p-2 rounded flex items-center justify-between ${
                            isCurrent ? 'bg-accent-orange/15 border border-accent-orange/30' : 'bg-ink-900/50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={rule.enabled ? 'text-accent-green' : 'text-ink-500'}>
                              {rule.enabled ? '●' : '○'}
                            </span>
                            <span className={isCurrent ? 'text-white font-medium' : 'text-ink-300'}>
                              {roleInfo.label}
                            </span>
                          </div>
                          <span className="text-ink-400 text-[10px]">
                            {rule.enabled ? `限领 ${rule.limitPerUser} 份` : '不可见'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {selectedComics.length > 0 && (
                <div className="mt-4 pt-4 border-t border-ink-700">
                  <h4 className="text-xs text-ink-500 mb-2 font-medium">作品分配明细</h4>
                  <div className="space-y-1.5">
                    {selectedComics.map((comic) => {
                      const count = allocMap.get(comic?.id || '') || 0;
                      return (
                        <div
                          key={comic?.id}
                          className="flex items-center justify-between text-xs p-2 bg-ink-900/50 rounded"
                        >
                          <span className="text-ink-300 truncate max-w-[150px]">
                            {comic?.title}
                          </span>
                          <span className="text-accent-orange font-medium flex-shrink-0">
                            {count} 张
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <h3 className="font-display text-lg font-semibold text-white flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-accent-orange" />
                  手机端预览
                </h3>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    previewConfig.showEntry
                      ? 'bg-accent-green/20 text-accent-green'
                      : 'bg-red-500/15 text-red-400'
                  }`}>
                    {previewConfig.showEntry
                      ? `✓ ${userRoles[selectedRole].label}可见入口`
                      : `✗ ${userRoles[selectedRole].label}不可见`}
                  </span>
                </div>
              </div>

              <div className="flex justify-center">
                <div className="relative">
                  <div className="w-80 bg-black rounded-[3rem] p-3 shadow-2xl border-4 border-ink-700">
                    <div className="relative bg-ink-950 rounded-[2.5rem] overflow-hidden h-[640px]">
                      <div className="absolute top-0 left-0 right-0 h-6 bg-black rounded-t-[2.5rem] z-20">
                        <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-24 h-5 bg-black rounded-full" />
                      </div>

                      <div className="h-full pt-6 pb-4 overflow-hidden">
                        <div className="h-full bg-gradient-to-b from-ink-900 to-ink-950 overflow-y-auto">
                          <div className="p-4 space-y-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs text-ink-500">
                                  {userRoles[selectedRole].label}
                                </p>
                                <p className="text-white font-semibold">{template?.name}</p>
                              </div>
                              <div className="w-10 h-10 bg-gradient-to-br from-accent-orange to-accent-yellow rounded-full flex items-center justify-center">
                                <Gift className="w-5 h-5 text-ink-950" />
                              </div>
                            </div>

                            <div className="relative overflow-hidden rounded-card">
                              <div className="aspect-[3/1] bg-gradient-to-r from-accent-orange/25 via-accent-yellow/25 to-accent-orange/25 flex items-center justify-center p-4">
                                <div className="text-center space-y-1">
                                  <p className="text-accent-orange font-display text-xl font-bold leading-tight">
                                    {config.name || template?.name}
                                  </p>
                                  <p className="text-ink-300 text-xs">
                                    {config.ticketCount} 张券 · {selectedComics.length} 部作品
                                  </p>
                                  <p className="text-ink-400 text-[10px]">
                                    {previewConfig.validity}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-2">
                              {selectedComics.slice(0, 4).map((comic) => {
                                const count = allocMap.get(comic?.id || '') || 0;
                                return (
                                  <div
                                    key={comic?.id}
                                    className="flex items-center gap-3 p-3 bg-ink-800/50 rounded-card"
                                  >
                                    <img
                                      src={comic?.cover}
                                      alt={comic?.title}
                                      className="w-11 h-14 object-cover rounded"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-white text-sm font-medium truncate">
                                        {comic?.title}
                                      </p>
                                      <p className="text-ink-500 text-[11px]">
                                        {comic?.author}
                                      </p>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                      <p className="text-accent-orange text-sm font-bold">
                                        {count}张
                                      </p>
                                      <p className="text-ink-600 text-[10px]">券</p>
                                    </div>
                                  </div>
                                );
                              })}
                              {selectedComics.length > 4 && (
                                <p className="text-center text-ink-500 text-xs py-1">
                                  还有 {selectedComics.length - 4} 部作品...
                                </p>
                              )}
                            </div>

                            <button
                              onClick={() => setShowModal(true)}
                              className="w-full text-center text-accent-orange text-sm hover:underline py-1"
                            >
                              查看完整券包说明 →
                            </button>
                          </div>

                          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-ink-950 via-ink-950/95 to-transparent pt-12">
                            {showClaimed ? (
                              <div className="w-full py-3 bg-accent-green text-ink-950 font-semibold rounded-card flex items-center justify-center gap-2 animate-bounce-subtle">
                                <CheckCircle2 className="w-5 h-5" />
                                领取成功！{config.ticketCount}张券已入账
                              </div>
                            ) : previewConfig.showEntry ? (
                              <button
                                onClick={handleClaim}
                                className="w-full py-3.5 bg-gradient-to-r from-accent-orange to-accent-yellow text-ink-950 font-bold rounded-card shadow-lg hover:shadow-xl transition-all duration-300 active:scale-[0.98]"
                              >
                                {previewConfig.entryText}
                              </button>
                            ) : (
                              <button
                                onClick={handleDisabledClick}
                                className="w-full py-3.5 bg-ink-700 text-ink-400 font-medium rounded-card text-center border border-ink-600 opacity-60 cursor-not-allowed flex items-center justify-center gap-2"
                              >
                                <Lock className="w-4 h-4" />
                                此活动不对您开放
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="absolute -bottom-9 left-1/2 -translate-x-1/2 text-center whitespace-nowrap">
                    <p className={`text-xs font-medium ${
                      previewConfig.showEntry ? 'text-accent-green' : 'text-ink-500'
                    }`}>
                      {previewConfig.showEntry
                        ? `✓ ${userRoles[selectedRole].label}可见领取入口`
                        : `✗ ${userRoles[selectedRole].label}不可见入口`}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-14">
                <h4 className="font-medium text-white mb-4 flex items-center gap-2">
                  <Info className="w-4 h-4 text-accent-orange" />
                  发放提示 & 使用说明
                  <span className="text-xs text-ink-500 font-normal ml-auto">
                    {userRoles[selectedRole].label}视角
                  </span>
                </h4>
                <div className="space-y-2">
                  {previewConfig.usageTips.map((tip, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 bg-ink-800/50 rounded-card border border-ink-700/50"
                    >
                      <div className="w-6 h-6 rounded-full bg-accent-orange/20 text-accent-orange flex items-center justify-center flex-shrink-0 text-sm font-semibold mt-0.5">
                        {index + 1}
                      </div>
                      <p className="text-paper-200 text-sm leading-relaxed">{tip}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          <div className="relative w-full max-w-lg bg-ink-800 border border-ink-600 rounded-card shadow-2xl animate-fade-in overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent-orange via-accent-yellow to-accent-orange" />

            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-display text-xl font-bold text-white flex items-center gap-2">
                  <Gift className="w-6 h-6 text-accent-orange" />
                  {config.name || template?.name} · 券包说明
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-ink-700 rounded-card transition-colors"
                >
                  <X className="w-5 h-5 text-ink-400" />
                </button>
              </div>

              {!previewConfig.showEntry && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/40 rounded-card flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <span className="text-red-400 font-medium text-sm">您当前身份不可领取此活动</span>
                </div>
              )}

              <div className="space-y-5">
                <div className="p-4 bg-gradient-to-r from-accent-orange/15 via-accent-yellow/10 to-accent-orange/15 rounded-card border border-accent-orange/30">
                  <p className="text-paper-100 whitespace-pre-line leading-relaxed text-sm">
                    {previewConfig.description || '券包内容说明（根据配置动态生成）'}
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-white mb-3 text-sm flex items-center gap-2">
                    <Gift className="w-4 h-4 text-accent-orange" />
                    券包包含内容
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    <StatCard number={config.ticketCount} label="张阅读券" accent />
                    <StatCard number={selectedComics.length} label="部作品" />
                    <StatCard
                      number={
                        getValidityPeriod(config.validFrom, config.validTo)
                          .match(/共 (\d+) 天/)?.[1] || '-'
                      }
                      label="天有效期"
                    />
                  </div>
                </div>

                {selectedComics.length > 0 && (
                  <div>
                    <h4 className="font-medium text-white mb-3 text-sm flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-accent-orange" />
                      适用作品与券分配
                    </h4>
                    <div className="space-y-2">
                      {selectedComics.map((comic) => {
                        const count = allocMap.get(comic?.id || '') || 0;
                        const ranges = config.chapterRanges.filter(r => r.comicId === comic?.id);
                        const min = ranges.length > 0 ? Math.min(...ranges.map(r => r.startChapter)) : 0;
                        const max = ranges.length > 0 ? Math.max(...ranges.map(r => r.endChapter)) : 0;
                        return (
                          <div
                            key={comic?.id}
                            className="flex items-center gap-3 p-3 bg-ink-900/50 rounded-card border border-ink-700/50"
                          >
                            <img
                              src={comic?.cover}
                              alt={comic?.title}
                              className="w-9 h-12 object-cover rounded flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-sm font-medium truncate">
                                {comic?.title}
                              </p>
                              <p className="text-ink-500 text-[11px]">
                                {count > 0 && ranges.length > 0
                                  ? `第${min}-${max}话`
                                  : '未分配'}
                              </p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-accent-orange text-base font-bold">{count}</p>
                              <p className="text-ink-600 text-[10px]">张券</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="font-medium text-white mb-3 text-sm flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-accent-orange" />
                    使用规则
                  </h4>
                  <ul className="space-y-2 text-sm text-paper-200">
                    <RuleItem text={`每张券可抵扣一话付费章节（共${config.ticketCount}张券）`} />
                    <RuleItem text={`有效期：${getValidityPeriod(config.validFrom, config.validTo)}`} />
                    <RuleItem
                      text={config.singleBookOnly
                        ? '⚠️ 使用限制：仅限选择其中一部作品使用'
                        : '✅ 使用限制：可用于多部作品，分别抵扣对应章节'}
                    />
                    <RuleItem text={`适用人群：${getEligibilityDescription(config.type)}`} />
                    <RuleItem text={`领取限制：每人限领 ${config.audienceRules?.find(r => r.role === selectedRole)?.limitPerUser ?? 1} 份`} />
                    <RuleItem text="券包仅限本人账号使用，不可转让、不可兑现" />
                    <RuleItem text="领取后立即生效，逾期未使用自动失效" />
                    {config.chapterRanges.some(r => r.extraChapterIds.length > 0) && (
                      <RuleItem
                        text="⚠️ 注意：本券包包含付费番外章节，具体范围见上方作品列表"
                        highlight
                      />
                    )}
                  </ul>
                </div>
              </div>

              <button
                onClick={() => setShowModal(false)}
                className="w-full mt-6 btn-primary"
              >
                我知道了
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between pt-4">
        <button onClick={handleBack} className="btn-secondary flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          返回配置
        </button>
        <button onClick={handleNext} className="btn-primary flex items-center gap-2">
          生成摘要
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function ConfigRow({
  icon: Icon,
  label,
  value,
  multiLine,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  multiLine?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="w-4 h-4 text-ink-500 mt-0.5 flex-shrink-0" />
      <div className={`flex-1 min-w-0 ${multiLine ? '' : 'flex items-center justify-between gap-2'}`}>
        <span className="text-ink-400 flex-shrink-0">{label}</span>
        <span className={`text-white font-medium ${multiLine ? 'mt-1 block' : 'text-right'}`}>
          {value || '-'}
        </span>
      </div>
    </div>
  );
}

function StatCard({
  number,
  label,
  accent,
}: {
  number: string | number;
  label: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`p-3 rounded-card text-center border ${
        accent
          ? 'bg-accent-orange/10 border-accent-orange/30'
          : 'bg-ink-900/50 border-ink-700/50'
      }`}
    >
      <p className={`text-2xl font-bold ${accent ? 'text-accent-orange' : 'text-white'}`}>
        {number}
      </p>
      <p className="text-[11px] text-ink-500 mt-0.5">{label}</p>
    </div>
  );
}

function RuleItem({ text, highlight }: { text: string; highlight?: boolean }) {
  return (
    <li className={`flex items-start gap-2 p-2 rounded ${highlight ? 'bg-accent-yellow/10' : ''}`}>
      <span className={`w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 ${
        highlight ? 'bg-accent-yellow' : 'bg-accent-orange'
      }`} />
      <span className={highlight ? 'text-accent-yellow' : 'text-paper-200'}>{text}</span>
    </li>
  );
}
