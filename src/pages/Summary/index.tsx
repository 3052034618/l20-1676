import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight,
  Copy, Check, FileText, BookOpen, ListChecks, MessageCircle,
  Download, Gift, AlertTriangle, Save, RotateCcw, History, GitCompare,
  Trash2, Clock, XCircle, CheckCircle2, CircleDot, BookOpenCheck,
  Handshake, Headphones, Pencil, Plus, Minus, ChevronDown, ChevronUp,
  Eye, PanelRightClose, Rocket, BarChart3, Users, TrendingUp, TrendingDown,
  Activity, Target,
} from 'lucide-react';
import { useCouponStore } from '@/store/useCouponStore';
import {
  generateActivitySummary,
  copyToClipboard,
  getValidityPeriod,
  getOverallStatusLabel,
  getApprovalStatusLabel,
  getApprovalStatusColor,
  DEPARTMENT_LIST,
  formatDateTime,
  formatFieldForDiff,
  getActivityStatusLabel,
  getActivityStatusBadgeClass,
  getActivityStatusColor,
  getLaunchChecklistSummary,
} from '@/utils/formatters';
import { couponTemplates } from '@/mock/couponTemplates';
import type { ActivitySummary, DepartmentType, ApprovalStatus, CouponPackVersion, VersionDiff } from '@/types';

type TabType = 'books' | 'rules' | 'scripts' | 'approvals' | 'launch' | 'dashboard' | 'versions';

