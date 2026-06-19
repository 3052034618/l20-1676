import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Copy,
  Check,
  FileText,
  BookOpen,
  ListChecks,
  MessageCircle,
  Download,
  Gift,
  AlertTriangle,
} from 'lucide-react';
import { useCouponStore } from '@/store/useCouponStore';
import { generateActivitySummary, copyToClipboard, getValidityPeriod } from '@/utils/formatters';
import { couponTemplates } from '@/mock/couponTemplates';
import type { ActivitySummary } from '@/types';

type TabType = 'books' | 'rules' | 'scripts';

export default function Summary() {
  const navigate = useNavigate();
  const { config } = useCouponStore();
  const [activeTab, setActiveTab] = useState<TabType>('books');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const template = config.type ? couponTemplates[config.type] : null;
  const summary = useMemo<ActivitySummary | null>(() => {
    if (!config.type) return null;
    return generateActivitySummary(config);
  }, [config]);

  const handleCopy = async (text: string, index: number) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    }
  };

  const handleCopyAllRules = async () => {
    if (!summary) return;
    const allText = `【${config.name || template?.name}活动摘要

一、预计覆盖书单
${summary.comicList.map((item, i) => `${i + 1}. ${item.comic.title} - ${item.comic.author}
   章节范围：${item.range}（共${item.chapterCount}话`).join('\n')}

二、领取规则
${summary.rules.map((rule, i) => `${i + 1}. ${rule}`).join('\n')}

三、客服话术
${summary.customerServiceScripts.map((script) => `【${script.title}】
${script.content}

`).join('\n')}`;

    const success = await copyToClipboard(allText);
    if (success) {
      setCopiedIndex(-1);
      setTimeout(() => setCopiedIndex(null), 2000);
    }
  };

  const handleBack = () => {
    navigate('/preview');
  };

  const tabs = [
    { id: 'books' as TabType, label: '覆盖书单', icon: BookOpen },
    { id: 'rules' as TabType, label: '领取规则', icon: ListChecks },
    { id: 'scripts' as TabType, label: '客服话术', icon: MessageCircle },
  ];

  if (!config.type || !summary) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-white">活动摘要</h1>
            <p className="text-ink-400 mt-1">生成活动摘要供多部门确认</p>
          </div>
          <button onClick={handleBack} className="btn-secondary flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            返回预览
          </button>
        </div>
        <div className="card p-12 text-center">
          <FileText className="w-16 h-16 text-ink-600 mx-auto mb-4" />
          <h3 className="font-display text-xl font-semibold text-white mb-2">
            请先配置券包
          </h3>
          <p className="text-ink-400 mb-6">
            请先完成券包配置后再生成活动摘要
          </p>
          <button
            onClick={() => navigate('/config')}
            className="btn-primary"
          >
            前往配置
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">活动摘要</h1>
          <p className="text-ink-400 mt-1">生成活动摘要供多部门确认</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleCopyAllRules}
            className="btn-secondary flex items-center gap-2"
          >
            {copiedIndex === -1 ? (
              <>
                <Check className="w-4 h-4 text-accent-green" />
                已复制
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                复制全部
              </>
            )}
          </button>
          <button onClick={handleBack} className="btn-secondary flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            返回预览
          </button>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex flex-wrap items-center gap-6 p-4 bg-gradient-to-r from-accent-orange/10 to-accent-yellow/10 rounded-card border border-accent-orange/20 mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-accent-orange to-accent-yellow rounded-card flex items-center justify-center">
            <Gift className="w-7 h-7 text-ink-950" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-display text-xl font-bold text-white truncate">
              {config.name || template?.name}
            </h2>
            <p className="text-ink-400 text-sm">
              {template?.description}
            </p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="text-center">
              <p className="text-ink-500">券张数</p>
              <p className="text-accent-orange font-bold text-lg">{config.ticketCount}</p>
            </div>
            <div className="text-center">
              <p className="text-ink-500">有效期</p>
              <p className="text-white font-medium">
                {getValidityPeriod(config.validFrom, config.validTo)}
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mb-6 border-b border-ink-700">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all duration-200 ${
                  isActive
                    ? 'border-accent-orange text-accent-orange'
                    : 'border-transparent text-ink-500 hover:text-paper-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {activeTab === 'books' && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-accent-orange" />
                预计覆盖书单
              </h3>
              <button className="btn-ghost text-sm flex items-center gap-2">
                <Download className="w-4 h-4" />
                导出版权清单
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-ink-700">
                    <th className="text-left py-3 px-4 text-ink-400 font-medium text-sm">
                      序号
                    </th>
                    <th className="text-left py-3 px-4 text-ink-400 font-medium text-sm">
                      作品名称
                    </th>
                    <th className="text-left py-3 px-4 text-ink-400 font-medium text-sm">
                      作者
                    </th>
                    <th className="text-left py-3 px-4 text-ink-400 font-medium text-sm">
                      章节范围
                    </th>
                    <th className="text-center py-3 px-4 text-ink-400 font-medium text-sm">
                      覆盖章节数
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {summary.comicList.map((item, index) => (
                    <tr
                      key={item.comic.id}
                      className="border-b border-ink-800 hover:bg-ink-800/50 transition-colors"
                    >
                      <td className="py-4 px-4 text-ink-400">{index + 1}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.comic.cover}
                            alt={item.comic.title}
                            className="w-10 h-14 object-cover rounded"
                          />
                          <span className="text-white font-medium">{item.comic.title}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-paper-200">{item.comic.author}</td>
                      <td className="py-4 px-4 text-paper-200">{item.range}</td>
                      <td className="py-4 px-4 text-center">
                        <span className="tag tag-active">
                          {item.chapterCount} 话
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 p-4 bg-ink-800/50 rounded-card">
              <p className="text-sm text-ink-400">
                共覆盖 <span className="text-accent-orange font-semibold">{summary.comicList.length}</span> 部作品，
                <span className="text-white font-semibold">
                  {summary.comicList.reduce((sum, item) => sum + item.chapterCount, 0)}
                </span>{' '}
                话付费章节
              </p>
            </div>
          </div>
        )}

        {activeTab === 'rules' && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <ListChecks className="w-5 h-5 text-accent-orange" />
                领取规则
              </h3>
              <button
                onClick={() => handleCopy(summary.rules.join('\n'), -2)}
                className="btn-ghost text-sm flex items-center gap-2"
              >
                {copiedIndex === -2 ? (
                  <>
                    <Check className="w-4 h-4 text-accent-green" />
                    已复制
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    复制规则
                  </>
                )}
              </button>
            </div>
            <div className="space-y-3">
              {summary.rules.map((rule, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 p-4 bg-ink-800/50 rounded-card hover:bg-ink-800 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-accent-orange/20 text-accent-orange flex items-center justify-center flex-shrink-0 font-bold text-sm">
                    {index + 1}
                  </div>
                  <p className="text-paper-200">{rule}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'scripts' && (
          <div className="animate-fade-in">
            <div className="flex items-center gap-2 mb-4 p-3 bg-accent-yellow/10 border border-accent-yellow/30 rounded-card">
              <AlertTriangle className="w-5 h-5 text-accent-yellow flex-shrink-0" />
              <p className="text-sm text-accent-yellow">
                客服话术已根据配置自动生成，请根据实际情况调整后使用。
              </p>
            </div>
            <div className="grid gap-4">
              {summary.customerServiceScripts.map((script, index) => (
                <div
                  key={index}
                  className="card p-5 relative group"
                >
                  <div className="flex items-start justify-between mb-3">
                  <h4 className="font-semibold text-white flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-accent-orange" />
                    {script.title}
                  </h4>
                  <button
                    onClick={() => handleCopy(script.content, index)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 px-3 py-1.5 hover:bg-ink-700 rounded-card text-sm text-paper-200"
                  >
                    {copiedIndex === index ? (
                      <>
                        <Check className="w-4 h-4 text-accent-green" />
                        已复制
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        复制
                      </>
                    )}
                  </button>
                </div>
                <div className="bg-ink-900/50 rounded-card p-4 font-mono text-sm text-paper-200 whitespace-pre-wrap leading-relaxed">
                  {script.content}
                </div>
              </div>
            ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end pt-4">
        <button
          onClick={() => {
            alert('活动摘要已生成完成，可提交多部门确认！');
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Check className="w-4 h-4" />
          提交确认
        </button>
      </div>
    </div>
  );
}
