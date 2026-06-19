import { useState } from 'react';
import { Ticket, AlertTriangle, ChevronDown, ChevronUp, BookOpen } from 'lucide-react';
import { useCouponStore } from '@/store/useCouponStore';
import { getComicById } from '@/mock/comics';
import { getChaptersInRange, hasExtraInRange } from '@/utils/validators';

export default function ChapterRangePreview() {
  const { config } = useCouponStore();
  const [expandedCoupons, setExpandedCoupons] = useState<number[]>([]);

  const toggleExpand = (index: number) => {
    setExpandedCoupons(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  if (!config.type) {
    return (
      <div className="space-y-4">
        <h3 className="font-display text-lg font-semibold text-white flex items-center gap-2">
          <Ticket className="w-5 h-5 text-accent-orange" />
          章节抵扣范围预览
        </h3>
        <div className="p-8 text-center border-2 border-dashed border-ink-700 rounded-card">
          <BookOpen className="w-12 h-12 text-ink-600 mx-auto mb-3" />
          <p className="text-ink-500">请先选择券包类型并绑定漫画</p>
        </div>
      </div>
    );
  }

  if (config.chapterRanges.length === 0) {
    return (
      <div className="space-y-4">
        <h3 className="font-display text-lg font-semibold text-white flex items-center gap-2">
          <Ticket className="w-5 h-5 text-accent-orange" />
          章节抵扣范围预览
        </h3>
        <div className="p-8 text-center border-2 border-dashed border-ink-700 rounded-card">
          <Ticket className="w-12 h-12 text-ink-600 mx-auto mb-3" />
          <p className="text-ink-500">请选择漫画以自动计算章节抵扣范围</p>
        </div>
      </div>
    );
  }

  const hasExtraWarnings = config.chapterRanges.some(r => r.extraChapterIds.length > 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold text-white flex items-center gap-2">
          <Ticket className="w-5 h-5 text-accent-orange" />
          章节抵扣范围预览
          <span className="text-xs font-normal text-ink-500">
            (共 {config.chapterRanges.length} 张券)
          </span>
        </h3>
        {hasExtraWarnings && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-accent-yellow/10 border border-accent-yellow/30 rounded-card">
            <AlertTriangle className="w-4 h-4 text-accent-yellow" />
            <span className="text-sm text-accent-yellow">包含付费番外，请确认</span>
          </div>
        )}
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
        {config.chapterRanges.map((range) => {
          const comic = getComicById(range.comicId);
          if (!comic) return null;

          const chapters = getChaptersInRange(comic, range.startChapter, range.endChapter);
          const hasExtra = range.extraChapterIds.length > 0;
          const isExpanded = expandedCoupons.includes(range.couponIndex);
          const extraChapters = chapters.filter(ch => ch.isExtra);

          return (
            <div
              key={range.couponIndex}
              className={`card overflow-hidden transition-all duration-300 ${
                hasExtra ? 'border-accent-yellow/50' : ''
              }`}
            >
              <button
                onClick={() => toggleExpand(range.couponIndex)}
                className="w-full p-4 flex items-center justify-between hover:bg-ink-700/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-card flex items-center justify-center font-bold ${
                    hasExtra ? 'bg-accent-yellow/20 text-accent-yellow' : 'bg-accent-orange/20 text-accent-orange'
                  }`}>
                    {range.couponIndex}
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-white">
                      券{range.couponIndex} - {comic.title}
                    </p>
                    <p className="text-sm text-ink-400">
                      第{range.startChapter}话 ~ 第{range.endChapter}话
                      <span className="text-ink-600 mx-2">|</span>
                      共 {chapters.length} 话
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {hasExtra && (
                    <span className="tag bg-accent-yellow/20 text-accent-yellow text-xs border border-accent-yellow/30">
                      <AlertTriangle className="w-3 h-3" />
                      含番外
                    </span>
                  )}
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-ink-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-ink-500" />
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-ink-700 p-4 bg-ink-900/50">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                    {chapters.map((chapter) => (
                      <div
                        key={chapter.id}
                        className={`p-2 rounded-card text-center text-sm transition-all ${
                          chapter.isExtra
                            ? 'bg-accent-yellow/10 border border-accent-yellow/30 text-accent-yellow'
                            : chapter.isFree
                            ? 'bg-ink-700/50 text-ink-400'
                            : 'bg-ink-700 text-paper-200'
                        }`}
                      >
                        <p className="font-medium truncate">第{chapter.chapterNo}话</p>
                        {chapter.isExtra && (
                          <p className="text-xs text-accent-yellow mt-0.5">番外</p>
                        )}
                        {chapter.isFree && (
                          <p className="text-xs text-accent-green mt-0.5">免费</p>
                        )}
                      </div>
                    ))}
                  </div>

                  {hasExtra && (
                    <div className="mt-4 p-3 bg-accent-yellow/10 border border-accent-yellow/30 rounded-card">
                      <p className="text-sm text-accent-yellow flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>
                          此券包含 <strong>{extraChapters.length}</strong> 个付费番外章节：
                          {extraChapters.map(ch => `第${ch.chapterNo}话`).join('、')}
                          <br />
                          请确认是否需要将番外纳入活动范围。
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