export default function Summary() {
  const navigate = useNavigate();
  const {
    config,
    approvals,
    versions,
    currentVersionNo,
    saveVersion,
    restoreVersion,
    deleteVersion,
    getVersionDiff,
    updateApproval,
    resetApprovals,
    getLaunchChecklist,
    publishActivity,
    endActivity,
    getDashboard,
  } = useCouponStore();

  const [activeTab, setActiveTab] = useState<TabType>('books');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveLog, setSaveLog] = useState('');
  const [operator, setOperator] = useState('运营专员');
  const [remarkMap, setRemarkMap] = useState<Record<string, string>>({});

  const [showDiffModal, setShowDiffModal] = useState(false);
  const [diffV1, setDiffV1] = useState<string>('');
  const [diffV2, setDiffV2] = useState<string>('');

  const [publishToast, setPublishToast] = useState<string | null>(null);

  const template = config.type ? couponTemplates[config.type] : null;

  const summary = useMemo<ActivitySummary | null>(() => {
    if (!config.type) return null;
    return generateActivitySummary(config, approvals);
  }, [config, approvals]);

  const handleCopy = async (text: string, index: number) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    }
  };

  const handleCopyAll = async () => {
    if (!summary) return;
    const allText = `【${config.name || template?.name}】活动摘要

一、活动基本信息
券包类型：${template?.name || '自定义'}
总券数：${config.ticketCount}张
有效期：${getValidityPeriod(config.validFrom, config.validTo)}
适用人群：${summary.rules.find(r => r.includes('适用人群'))?.replace('适用人群：', '') || '-'}

二、预计覆盖书单
${summary.comicList.map((item, i) => `${i + 1}. 《${item.comic.title}》- ${item.comic.author}
   券数：${item.ticketCount}张 | 覆盖${item.chapterCount}话
   范围：${item.range}`).join('\n')}

三、领取规则
${summary.rules.map((rule, i) => `${i + 1}. ${rule}`).join('\n')}

四、客服话术
${summary.customerServiceScripts.map((script) => `【${script.title}】
${script.content}
`).join('\n')}`;

    const success = await copyToClipboard(allText);
    if (success) {
      setCopiedIndex(-1);
      setTimeout(() => setCopiedIndex(null), 2000);
    }
  };

  const handlePublish = () => {
    const success = publishActivity();
    if (!success) {
      const checklist = getLaunchChecklist();
      const failed = checklist.filter(i => !i.passed).length;
      setPublishToast(`还有 ${failed} 项未通过，请先完成检查`);
      setTimeout(() => setPublishToast(null), 3000);
    }
  };

  const handleSaveVersion = () => {
    const name = saveName.trim() || `版本 ${versions.length + 1}`;
    saveVersion(name, saveLog.trim() || '保存当前配置');
    setShowSaveModal(false);
    setSaveName('');
    setSaveLog('');
    setActiveTab('versions');
  };

  const handleRestore = (v: CouponPackVersion) => {
    if (confirm(`确定要恢复到「${v.versionName}」吗？当前未保存的修改将丢失。`)) {
      restoreVersion(v.versionId);
    }
  };

  const handleDelete = (v: CouponPackVersion) => {
    if (confirm(`确定要删除版本「${v.versionName}」吗？此操作不可撤销。`)) {
      deleteVersion(v.versionId);
    }
  };

  const handleApprove = (dept: DepartmentType, approved: boolean) => {
    const deptInfo = approvals.find(a => a.department === dept);
    const remark = remarkMap[dept] || '';
    updateApproval(dept, approved ? 'approved' : 'rejected', remark, operator);
  };

  const currentDiffs = useMemo<VersionDiff[]>(() => {
    if (!diffV1 || !diffV2) return [];
    return getVersionDiff(diffV1, diffV2);
  }, [diffV1, diffV2, getVersionDiff]);

  const handleBack = () => navigate('/preview');
  const handleToConfig = () => navigate('/config');

  const launchChecklist = useMemo(() => getLaunchChecklist(), [getLaunchChecklist]);
  const launchSummary = useMemo(() => getLaunchChecklistSummary(launchChecklist), [launchChecklist]);
  const dashboard = useMemo(() => getDashboard(), [getDashboard]);

  const tabs = [
    { id: 'books' as TabType, label: '覆盖书单', icon: BookOpen },
    { id: 'rules' as TabType, label: '领取规则', icon: ListChecks },
    { id: 'scripts' as TabType, label: '客服话术', icon: MessageCircle },
    { id: 'approvals' as TabType, label: '多部门确认', icon: BookOpenCheck, badge: summary?.overallStatus },
    { id: 'launch' as TabType, label: '上线检查', icon: Rocket, badge: launchSummary.allPassed ? 'approved' as ApprovalStatus : launchSummary.passed > 0 ? 'pending' as ApprovalStatus : undefined },
    { id: 'dashboard' as TabType, label: '数据看板', icon: BarChart3 },
    { id: 'versions' as TabType, label: '版本历史', icon: History, badgeNum: versions.length },
  ];

  if (!config.type || !summary) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-white">活动摘要</h1>
            <p className="text-ink-400 mt-1">生成活动摘要、多部门确认、版本管理</p>
          </div>
          <button onClick={handleBack} className="btn-secondary flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            返回预览
          </button>
        </div>
        <div className="card p-12 text-center">
          <FileText className="w-16 h-16 text-ink-600 mx-auto mb-4" />
          <h3 className="font-display text-xl font-semibold text-white mb-2">请先配置券包</h3>
          <p className="text-ink-400 mb-6">请先完成券包配置后再生成活动摘要</p>
          <button onClick={handleToConfig} className="btn-primary">前往配置</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold text-white">活动摘要</h1>
            <p className="text-ink-400 mt-1">确认覆盖范围、规则话术，多部门审批、版本留痕</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button onClick={handleBack} className="btn-secondary flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              返回预览
            </button>
            <button
              onClick={() => setShowSaveModal(true)}
              className="btn-secondary flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              保存版本
            </button>
            <button
              onClick={handlePublish}
              disabled={!launchSummary.allPassed}
              className={`flex items-center gap-2 disabled:opacity-50 ${launchSummary.allPassed ? 'btn-secondary border-accent-green/50 text-accent-green hover:bg-accent-green/20' : 'btn-secondary'}`}
            >
              <Rocket className="w-4 h-4" />
              发布活动
            </button>
            <button onClick={handleCopyAll} className="btn-primary flex items-center gap-2">
              {copiedIndex === -1 ? (
                <><Check className="w-4 h-4 text-ink-950" />已复制</>
              ) : (
                <><Copy className="w-4 h-4" />复制摘要</>
              )}
            </button>
          </div>
        </div>

        {publishToast && (
          <div className="fixed top-6 right-6 z-50 animate-fade-in">
            <div className="flex items-center gap-2 px-4 py-3 bg-red-500/15 border border-red-500/40 rounded-card text-red-400">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium">{publishToast}</span>
            </div>
          </div>
        )}

      <div className="card p-6 space-y-6">
        <div className="flex flex-wrap items-center gap-6 p-4 bg-gradient-to-r from-accent-orange/10 to-accent-yellow/10 rounded-card border border-accent-orange/20">
          <div className="w-14 h-14 bg-gradient-to-br from-accent-orange to-accent-yellow rounded-card flex items-center justify-center flex-shrink-0">
            <Gift className="w-7 h-7 text-ink-950" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-display text-xl font-bold text-white truncate">
                {config.name || template?.name}
              </h2>
              <span className={`text-[11px] px-2 py-0.5 rounded-full border ${getActivityStatusBadgeClass(config.activityStatus)}`}>
                {getActivityStatusLabel(config.activityStatus)}
              </span>
              <span className="text-xs text-ink-400">
                {getOverallStatusLabel(summary.overallStatus)}
              </span>
              {currentVersionNo > 0 && (
                <span className="text-xs px-2 py-0.5 bg-ink-800 text-ink-400 rounded border border-ink-700">
                  版本 V{currentVersionNo}
                </span>
              )}
            </div>
            <p className="text-ink-400 text-sm mt-0.5">{template?.description}</p>
          </div>
          <div className="flex flex-wrap gap-6 text-sm">
            <div className="text-center"><p className="text-ink-500 text-xs">券数</p><p className="text-accent-orange font-bold text-lg">{config.ticketCount}</p></div>
            <div className="text-center"><p className="text-ink-500 text-xs">作品</p><p className="text-white font-semibold text-lg">{summary.comicList.length}</p></div>
            <div className="text-center"><p className="text-ink-500 text-xs">章节</p><p className="text-accent-green font-semibold text-lg">{summary.comicList.reduce((s, i) => s + i.chapterCount, 0)}</p></div>
          </div>
        </div>

        <div className="flex gap-2 mb-2 border-b border-ink-700 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const badge = tab.badge;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 whitespace-nowrap transition-all duration-200 ${
                  isActive
                    ? 'border-accent-orange text-accent-orange'
                    : 'border-transparent text-ink-500 hover:text-paper-200'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="font-medium">{tab.label}</span>
                {badge === 'approved' && <CheckCircle2 className="w-4 h-4 text-accent-green" />}
                {badge === 'rejected' && <XCircle className="w-4 h-4 text-red-400" />}
                {badge === 'pending' && <CircleDot className="w-4 h-4 text-accent-yellow" />}
                {tab.badgeNum !== undefined && tab.badgeNum > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-accent-orange/20 text-accent-orange' : 'bg-ink-800 text-ink-400'
                  }`}>{tab.badgeNum}</span>
                )}
              </button>
            );
          })}
        </div>

        {activeTab === 'books' && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-accent-orange" />
                预计覆盖书单（含每部作品详细章节范围）
              </h3>
              <button className="btn-ghost text-sm flex items-center gap-2">
                <Download className="w-4 h-4" />
                导出版权清单
              </button>
            </div>
            <div className="overflow-x-auto rounded-card border border-ink-700">
              <table className="w-full min-w-[820px]">
                <thead>
                  <tr className="bg-ink-800/50 border-b border-ink-700">
                    <th className="text-left py-3 px-4 text-ink-400 font-medium text-sm">序号</th>
                    <th className="text-left py-3 px-4 text-ink-400 font-medium text-sm">作品信息</th>
                    <th className="text-left py-3 px-4 text-ink-400 font-medium text-sm">分配券数</th>
                    <th className="text-left py-3 px-4 text-ink-400 font-medium text-sm">章节覆盖范围</th>
                    <th className="text-center py-3 px-4 text-ink-400 font-medium text-sm">章节数</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.comicList.map((item, index) => {
                    const hasExtra = item.ranges.some(r => r.extraChapterIds.length > 0);
                    return (
                      <tr
                        key={item.comic.id}
                        className="border-b border-ink-800 hover:bg-ink-800/50 transition-colors last:border-b-0"
                      >
                        <td className="py-4 px-4 text-ink-400 align-top">{index + 1}</td>
                        <td className="py-4 px-4 align-top">
                          <div className="flex items-center gap-3">
                            <img src={item.comic.cover} alt={item.comic.title} className="w-11 h-14 object-cover rounded flex-shrink-0" />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="text-white font-medium truncate">{item.comic.title}</p>
                                {hasExtra && (
                                  <span className="text-[9px] px-1 py-0.5 bg-accent-yellow/20 text-accent-yellow rounded">含番外</span>
                                )}
                              </div>
                              <p className="text-ink-500 text-xs truncate">{item.comic.author}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 align-top">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-accent-orange/15 text-accent-orange text-sm font-semibold border border-accent-orange/30">
                            {item.ticketCount} 张
                          </span>
                        </td>
                        <td className="py-4 px-4 align-top">
                          <div className="space-y-1.5">
                            {item.ranges.length > 0 ? item.ranges.map((r, i) => {
                              const extra = r.extraChapterIds.length > 0;
                              return (
                                <div
                                  key={i}
                                  className={`text-xs px-2 py-1 rounded inline-flex items-center gap-1 ${
                                    extra
                                      ? 'bg-accent-yellow/10 text-accent-yellow border border-accent-yellow/20'
                                      : 'bg-ink-800 text-paper-200'
                                  }`}
                                >
                                  <span className="text-ink-500">券{r.couponIndex}:</span>
                                  <span>第{r.startChapter}-{r.endChapter}话</span>
                                  {extra && <AlertTriangle className="w-3 h-3" />}
                                </div>
                              );
                            }) : (
                              <span className="text-ink-500 text-xs">未分配</span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center align-top">
                          <span className="tag tag-active">{item.chapterCount} 话</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-4 p-4 bg-ink-800/50 rounded-card flex flex-wrap items-center gap-4 text-sm">
              <p className="text-ink-400">
                共覆盖 <span className="text-accent-orange font-semibold">{summary.comicList.length}</span> 部作品
              </p>
              <span className="text-ink-700">|</span>
              <p className="text-ink-400">
                总券数 <span className="text-accent-orange font-semibold">{config.ticketCount}</span> 张
              </p>
              <span className="text-ink-700">|</span>
              <p className="text-ink-400">
                预计覆盖 <span className="text-accent-green font-semibold">
                  {summary.comicList.reduce((sum, item) => sum + item.chapterCount, 0)}
                </span> 话付费章节
              </p>
            </div>
          </div>
        )}

        {activeTab === 'rules' && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <ListChecks className="w-5 h-5 text-accent-orange" />
                领取与使用规则
              </h3>
              <button onClick={() => handleCopy(summary.rules.join('\n'), -2)} className="btn-ghost text-sm flex items-center gap-2">
                {copiedIndex === -2 ? <><Check className="w-4 h-4 text-accent-green" />已复制</> : <><Copy className="w-4 h-4" />复制规则</>}
              </button>
            </div>
            <div className="space-y-2">
              {summary.rules.map((rule, index) => (
                <div key={index} className="flex items-start gap-4 p-4 bg-ink-800/50 rounded-card hover:bg-ink-800 transition-colors border border-ink-700/50">
                  <div className="w-8 h-8 rounded-full bg-accent-orange/20 text-accent-orange flex items-center justify-center flex-shrink-0 font-bold text-sm">
                    {index + 1}
                  </div>
                  <p className="text-paper-200 leading-relaxed pt-0.5">{rule}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'scripts' && (
          <div className="animate-fade-in">
            <div className="flex items-center gap-2 mb-4 p-3 bg-accent-yellow/10 border border-accent-yellow/30 rounded-card">
              <AlertTriangle className="w-5 h-5 text-accent-yellow flex-shrink-0" />
              <p className="text-sm text-accent-yellow">客服话术已根据当前配置自动生成，包含作品分配明细和章节范围。</p>
            </div>
            <div className="grid gap-4">
              {summary.customerServiceScripts.map((script, index) => (
                <div key={index} className="card p-5 relative group border border-ink-700/50">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-semibold text-white flex items-center gap-2">
                      <MessageCircle className="w-5 h-5 text-accent-orange" />
                      {script.title}
                    </h4>
                    <button onClick={() => handleCopy(script.content, index)} className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 px-3 py-1.5 hover:bg-ink-700 rounded-card text-sm text-paper-200">
                      {copiedIndex === index ? <><Check className="w-4 h-4 text-accent-green" />已复制</> : <><Copy className="w-4 h-4" />复制</>}
                    </button>
                  </div>
                  <div className="bg-ink-900/70 rounded-card p-4 font-mono text-sm text-paper-200 whitespace-pre-wrap leading-relaxed border border-ink-800">
                    {script.content}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'approvals' && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <BookOpenCheck className="w-5 h-5 text-accent-orange" />
                多部门确认区
              </h3>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <Pencil className="w-4 h-4 text-ink-500" />
                  <span className="text-ink-400">操作人：</span>
                  <input
                    value={operator}
                    onChange={(e) => setOperator(e.target.value)}
                    className="w-28 bg-ink-900 border border-ink-700 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-accent-orange"
                    placeholder="输入姓名"
                  />
                </div>
                <button onClick={resetApprovals} className="btn-ghost text-sm flex items-center gap-1.5 text-ink-400 hover:text-red-400">
                  <RotateCcw className="w-4 h-4" />重置全部
                </button>
              </div>
            </div>

            <div className={`mb-5 p-4 rounded-card border flex items-center gap-3 ${
              summary.overallStatus === 'approved' ? 'bg-accent-green/10 border-accent-green/30' :
              summary.overallStatus === 'rejected' ? 'bg-red-500/10 border-red-500/30' :
              'bg-accent-yellow/10 border-accent-yellow/30'
            }`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                summary.overallStatus === 'approved' ? 'bg-accent-green/20' :
                summary.overallStatus === 'rejected' ? 'bg-red-500/20' : 'bg-accent-yellow/20'
              }`}>
                {summary.overallStatus === 'approved' ? <CheckCircle2 className="w-6 h-6 text-accent-green" /> :
                 summary.overallStatus === 'rejected' ? <XCircle className="w-6 h-6 text-red-400" /> :
                 <CircleDot className="w-6 h-6 text-accent-yellow" />}
              </div>
              <div>
                <p className={`font-bold ${getApprovalStatusColor(summary.overallStatus)}`}>
                  {getOverallStatusLabel(summary.overallStatus)}
                </p>
                <p className="text-xs text-ink-400 mt-0.5">
                  {summary.approvals.filter(a => a.status === 'approved').length} 个部门通过 ·
                  {summary.approvals.filter(a => a.status === 'rejected').length} 个部门打回 ·
                  {summary.approvals.filter(a => a.status === 'pending').length} 个部门待确认
                </p>
              </div>
            </div>

            <div className="grid gap-4">
              {DEPARTMENT_LIST.map((dep) => {
                const approval = approvals.find(a => a.department === dep.type) || {
                  department: dep.type, status: 'pending' as ApprovalStatus, remark: '', operator: '', updatedAt: '',
                };
                const isApproved = approval.status === 'approved';
                const isRejected = approval.status === 'rejected';
                const depIcon = dep.type === 'editor' ? BookOpenCheck :
                                dep.type === 'business' ? Handshake : Headphones;
                const Icon = depIcon;
                return (
                  <div
                    key={dep.type}
                    className={`p-5 rounded-card border transition-all ${
                      isApproved ? 'bg-ink-800/50 border-accent-green/40' :
                      isRejected ? 'bg-ink-800/50 border-red-500/40' :
                      'bg-ink-800/30 border-ink-700 hover:border-ink-600'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          isApproved ? 'bg-accent-green/20' :
                          isRejected ? 'bg-red-500/20' : 'bg-ink-700'
                        }`}>
                          <Icon className={`w-6 h-6 ${
                            isApproved ? 'text-accent-green' :
                            isRejected ? 'text-red-400' : 'text-accent-orange'
                          }`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-white font-semibold">{dep.label}部</h4>
                            <span className={`text-[11px] px-2 py-0.5 rounded-full border ${
                              isApproved ? 'bg-accent-green/15 text-accent-green border-accent-green/30' :
                              isRejected ? 'bg-red-500/15 text-red-400 border-red-500/30' :
                              'bg-accent-yellow/15 text-accent-yellow border-accent-yellow/30'
                            }`}>
                              {getApprovalStatusLabel(approval.status)}
                            </span>
                          </div>
                          <p className="text-ink-400 text-sm mt-0.5">{dep.description}</p>
                          {approval.operator && (
                            <p className="text-ink-500 text-xs mt-2 flex items-center gap-2">
                              <Pencil className="w-3 h-3" />
                              {approval.operator}
                              {approval.updatedAt && <><Clock className="w-3 h-3" />{formatDateTime(approval.updatedAt)}</>}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleApprove(dep.type, false)}
                          className={`px-4 py-2 rounded-card text-sm font-medium transition-all flex items-center gap-1.5 ${
                            isRejected
                              ? 'bg-red-500 text-ink-950'
                              : 'bg-ink-700 text-ink-300 hover:bg-red-500/20 hover:text-red-400 border border-ink-600 hover:border-red-500/50'
                          }`}
                        >
                          <XCircle className="w-4 h-4" />打回
                        </button>
                        <button
                          onClick={() => handleApprove(dep.type, true)}
                          className={`px-4 py-2 rounded-card text-sm font-medium transition-all flex items-center gap-1.5 ${
                            isApproved
                              ? 'bg-accent-green text-ink-950'
                              : 'bg-accent-green/20 text-accent-green hover:bg-accent-green/30 border border-accent-green/50'
                          }`}
                        >
                          <CheckCircle2 className="w-4 h-4" />确认通过
                        </button>
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="text-xs text-ink-500 mb-1.5 block">
                        {isApproved ? '确认意见（可选）' : isRejected ? '打回原因（必填）' : '备注说明'}
                      </label>
                      <div className="flex gap-2">
                        <input
                          value={remarkMap[dep.type] ?? approval.remark}
                          onChange={(e) => setRemarkMap(prev => ({ ...prev, [dep.type]: e.target.value }))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleApprove(dep.type, true);
                          }}
                          placeholder={isRejected ? '请说明打回原因...' : '可填写具体意见...'}
                          className={`flex-1 bg-ink-900 border rounded-lg px-3 py-2 text-sm text-white placeholder-ink-600 focus:outline-none focus:border-accent-orange ${
                            isRejected ? 'border-red-500/50' : 'border-ink-700'
                          }`}
                        />
                      </div>
                      {approval.remark && !remarkMap[dep.type] && (
                        <div className="mt-2 p-2.5 bg-ink-900/50 rounded text-xs text-ink-300 border border-ink-800">
                          <p className="text-ink-500 mb-1">上次意见：</p>
                          <p>{approval.remark}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'launch' && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Rocket className="w-5 h-5 text-accent-orange" />
                上线前检查清单
              </h3>
              <span className={`text-xs px-2.5 py-1 rounded-full border ${getActivityStatusBadgeClass(config.activityStatus)}`}>
                当前状态：{getActivityStatusLabel(config.activityStatus)}
              </span>
            </div>

            <div className={`mb-6 p-5 rounded-card border flex items-center gap-4 flex-wrap ${
              launchSummary.allPassed
                ? 'bg-accent-green/10 border-accent-green/30'
                : launchSummary.passed > 0
                ? 'bg-accent-yellow/10 border-accent-yellow/30'
                : 'bg-ink-800/50 border-ink-700'
            }`}>
              <div className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 ${
                launchSummary.allPassed ? 'bg-accent-green/20' :
                launchSummary.passed > 0 ? 'bg-accent-yellow/20' : 'bg-ink-700'
              }`}>
                {launchSummary.allPassed ? (
                  <CheckCircle2 className="w-7 h-7 text-accent-green" />
                ) : launchSummary.passed > 0 ? (
                  <Activity className="w-7 h-7 text-accent-yellow" />
                ) : (
                  <AlertTriangle className="w-7 h-7 text-ink-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-lg font-bold ${launchSummary.allPassed ? 'text-accent-green' : launchSummary.passed > 0 ? 'text-accent-yellow' : 'text-white'}`}>
                  {launchSummary.label}
                </p>
                <div className="mt-3 w-full max-w-md h-2.5 bg-ink-900 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      launchSummary.allPassed
                        ? 'bg-gradient-to-r from-accent-green to-accent-green'
                        : launchSummary.passed > 0
                        ? 'bg-gradient-to-r from-accent-orange to-accent-yellow'
                        : 'bg-ink-600'
                    }`}
                    style={{ width: `${launchSummary.total > 0 ? (launchSummary.passed / launchSummary.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
              <button
                onClick={handlePublish}
                disabled={!launchSummary.allPassed}
                className={`px-6 py-3 rounded-card font-semibold flex items-center gap-2 transition-all ${
                  launchSummary.allPassed
                    ? 'bg-gradient-to-r from-accent-orange to-accent-yellow text-ink-950 hover:shadow-lg hover:shadow-accent-orange/30'
                    : 'bg-ink-700 text-ink-500 cursor-not-allowed'
                }`}
              >
                <Rocket className="w-5 h-5" />
                立即发布活动
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {launchChecklist.map((item) => (
                <div
                  key={item.key}
                  className={`p-5 rounded-card border transition-all ${
                    item.passed
                      ? 'bg-ink-800/50 border-accent-green/40'
                      : 'bg-ink-800/30 border-ink-700 hover:border-ink-600'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className={`font-semibold ${item.passed ? 'text-white' : 'text-paper-200'}`}>
                          {item.label}
                        </h4>
                      </div>
                      <p className="text-ink-400 text-sm mt-1">{item.description}</p>
                      {item.detail && (
                        <p className={`text-xs mt-3 ${item.passed ? 'text-accent-green' : 'text-ink-500'}`}>
                          {item.detail}
                        </p>
                      )}
                    </div>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      item.passed ? 'bg-accent-green/20' : 'bg-ink-700'
                    }`}>
                      {item.passed ? (
                        <CheckCircle2 className="w-6 h-6 text-accent-green" />
                      ) : (
                        <XCircle className="w-6 h-6 text-ink-500" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-accent-orange" />
                活动数据看板
              </h3>
              {config.activityStatus === 'published' && (
                <button
                  onClick={() => {
                    if (confirm('确定要提前结束活动吗？结束后用户将无法继续领取。')) {
                      endActivity();
                    }
                  }}
                  className="btn-secondary text-sm flex items-center gap-1.5 text-red-400 border-red-500/30 hover:bg-red-500/10"
                >
                  <XCircle className="w-4 h-4" />结束活动
                </button>
              )}
            </div>

            {!dashboard ? (
              <div className="card p-12 text-center">
                <BarChart3 className="w-16 h-16 text-ink-600 mx-auto mb-4" />
                <h3 className="font-display text-xl font-semibold text-white mb-2">暂无数据</h3>
                <p className="text-ink-400">请先配置活动并发布后查看数据</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  <div className="card p-4">
                    <div className="flex items-center gap-2 text-ink-400 text-xs mb-2">
                      <Gift className="w-4 h-4" />预计发券量
                    </div>
                    <p className="text-2xl font-bold text-white">{dashboard.totalAllocated.toLocaleString()}</p>
                  </div>
                  <div className="card p-4">
                    <div className="flex items-center gap-2 text-ink-400 text-xs mb-2">
                      <CheckCircle2 className="w-4 h-4 text-accent-green" />已领取
                    </div>
                    <p className="text-2xl font-bold text-accent-green">{dashboard.totalClaimed.toLocaleString()}</p>
                    <p className="text-xs text-ink-500 mt-1 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />领取率 {(dashboard.claimRate * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="card p-4">
                    <div className="flex items-center gap-2 text-ink-400 text-xs mb-2">
                      <Target className="w-4 h-4 text-accent-orange" />已使用
                    </div>
                    <p className="text-2xl font-bold text-accent-orange">{dashboard.totalUsed.toLocaleString()}</p>
                    <p className="text-xs text-ink-500 mt-1 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />使用率 {(dashboard.usageRate * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="card p-4">
                    <div className="flex items-center gap-2 text-ink-400 text-xs mb-2">
                      <Clock className="w-4 h-4 text-red-400" />过期未用
                    </div>
                    <p className="text-2xl font-bold text-red-400">{dashboard.totalExpired.toLocaleString()}</p>
                    <p className="text-xs text-ink-500 mt-1 flex items-center gap-1">
                      <TrendingDown className="w-3 h-3" />占比 {((dashboard.totalExpired / Math.max(dashboard.totalClaimed, 1)) * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="card p-4">
                    <div className="flex items-center gap-2 text-ink-400 text-xs mb-2">
                      <Activity className="w-4 h-4 text-accent-yellow" />剩余在途
                    </div>
                    <p className="text-2xl font-bold text-accent-yellow">{dashboard.totalRemaining.toLocaleString()}</p>
                    <p className="text-xs text-ink-500 mt-1 flex items-center gap-1">
                      <Users className="w-3 h-3" />预计触达 {dashboard.estimatedReach.toLocaleString()} 人
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-2 card p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-white flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-accent-orange" />每日领取趋势
                      </h4>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded-sm bg-gradient-to-t from-accent-orange to-accent-yellow" />领取量
                        </span>
                      </div>
                    </div>
                    <div className="h-48 flex items-end gap-1 px-2">
                      {(() => {
                        const maxCount = Math.max(...dashboard.dailyClaims.map(d => d.count), 1);
                        return dashboard.dailyClaims.map((day, i) => {
                          const height = Math.max((day.count / maxCount) * 100, 4);
                          return (
                            <div key={i} className="flex-1 flex flex-col items-center justify-end min-w-0 gap-1 group">
                              <span className="text-[10px] text-ink-400 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                                {day.count.toLocaleString()}
                              </span>
                              <div
                                className="w-full bg-gradient-to-t from-accent-orange to-accent-yellow rounded-t-md transition-all hover:from-accent-orange/80 hover:to-accent-yellow/80"
                                style={{ height: `${height}%`, minHeight: '4px' }}
                              />
                              <span className="text-[10px] text-ink-500 truncate w-full text-center">
                                {day.date}
                              </span>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>

                  <div className="card p-5">
                    <h4 className="font-semibold text-white flex items-center gap-2 mb-4">
                      <Target className="w-4 h-4 text-accent-orange" />活动指标
                    </h4>
                    <div className="space-y-4">
                      <div className="p-3 bg-ink-800/50 rounded-card">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-ink-400">领取率</span>
                          <span className="text-accent-green font-bold">{(dashboard.claimRate * 100).toFixed(1)}%</span>
                        </div>
                        <div className="w-full h-2 bg-ink-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-accent-green to-accent-green rounded-full"
                            style={{ width: `${dashboard.claimRate * 100}%` }}
                          />
                        </div>
                      </div>
                      <div className="p-3 bg-ink-800/50 rounded-card">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-ink-400">使用率</span>
                          <span className="text-accent-orange font-bold">{(dashboard.usageRate * 100).toFixed(1)}%</span>
                        </div>
                        <div className="w-full h-2 bg-ink-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-accent-orange to-accent-yellow rounded-full"
                            style={{ width: `${dashboard.usageRate * 100}%` }}
                          />
                        </div>
                      </div>
                      <div className="p-3 bg-ink-800/50 rounded-card">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-ink-400 flex items-center gap-1.5">
                            <Users className="w-4 h-4" />预计触达人数
                          </span>
                          <span className="text-white font-bold">{dashboard.estimatedReach.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card p-5">
                  <h4 className="font-semibold text-white flex items-center gap-2 mb-4">
                    <BookOpen className="w-4 h-4 text-accent-orange" />按作品消耗明细
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px]">
                      <thead>
                        <tr className="border-b border-ink-700">
                          <th className="text-left py-3 px-4 text-ink-400 font-medium text-sm">作品名称</th>
                          <th className="text-right py-3 px-4 text-ink-400 font-medium text-sm">已分配</th>
                          <th className="text-right py-3 px-4 text-ink-400 font-medium text-sm">已领取</th>
                          <th className="text-right py-3 px-4 text-ink-400 font-medium text-sm">已使用</th>
                          <th className="text-right py-3 px-4 text-ink-400 font-medium text-sm">过期</th>
                          <th className="text-right py-3 px-4 text-ink-400 font-medium text-sm">剩余</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dashboard.byComic.map((stat) => (
                          <tr key={stat.comicId} className="border-b border-ink-800 hover:bg-ink-800/30 transition-colors last:border-b-0">
                            <td className="py-3 px-4 text-white font-medium">{stat.comicTitle}</td>
                            <td className="py-3 px-4 text-right text-ink-300">{stat.allocated.toLocaleString()}</td>
                            <td className="py-3 px-4 text-right text-accent-green font-medium">{stat.claimed.toLocaleString()}</td>
                            <td className="py-3 px-4 text-right text-accent-orange font-medium">{stat.used.toLocaleString()}</td>
                            <td className="py-3 px-4 text-right text-red-400">{stat.expired.toLocaleString()}</td>
                            <td className="py-3 px-4 text-right text-accent-yellow font-medium">{stat.remaining.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-white flex items-center gap-2 mb-4">
                    <Users className="w-4 h-4 text-accent-orange" />按人群消耗
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {dashboard.byRole.map((role) => {
                      const roleLabels: Record<string, { label: string; desc: string }> = {
                        new_user: { label: '新用户', desc: '注册7天内' },
                        existing_user: { label: '老用户', desc: '活跃用户' },
                        expired_member: { label: '会员过期', desc: '回流用户' },
                      };
                      const info = roleLabels[role.role] || { label: role.role, desc: '' };
                      return (
                        <div key={role.role} className="card p-5">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-accent-orange/20 flex items-center justify-center">
                              <Users className="w-5 h-5 text-accent-orange" />
                            </div>
                            <div>
                              <p className="text-white font-semibold">{info.label}</p>
                              <p className="text-xs text-ink-500">{info.desc}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-ink-800/50 rounded-card text-center">
                              <p className="text-[11px] text-ink-400 mb-1">已领取</p>
                              <p className="text-lg font-bold text-accent-green">{role.claimed.toLocaleString()}</p>
                            </div>
                            <div className="p-3 bg-ink-800/50 rounded-card text-center">
                              <p className="text-[11px] text-ink-400 mb-1">已使用</p>
                              <p className="text-lg font-bold text-accent-orange">{role.used.toLocaleString()}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'versions' && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div>
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <History className="w-5 h-5 text-accent-orange" />
                  草稿与历史版本
                </h3>
                <p className="text-ink-400 text-sm mt-1">配置的每个重要节点都可以保存为版本，便于回溯对比和恢复</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (versions.length < 2) {
                      alert('至少需要 2 个版本才能对比');
                      return;
                    }
                    setDiffV1(versions[0].versionId);
                    setDiffV2(versions[versions.length - 1].versionId);
                    setShowDiffModal(true);
                  }}
                  disabled={versions.length < 2}
                  className="btn-secondary text-sm flex items-center gap-1.5 disabled:opacity-50"
                >
                  <GitCompare className="w-4 h-4" />
                  对比版本
                </button>
                <button onClick={() => setShowSaveModal(true)} className="btn-primary text-sm flex items-center gap-1.5">
                  <Plus className="w-4 h-4" />保存为新版本
                </button>
              </div>
            </div>

            {versions.length === 0 ? (
              <div className="p-10 text-center border-2 border-dashed border-ink-700 rounded-card">
                <Save className="w-12 h-12 text-ink-600 mx-auto mb-3" />
                <p className="text-white font-medium mb-1">还没有保存过版本</p>
                <p className="text-ink-500 text-sm mb-5">保存版本后可以随时查看差异、恢复历史配置</p>
                <button onClick={() => setShowSaveModal(true)} className="btn-primary inline-flex items-center gap-2">
                  <Save className="w-4 h-4" />保存当前配置为版本 1
                </button>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-accent-orange/50 via-ink-700 to-ink-700" />
                <div className="space-y-4">
                  {[...versions].reverse().map((v, idx) => {
                    const overall = v.approvals ? (
                      v.approvals.every(a => a.status === 'approved') ? 'approved' :
                      v.approvals.some(a => a.status === 'rejected') ? 'rejected' : 'pending'
                    ) : 'pending';
                    return (
                      <div key={v.versionId} className="relative pl-16">
                        <div className={`absolute left-4 top-5 w-5 h-5 rounded-full border-4 border-ink-800 flex items-center justify-center ${
                          idx === 0 ? 'bg-accent-orange' :
                          overall === 'approved' ? 'bg-accent-green' :
                          overall === 'rejected' ? 'bg-red-500' : 'bg-ink-600'
                        }`}>
                          {idx === 0 && <Check className="w-2.5 h-2.5 text-ink-950" />}
                        </div>
                        <div className={`p-5 rounded-card border ${
                          idx === 0
                            ? 'bg-ink-800/70 border-accent-orange/40'
                            : 'bg-ink-800/40 border-ink-700 hover:border-ink-600 transition-colors'
                        }`}>
                          <div className="flex items-start justify-between gap-4 flex-wrap">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-white font-semibold">{v.versionName}</h4>
                                {idx === 0 && (
                                  <span className="text-[10px] px-2 py-0.5 bg-accent-orange/20 text-accent-orange rounded border border-accent-orange/40">
                                    当前
                                  </span>
                                )}
                                <span className="text-xs text-ink-500">V{v.versionNo}</span>
                                {overall === 'approved' && <CheckCircle2 className="w-4 h-4 text-accent-green" />}
                                {overall === 'rejected' && <XCircle className="w-4 h-4 text-red-400" />}
                              </div>
                              <div className="flex items-center gap-4 mt-2 text-xs text-ink-400 flex-wrap">
                                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{formatDateTime(v.createdAt)}</span>
                                <span className="flex items-center gap-1"><Pencil className="w-3.5 h-3.5" />{v.createdBy}</span>
                                {v.status !== 'draft' && (
                                  <span className="px-1.5 py-0.5 bg-ink-700 rounded">{v.status}</span>
                                )}
                              </div>
                              {v.changeLog && (
                                <div className="mt-3 p-2.5 bg-ink-900/60 rounded border border-ink-800">
                                  <p className="text-xs text-ink-500 mb-1">变更说明：</p>
                                  <p className="text-sm text-paper-200 leading-relaxed">{v.changeLog}</p>
                                </div>
                              )}
                              <div className="mt-3 flex flex-wrap gap-4 text-xs">
                                <span className="text-ink-400">
                                  券数: <span className="text-accent-orange font-medium">{v.config.ticketCount}</span>
                                </span>
                                <span className="text-ink-400">
                                  作品: <span className="text-white font-medium">{v.config.selectedComicIds.length}</span> 部
                                </span>
                                <span className="text-ink-400">
                                  审批: <span className={overall === 'approved' ? 'text-accent-green' : overall === 'rejected' ? 'text-red-400' : 'text-accent-yellow'}>
                                    {getApprovalStatusLabel(overall)}
                                  </span>
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <button
                                onClick={() => handleRestore(v)}
                                className="px-3 py-1.5 text-xs rounded-card bg-ink-700 text-paper-200 hover:bg-accent-orange/20 hover:text-accent-orange transition-all flex items-center gap-1.5 border border-ink-600"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />恢复
                              </button>
                              <button
                                onClick={() => {
                                  setDiffV1(v.versionId);
                                  setDiffV2(versions[versions.length - 1].versionId);
                                  setShowDiffModal(true);
                                }}
                                className="px-3 py-1.5 text-xs rounded-card bg-ink-700 text-paper-200 hover:bg-ink-600 transition-all flex items-center gap-1.5 border border-ink-600"
                              >
                                <Eye className="w-3.5 h-3.5" />对比
                              </button>
                              <button
                                onClick={() => handleDelete(v)}
                                className="px-3 py-1.5 text-xs rounded-card bg-ink-700 text-ink-400 hover:bg-red-500/20 hover:text-red-400 transition-all flex items-center gap-1.5 border border-ink-600 hover:border-red-500/50"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowSaveModal(false)} />
          <div className="relative w-full max-w-md bg-ink-800 border border-ink-600 rounded-card shadow-2xl animate-fade-in overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent-orange via-accent-yellow to-accent-orange" />
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-display text-xl font-bold text-white flex items-center gap-2">
                  <Save className="w-5 h-5 text-accent-orange" />
                  保存版本
                </h3>
                <button onClick={() => setShowSaveModal(false)} className="p-2 hover:bg-ink-700 rounded transition-colors">
                  <XCircle className="w-5 h-5 text-ink-400" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-ink-400 block mb-1.5">版本名称</label>
                  <input
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    placeholder={`版本 ${versions.length + 1}（可留空自动命名）`}
                    className="w-full bg-ink-900 border border-ink-700 rounded-lg px-3 py-2.5 text-white placeholder-ink-600 focus:outline-none focus:border-accent-orange"
                  />
                </div>
                <div>
                  <label className="text-sm text-ink-400 block mb-1.5">变更说明 <span className="text-ink-600">（可选，便于后续对比）</span></label>
                  <textarea
                    value={saveLog}
                    onChange={(e) => setSaveLog(e.target.value)}
                    placeholder="描述一下这次修改做了什么调整，比如：调整了XX作品的券分配、有效期修改..."
                    rows={4}
                    className="w-full bg-ink-900 border border-ink-700 rounded-lg px-3 py-2.5 text-white placeholder-ink-600 focus:outline-none focus:border-accent-orange resize-none"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 mt-6">
                <button onClick={() => setShowSaveModal(false)} className="flex-1 btn-secondary">取消</button>
                <button onClick={handleSaveVersion} className="flex-1 btn-primary flex items-center justify-center gap-2">
                  <Save className="w-4 h-4" />确认保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDiffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowDiffModal(false)} />
          <div className="relative w-full max-w-3xl bg-ink-800 border border-ink-600 rounded-card shadow-2xl animate-fade-in overflow-hidden max-h-[85vh] flex flex-col">
            <div className="p-5 border-b border-ink-700 flex items-center justify-between gap-3 flex-wrap">
              <h3 className="font-display text-lg font-bold text-white flex items-center gap-2">
                <GitCompare className="w-5 h-5 text-accent-orange" />
                版本差异对比
              </h3>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <select
                    value={diffV1}
                    onChange={(e) => setDiffV1(e.target.value)}
                    className="bg-ink-900 border border-ink-700 rounded px-2.5 py-1.5 text-sm text-white focus:outline-none focus:border-accent-orange"
                  >
                    {versions.map(v => <option key={v.versionId} value={v.versionId}>{v.versionName} (V{v.versionNo})</option>)}
                  </select>
                  <ArrowRight className="w-4 h-4 text-ink-500" />
                  <select
                    value={diffV2}
                    onChange={(e) => setDiffV2(e.target.value)}
                    className="bg-ink-900 border border-ink-700 rounded px-2.5 py-1.5 text-sm text-white focus:outline-none focus:border-accent-orange"
                  >
                    {versions.map(v => <option key={v.versionId} value={v.versionId}>{v.versionName} (V{v.versionNo})</option>)}
                  </select>
                </div>
                <button onClick={() => setShowDiffModal(false)} className="p-1.5 hover:bg-ink-700 rounded transition-colors">
                  <XCircle className="w-5 h-5 text-ink-400" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              {currentDiffs.length === 0 ? (
                <div className="p-12 text-center">
                  <CheckCircle2 className="w-12 h-12 text-accent-green mx-auto mb-3" />
                  <p className="text-white font-medium">两个版本配置完全一致</p>
                  <p className="text-ink-500 text-sm mt-1">请选择不同版本进行对比</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {currentDiffs.map((d, i) => (
                    <div key={i} className={`p-4 rounded-card border ${
                      d.type === 'added' ? 'bg-accent-green/10 border-accent-green/40' :
                      d.type === 'removed' ? 'bg-red-500/10 border-red-500/40' :
                      'bg-accent-yellow/10 border-accent-yellow/30'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          d.type === 'added' ? 'bg-accent-green/30 text-accent-green' :
                          d.type === 'removed' ? 'bg-red-500/30 text-red-400' :
                          'bg-accent-yellow/30 text-accent-yellow'
                        }`}>
                          {d.type === 'added' ? '新增' : d.type === 'removed' ? '移除' : '修改'}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {d.type !== 'added' && (
                          <div className="p-3 bg-ink-900/70 rounded border border-ink-800">
                            <p className="text-[10px] text-ink-500 mb-1 uppercase tracking-wider">变更前</p>
                            <p className="text-sm text-paper-200">{formatFieldForDiff(d.field, d.oldValue)}</p>
                          </div>
                        )}
                        {d.type !== 'removed' && (
                          <div className={`p-3 rounded border ${
                            d.type === 'added'
                              ? 'bg-accent-green/15 border-accent-green/30'
                              : 'bg-ink-900/70 border-ink-800'
                          }`}>
                            <p className="text-[10px] text-ink-500 mb-1 uppercase tracking-wider">变更后</p>
                            <p className={`text-sm ${d.type === 'added' ? 'text-accent-green' : 'text-paper-200'}`}>
                              {formatFieldForDiff(d.field, d.newValue)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
