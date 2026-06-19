import { useState } from 'react';
import {
  Ticket, AlertTriangle, ChevronDown, ChevronUp, BookOpen,
  Layers
} from 'lucide-react';
import { useCouponStore } from '@/store/useCouponStore';
import { getComicById, mockComics } from '@/mock/comics';
import { getChaptersInRange } from '@/utils/validators';
import type { Comic, ChapterRange } from '@/types';

export default function ChapterRangePreview() {
  const { config } = useCouponStore();
  const [expandedComics, setExpandedComics] = useState<string[]>([]);
  const [expandedCoupons, setExpandedCoupons] = useState<Set<string>>(new Set());

  const toggleComicExpand = (comicId: string) => {
    setExpandedComics(prev =>
      prev.includes(comicId)
        ? prev.filter(id => id !== comicId)
        : [...prev, comicId]
    );
  };

  const toggleCouponExpand = (key: string) => {
    setExpandedCoupons(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  if (!config.type) {
    return (
      <div className="space-y-4">
        <h3 className="font-display text-lg font-semibold text-white flex items-center gap-2">
          <Ticket className="w-5 h-5 text-accent-orange" />
          章节抵扣范围预览（按作品分组）
        </h3>
        <div className="p-8 text-center border-2 border-dashed border-ink-700 rounded-card">
          <BookOpen className="w-12 h-12 text-ink-600 mx-auto mb-3" />
          <p className="text-ink-500">请先选择券包类型并绑定漫画</p>
        </div>
      </div>
    );
  }

  const selectedComics = mockComics.filter(c => config.selectedComicIds.includes(c.id));

  if (selectedComics.length === 0 || config.chapterRanges.length === 0) {
    return (
      <div className="space-y-4">
        <h3 className="font-display text-lg font-semibold text-white flex items-center gap-2">
          <Ticket className="w-5 h-5 text-accent-orange" />
          章节抵扣范围预览（按作品分组）
        </h3>
        <div className="p-8 text-center border-2 border-dashed border-ink-700 rounded-card">
          <Ticket className="w-12 h-12 text-ink-600 mx-auto mb-3" />
          <p className="text-ink-500">请选择漫画并分配券数以自动计算章节范围</p>
        </div>
      </div>
    );
  }

  const hasExtraWarnings = config.chapterRanges.some(r => r.extraChapterIds.length > 0);
  const totalChaptersCovered = config.chapterRanges.reduce(
    (sum, r) => sum + (r.endChapter - r.startChapter + 1), 0
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="font-display text-lg font-semibold text-white flex items-center gap-2">
          <Ticket className="w-5 h-5 text-accent-orange" />
          章节抵扣范围预览（按作品分组）
        </h3>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-xs text-ink-400">
            <Layers className="w-3.5 h-3.5 text-ink-500" />
            <span>{selectedComics.length}部作品</span>
            <span className="text-ink-600">·</span>
            <span>{config.chapterRanges.length}张券</span>
            <span className="text-ink-600">·</span>
            <span className="text-accent-green">{totalChaptersCovered}话</span>
          </div>
          {hasExtraWarnings && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-accent-yellow/10 border border-accent-yellow/30 rounded-card">
              <AlertTriangle className="w-4 h-4 text-accent-yellow" />
              <span className="text-sm text-accent-yellow">含付费番外</span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3 max-h-[28rem] overflow-y-auto pr-2">
        {selectedComics.map((comic) => {
          const comicRanges = config.chapterRanges.filter(r => r.comicId === comic.id);
          const isExpanded = expandedComics.includes(comic.id);
          const comicHasExtra = comicRanges.some(r => r.extraChapterIds.length > 0);

          const minCh = comicRanges.length > 0 ? Math.min(...comicRanges.map(r => r.startChapter)) : 0;
          const maxCh = comicRanges.length > 0 ? Math.max(...comicRanges.map(r => r.endChapter)) : 0;
          const coverCount = comicRanges.reduce((sum, r) => sum + (r.endChapter - r.startChapter + 1), 0);

          return (
            <div
              key={comic.id}
              className={`card overflow-hidden ${
                comicHasExtra ? 'border-accent-yellow/40' : ''
              }`}
            >
              <button
                onClick={() => toggleComicExpand(comic.id)}
                className="w-full p-4 flex items-center gap-4 hover:bg-ink-700/40 transition-colors text-left"
              >
                <img
                  src={comic.cover}
                  alt={comic.title}
                  className="w-12 h-16 object-cover rounded-card flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-semibold text-white">{comic.title}</h4>
                    {comicHasExtra && (
                      <span className="tag bg-accent-yellow/20 text-accent-yellow text-[10px] border border-accent-yellow/30">
                        <AlertTriangle className="w-3 h-3" />
                        含番外
                      </span>
                    )}
                    <span className="tag tag-active text-[10px]">
                      {comicRanges.length}张券
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs flex-wrap">
                    <span className="text-ink-400">{comic.author}</span>
                    {comicRanges.length > 0 && (
                      <>
                        <span className="text-ink-600">·</span>
                        <span className="text-accent-green">覆盖第{minCh}-{maxCh}话</span>
                        <span className="text-ink-600">·</span>
                        <span className="text-white font-medium">{coverCount}话</span>
                      </>
                    )}
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-ink-500 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-ink-500 flex-shrink-0" />
                )}
              </button>

              {isExpanded && (
                <div className="border-t border-ink-700 bg-ink-900/30">
                  {comicRanges.length === 0 ? (
                    <div className="p-6 text-center text-ink-500 text-sm">
                      该作品暂未分配券数，请在上方调整分配
                    </div>
                  ) : (
                    <div className="p-3 space-y-2">
                      {comicRanges.map((range) => (
                        <CouponRangeItem
                          key={range.couponIndex}
                          range={range}
                          comic={comic}
                          isExpanded={expandedCoupons.has(`${comic.id}-${range.couponIndex}`)}
                          onToggle={() => toggleCouponExpand(`${comic.id}-${range.couponIndex}`)}
                        />
                      ))}
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

function CouponRangeItem({
  range,
  comic,
  isExpanded,
  onToggle,
}: {
  range: ChapterRange;
  comic: Comic;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const chapters = getChaptersInRange(comic, range.startChapter, range.endChapter);
  const hasExtra = range.extraChapterIds.length > 0;
  const extraChapters = chapters.filter(ch => ch.isExtra);

  return (
    <div
      className={`rounded-card border transition-all ${
        hasExtra
          ? 'border-accent-yellow/40 bg-accent-yellow/5'
          : 'border-ink-700 bg-ink-800/50'
      }`}
    >
      <button
        onClick={onToggle}
        className="w-full p-3 flex items-center justify-between hover:bg-ink-700/30 transition-colors rounded-card"
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
            hasExtra
              ? 'bg-accent-yellow/20 text-accent-yellow'
              : 'bg-accent-orange/20 text-accent-orange'
          }`}>
            {range.couponIndex}
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-white">
              第{range.startChapter}话 ~ 第{range.endChapter}话
            </p>
            <p className="text-xs text-ink-400">共 {chapters.length} 话</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasExtra && (
            <span className="text-[10px] text-accent-yellow">
              番外{extraChapters.length}个
            </span>
          )}
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-ink-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-ink-500" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-ink-700/50 p-3 bg-ink-900/30 rounded-b-card">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-1.5">
            {chapters.map((chapter) => (
              <div
                key={chapter.id}
                className={`p-1.5 rounded text-center text-xs transition-all ${
                  chapter.isExtra
                    ? 'bg-accent-yellow/10 border border-accent-yellow/30 text-accent-yellow'
                    : chapter.isFree
                    ? 'bg-ink-800 text-ink-500'
                    : 'bg-ink-700 text-paper-200'
                }`}
              >
                <p className="font-medium truncate">{chapter.chapterNo}</p>
                {chapter.isExtra && (
                  <p className="text-[9px] text-accent-yellow">番</p>
                )}
              </div>
            ))}
          </div>

          {hasExtra && (
            <div className="mt-3 p-2.5 bg-accent-yellow/10 border border-accent-yellow/30 rounded-card">
              <p className="text-xs text-accent-yellow flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <span>
                  此券包含 <strong>{extraChapters.length}</strong> 个付费番外：
                  {extraChapters.map(ch => `第${ch.chapterNo}话`).join('、')}
                  <br />请确认是否需要将番外纳入活动范围。
                </span>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
