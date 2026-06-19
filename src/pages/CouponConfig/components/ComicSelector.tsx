import { useState } from 'react';
import { Search, X, Check, BookOpen, AlertTriangle } from 'lucide-react';
import { mockComics, searchComics } from '@/mock/comics';
import { useCouponStore } from '@/store/useCouponStore';
import type { Comic } from '@/types';

export default function ComicSelector() {
  const { config, toggleComic, errors } = useCouponStore();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const isDisabled = !config.type;
  const searchResults = searchComics(searchKeyword);
  const selectedComics = mockComics.filter(c => config.selectedComicIds.includes(c.id));

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold text-white flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-accent-orange" />
          绑定适用漫画
          {config.singleBookOnly && (
            <span className="text-xs font-normal text-ink-500">(仅限单本)</span>
          )}
        </h3>
        {errors.selectedComicIds && (
          <span className="text-sm text-red-400 flex items-center gap-1">
            <AlertTriangle className="w-4 h-4" />
            {errors.selectedComicIds}
          </span>
        )}
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
                    <p className="text-xs text-ink-500">共 {comic.totalChapters} 话</p>
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

      <div className="flex flex-wrap gap-2">
        {selectedComics.length === 0 ? (
          <p className="text-ink-500 text-sm italic">
            {isDisabled ? '请先选择券包类型' : '暂未选择漫画，请在上方搜索并选择'}
          </p>
        ) : (
          selectedComics.map((comic) => (
            <div
              key={comic.id}
              className="tag tag-active group cursor-default"
            >
              <img
                src={comic.cover}
                alt={comic.title}
                className="w-5 h-7 object-cover rounded"
              />
              <span className="max-w-32 truncate">{comic.title}</span>
              {!isDisabled && (
                <button
                  onClick={(e) => handleRemoveComic(comic.id, e)}
                  className="ml-1 p-0.5 hover:bg-accent-orange/30 rounded transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {selectedComics.length > 0 && (
        <div className="p-4 bg-ink-800/50 rounded-card border border-ink-700">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
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
              <p className="text-2xl font-bold text-accent-yellow">
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
          </div>
        </div>
      )}
    </div>
  );
}
