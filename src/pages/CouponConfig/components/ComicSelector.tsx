import { useState } from 'react';
import {
  Search, X, Check, BookOpen, AlertTriangle,
  Ticket, Sparkles, Minus, Plus, Info
} from 'lucide-react';
import { mockComics, searchComics } from '@/mock/comics';
import { useCouponStore } from '@/store/useCouponStore';
import type { Comic, ComicTicketAllocation } from '@/types';

export default function ComicSelector() {
  const {
    config,
    toggleComic,
    errors,
    updateComicAllocation,
    autoAllocateTickets,
  } = useCouponStore();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const isDisabled = !config.type;
  const searchResults = searchComics(searchKeyword);
  const selectedComics = mockComics.filter(c => config.selectedComicIds.includes(c.id));

  const allocMap = new Map<string, ComicTicketAllocation>();
  config.comicAllocations.forEach(a => allocMap.set(a.comicId, a));

  const allocatedTotal = config.comicAllocations.reduce((sum, a) => sum + a.ticketCount, 0);
  const unallocated = config.ticketCount - allocatedTotal;

  const handleSelectComic = (comic: Comic) => {
    if (isDisabled) return;
    toggleComic(comic.id);
    setSearchKeyword('');
    setShowDropdown(false);
  };

  const handleRemoveComic = (comicId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDisabled) return;
    toggleComic(comicId);
  };

  const handleAllocationChange = (comicId: string, newCount: number) => {
    updateComicAllocation(comicId, Math.max(0, Math.min(newCount, 30)));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-display text-lg font-semibold text-white flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-accent-orange" />
          绑定适用漫画与券分配
          {config.singleBookOnly && (
            <span className="text-xs font-normal text-ink-500">(仅限单本)</span>
          )}
        </h3>
        <div className="flex items-center gap-3">
          {(errors.selectedComicIds || errors.allocations) && (
            <span className="text-sm text-red-400 flex items-center gap-1">
              <AlertTriangle className="w-4 h-4" />
              {errors.allocations || errors.selectedComicIds}
            </span>
          )}
          {selectedComics.length > 1 && !config.singleBookOnly && (
            <button
              onClick={autoAllocateTickets}
              disabled={isDisabled}
              className="btn-secondary text-xs py-1.5 flex items-center gap-1.5 disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              自动平均分配
            </button>
          )}
        </div>
      </div>

      <div className="relative">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-500" />
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => {
              setSearchKeyword(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            disabled={isDisabled}
            placeholder="搜索漫画名称或作者..."
            className="input-field pl-12 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {showDropdown && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-ink-800 border border-ink-600 rounded-card shadow-card-hover max-h-80 overflow-y-auto z-50">
            {searchResults.map((comic) => {
              const isSelected = config.selectedComicIds.includes(comic.id);
              const paidCount = comic.chapters.filter(ch => !ch.isFree).length;
              const extraCount = comic.chapters.filter(ch => ch.isExtra).length;
              return (
                <button
                  key={comic.id}
                  onClick={() => handleSelectComic(comic)}
                  disabled={isDisabled || (config.singleBookOnly && !isSelected && config.selectedComicIds.length >= 1)}
                  className={`w-full flex items-center gap-4 p-3 hover:bg-ink-700 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed ${
                    isSelected ? 'bg-ink-700/50' : ''
                  }`}
                >
                  <img
                    src={comic.cover}
                    alt={comic.title}
                    className="w-12 h-16 object-cover rounded-card"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">{comic.title}</p>
                    <p className="text-sm text-ink-400 truncate">{comic.author}</p>
                    <p className="text-xs text-ink-500">
                      共 {comic.totalChapters} 话 · 付费{paidCount}话
                      {extraCount > 0 && <span className="text-rose-400"> · 番外{extraCount}话</span>}
                    </p>
                  </div>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    isSelected ? 'bg-accent-orange text-ink-950' : 'bg-ink-700 border border-ink-500'
                  }`}>
                    {isSelected && <Check className="w-4 h-4" />}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        />
      )}

      {selectedComics.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <span className="text-ink-400 flex items-center gap-1">
                <Ticket className="w-4 h-4 text-accent-orange" />
                总券数: <span className="text-white font-semibold">{config.ticketCount}</span>
              </span>
              <span className="text-ink-400">
                已分配: <span className={`font-semibold ${unallocated === 0 ? 'text-accent-green' : 'text-accent-yellow'}`}>{allocatedTotal}</span>
              </span>
              <span className="text-ink-400">
                剩余: <span className={`font-semibold ${unallocated === 0 ? 'text-ink-400' : 'text-accent-orange'}`}>{unallocated}</span>
              </span>
            </div>
            {unallocated !== 0 && (
              <span className="text-xs text-accent-yellow flex items-center gap-1">
                <Info className="w-3.5 h-3.5" />
                请将剩余 {unallocated} 张券分配给作品
              </span>
            )}
          </div>

          <div className="grid gap-3">
            {selectedComics.map((comic) => {
              const allocation = allocMap.get(comic.id);
              const currentCount = allocation?.ticketCount || 0;
              const comicRanges = config.chapterRanges.filter(r => r.comicId === comic.id);
              const minCh = comicRanges.length > 0 ? Math.min(...comicRanges.map(r => r.startChapter)) : 0;
              const maxCh = comicRanges.length > 0 ? Math.max(...comicRanges.map(r => r.endChapter)) : 0;
              const coveredCount = comicRanges.reduce((sum, r) => sum + (r.endChapter - r.startChapter + 1), 0);
              const hasExtra = comicRanges.some(r => r.extraChapterIds.length > 0);

              return (
                <div
                  key={comic.id}
                  className="p-4 bg-ink-800/70 border border-ink-700 rounded-card hover:border-accent-orange/30 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={comic.cover}
                      alt={comic.title}
                      className="w-14 h-20 object-cover rounded-card flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-white">{comic.title}</h4>
                            {hasExtra && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-accent-yellow/20 text-accent-yellow rounded border border-accent-yellow/30">
                                含番外
                              </span>
                            )}
                            <button
                              onClick={(e) => handleRemoveComic(comic.id, e)}
                              disabled={isDisabled}
                              className="p-1 text-ink-500 hover:text-red-400 hover:bg-red-400/10 rounded transition-all disabled:opacity-30"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <p className="text-xs text-ink-500 mt-0.5">{comic.author}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-ink-400">分配券数:</label>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleAllocationChange(comic.id, currentCount - 1)}
                              disabled={isDisabled || currentCount <= 0}
                              className="w-7 h-7 rounded-md bg-ink-700 border border-ink-600 flex items-center justify-center text-ink-300 hover:bg-ink-600 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <input
                              type="number"
                              value={currentCount}
                              onChange={(e) => handleAllocationChange(comic.id, parseInt(e.target.value) || 0)}
                              disabled={isDisabled}
                              className="w-14 h-7 text-center bg-ink-900 border border-ink-600 rounded-md text-white text-sm font-semibold focus:border-accent-orange focus:outline-none disabled:opacity-50"
                              min={0}
                              max={30}
                            />
                            <button
                              onClick={() => handleAllocationChange(comic.id, currentCount + 1)}
                              disabled={isDisabled || currentCount >= 30 || allocatedTotal >= config.ticketCount}
                              className="w-7 h-7 rounded-md bg-ink-700 border border-ink-600 flex items-center justify-center text-ink-300 hover:bg-ink-600 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-xs text-ink-500 ml-1">张</span>
                          </div>
                        </div>

                        {currentCount > 0 && comicRanges.length > 0 && (
                          <div className="flex flex-wrap items-center gap-3 text-xs">
                            <span className="text-ink-400">
                              覆盖章节: <span className="text-accent-green font-medium">{coveredCount}话</span>
                            </span>
                            <span className="text-ink-400">
                              范围: <span className="text-white">第{minCh}-{maxCh}话</span>
                            </span>
                          </div>
                        )}
                      </div>

                      {currentCount > 0 && comicRanges.length === 0 && (
                        <p className="text-xs text-accent-yellow flex items-center gap-1">
                          <Info className="w-3.5 h-3.5" />
                          正在计算章节范围...
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selectedComics.length === 0 && (
        <p className="text-ink-500 text-sm italic">
          {isDisabled ? '请先选择券包类型' : '暂未选择漫画，请在上方搜索并选择'}
        </p>
      )}

      {selectedComics.length > 0 && (
        <div className="p-4 bg-ink-800/50 rounded-card border border-ink-700">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-accent-orange">{selectedComics.length}</p>
              <p className="text-xs text-ink-500">已选漫画</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {selectedComics.reduce((sum, c) => sum + c.totalChapters, 0)}
              </p>
              <p className="text-xs text-ink-500">总章节数</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-accent-green">
                {selectedComics.reduce((sum, c) => sum + c.chapters.filter(ch => !ch.isFree).length, 0)}
              </p>
              <p className="text-xs text-ink-500">付费章节</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-rose-400">
                {selectedComics.reduce((sum, c) => sum + c.chapters.filter(ch => ch.isExtra).length, 0)}
              </p>
              <p className="text-xs text-ink-500">付费番外</p>
            </div>
            <div>
              <p className={`text-2xl font-bold ${unallocated === 0 ? 'text-accent-green' : 'text-accent-yellow'}`}>
                {config.chapterRanges.reduce((sum, r) => sum + (r.endChapter - r.startChapter + 1), 0)}
              </p>
              <p className="text-xs text-ink-500">预计覆盖</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
