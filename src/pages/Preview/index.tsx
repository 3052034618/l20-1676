import { useState } from 'react';
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
} from 'lucide-react';
import type { UserRoleType } from '@/types';
import { userRoles, getPreviewConfig } from '@/mock/couponTemplates';
import { useCouponStore } from '@/store/useCouponStore';
import { couponTemplates } from '@/mock/couponTemplates';
import { formatDate, getValidityPeriod } from '@/utils/formatters';
import { getComicById } from '@/mock/comics';

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
  const previewConfig = getPreviewConfig(config.type, selectedRole);
  const selectedComics = config.selectedComicIds
    .map(id => getComicById(id))
    .filter(Boolean);

  const handleClaim = () => {
    if (!previewConfig.showEntry) return;
    setShowClaimed(true);
    setTimeout(() => setShowClaimed(false), 3000);
  };

  const handleBack = () => {
    navigate('/config');
  };

  const handleNext = () => {
    navigate('/summary');
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">发放预览</h1>
          <p className="text-ink-400 mt-1">模拟不同用户角色看到的活动效果</p>
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
                      <div>
                        <p className="font-semibold">{roleData.label}</p>
                        <p className={`text-sm ${isSelected ? 'text-paper-200' : 'text-ink-500'}`}>
                          {roleData.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-display text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Info className="w-5 h-5 text-accent-orange" />
                券包信息
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-ink-400">券包类型</span>
                  <span className="text-white font-medium">{template?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-400">券张数</span>
                  <span className="text-white font-medium">{config.ticketCount} 张</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-400">有效期</span>
                  <span className="text-white font-medium text-right">
                    {formatDate(config.validFrom)}
                    <br />
                    至 {formatDate(config.validTo)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-400">适用漫画</span>
                  <span className="text-white font-medium text-right">
                    {selectedComics.length} 部
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-400">使用限制</span>
                  <span className="text-white font-medium">
                    {config.singleBookOnly ? '仅限单本' : '多本可用'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="card p-6">
              <h3 className="font-display text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-accent-orange" />
                手机端预览
                <span className="ml-auto text-sm font-normal text-ink-500">
                  {userRoles[selectedRole].label} 视角
                </span>
              </h3>

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
                              <div className="aspect-[3/1] bg-gradient-to-r from-accent-orange/20 via-accent-yellow/20 to-accent-orange/20 flex items-center justify-center">
                                <div className="text-center">
                                  <p className="text-accent-orange font-display text-lg font-bold">
                                    {template?.name}
                                  </p>
                                  <p className="text-ink-400 text-xs mt-1">
                                    {getValidityPeriod(config.validFrom, config.validTo)}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-3">
                              {selectedComics.slice(0, 3).map((comic) => (
                                <div
                                  key={comic?.id}
                                  className="flex items-center gap-3 p-3 bg-ink-800/50 rounded-card"
                                >
                                  <img
                                    src={comic?.cover}
                                    alt={comic?.title}
                                    className="w-12 h-16 object-cover rounded"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-white text-sm font-medium truncate">
                                      {comic?.title}
                                    </p>
                                    <p className="text-ink-500 text-xs">
                                      {comic?.author}
                                    </p>
                                  </div>
                                </div>
                              ))}
                              {selectedComics.length > 3 && (
                                <p className="text-center text-ink-500 text-xs">
                                  还有 {selectedComics.length - 3} 部作品...
                                </p>
                              )}
                            </div>

                            <button
                              onClick={() => setShowModal(true)}
                              className="w-full text-center text-accent-orange text-sm hover:underline"
                            >
                              查看完整券包说明
                            </button>
                          </div>

                          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-ink-950 via-ink-950/95 to-transparent pt-12">
                            {showClaimed ? (
                              <div className="w-full py-3 bg-accent-green text-ink-950 font-semibold rounded-card flex items-center justify-center gap-2 animate-bounce-subtle">
                                <CheckCircle2 className="w-5 h-5" />
                                领取成功！
                              </div>
                            ) : previewConfig.showEntry ? (
                              <button
                                onClick={handleClaim}
                                className="w-full py-3 bg-gradient-to-r from-accent-orange to-accent-yellow text-ink-950 font-semibold rounded-card shadow-lg hover:shadow-xl transition-all duration-300 animate-pulse-slow"
                              >
                                {previewConfig.entryText}
                              </button>
                            ) : (
                              <div className="w-full py-3 bg-ink-700 text-ink-400 font-medium rounded-card text-center">
                                {previewConfig.entryText}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-center">
                    <p className="text-ink-500 text-xs">
                      {previewConfig.showEntry
                        ? '✓ 该用户可看到领取入口'
                        : '✗ 该用户无法看到领取入口'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-12">
                <h4 className="font-medium text-white mb-4">使用提示</h4>
                <div className="space-y-2">
                  {previewConfig.usageTips.map((tip, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 bg-ink-800/50 rounded-card"
                    >
                      <div className="w-6 h-6 rounded-full bg-accent-orange/20 text-accent-orange flex items-center justify-center flex-shrink-0 text-sm font-medium mt-0.5">
                        {index + 1}
                      </div>
                      <p className="text-paper-200 text-sm">{tip}</p>
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
          <div className="relative w-full max-w-lg bg-ink-800 border border-ink-600 rounded-card shadow-2xl animate-fade-in overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent-orange via-accent-yellow to-accent-orange" />
            
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-display text-xl font-bold text-white flex items-center gap-2">
                  <Gift className="w-6 h-6 text-accent-orange" />
                  券包说明
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-ink-700 rounded-card transition-colors"
                >
                  <X className="w-5 h-5 text-ink-400" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-accent-orange/10 to-accent-yellow/10 rounded-card border border-accent-orange/20">
                  <p className="text-paper-100">{previewConfig.description}</p>
                </div>

                <div>
                  <h4 className="font-medium text-white mb-2">包含内容</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-ink-900/50 rounded-card text-center">
                      <p className="text-2xl font-bold text-accent-orange">{config.ticketCount}</p>
                      <p className="text-xs text-ink-500">张阅读券</p>
                    </div>
                    <div className="p-3 bg-ink-900/50 rounded-card text-center">
                      <p className="text-2xl font-bold text-white">{selectedComics.length}</p>
                      <p className="text-xs text-ink-500">部作品</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-white mb-2">使用规则</h4>
                  <ul className="space-y-2 text-sm text-paper-200">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent-orange mt-2 flex-shrink-0" />
                      每张券可抵扣一话付费章节
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent-orange mt-2 flex-shrink-0" />
                      有效期：{getValidityPeriod(config.validFrom, config.validTo)}
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent-orange mt-2 flex-shrink-0" />
                      {config.singleBookOnly ? '仅限选择其中一部作品使用' : '可用于多部作品'}
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent-orange mt-2 flex-shrink-0" />
                      券包仅限本人使用，不可转让
                    </li>
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
