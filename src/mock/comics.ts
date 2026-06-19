import type { Comic, Chapter } from '@/types';

const generateChapters = (comicId: string, count: number, extraCount: number = 2): Chapter[] => {
  const chapters: Chapter[] = [];
  
  for (let i = 1; i <= count; i++) {
    chapters.push({
      id: `${comicId}-ch-${i}`,
      chapterNo: i,
      title: `第${i}话`,
      isExtra: false,
      isFree: i <= 3,
    });
  }
  
  for (let i = 1; i <= extraCount; i++) {
    chapters.push({
      id: `${comicId}-extra-${i}`,
      chapterNo: count + i,
      title: `番外篇${i}`,
      isExtra: true,
      isFree: false,
    });
  }
  
  return chapters;
};

export const mockComics: Comic[] = [
  {
    id: 'comic-001',
    title: '斗破苍穹',
    author: '天蚕土豆',
    cover: 'https://picsum.photos/seed/comic1/200/280',
    description: '三十年河东，三十年河西，莫欺少年穷！年仅15岁的萧家废物萧炎，在逆境中成长，最终成为斗气大陆的巅峰强者。',
    totalChapters: 150,
    chapters: generateChapters('comic-001', 150, 3),
  },
  {
    id: 'comic-002',
    title: '完美世界',
    author: '辰东',
    cover: 'https://picsum.photos/seed/comic2/200/280',
    description: '一粒尘可填海，一根草斩尽日月星辰，弹指间轰杀诸天强者。石昊从大荒中走出，开启了一段传奇之路。',
    totalChapters: 200,
    chapters: generateChapters('comic-002', 200, 4),
  },
  {
    id: 'comic-003',
    title: '遮天',
    author: '辰东',
    cover: 'https://picsum.photos/seed/comic3/200/280',
    description: '冰冷与黑暗并存的宇宙深处，九尊龙尸拉着一口古棺正在穿越无尽太空。叶凡与他的同学被九龙拉棺带到了北斗星域。',
    totalChapters: 180,
    chapters: generateChapters('comic-003', 180, 2),
  },
  {
    id: 'comic-004',
    title: '凡人修仙传',
    author: '忘语',
    cover: 'https://picsum.photos/seed/comic4/200/280',
    description: '一个普通的山村穷小子，偶然之下，跨入到一个江湖小门派，虽然资质平庸，但依靠自身努力和算计修炼成仙。',
    totalChapters: 250,
    chapters: generateChapters('comic-004', 250, 5),
  },
  {
    id: 'comic-005',
    title: '全职高手',
    author: '蝴蝶蓝',
    cover: 'https://picsum.photos/seed/comic5/200/280',
    description: '网游荣耀中被誉为教科书级别的顶尖高手叶修，因为种种原因遭到俱乐部的驱逐，重新回到游戏赛场的故事。',
    totalChapters: 120,
    chapters: generateChapters('comic-005', 120, 3),
  },
  {
    id: 'comic-006',
    title: '盗墓笔记',
    author: '南派三叔',
    cover: 'https://picsum.photos/seed/comic6/200/280',
    description: '五十年前，一群长沙土夫子发现了一件战国古墓，五十年后，他们的后代在笔记中发现了惊天秘密。',
    totalChapters: 90,
    chapters: generateChapters('comic-006', 90, 2),
  },
  {
    id: 'comic-007',
    title: '鬼灭之刃',
    author: '吾峠呼世晴',
    cover: 'https://picsum.photos/seed/comic7/200/280',
    description: '时值日本大正时期，卖炭少年炭治郎一家被鬼杀死，唯一幸存的妹妹祢豆子也变成了鬼。为了让妹妹变回人类，炭治郎踏上了斩鬼之路。',
    totalChapters: 100,
    chapters: generateChapters('comic-007', 100, 1),
  },
  {
    id: 'comic-008',
    title: '进击的巨人',
    author: '谏山创',
    cover: 'https://picsum.photos/seed/comic8/200/280',
    description: '在那个巨人支配的世界，人类被迫建造了三座巨大的墙壁来防止巨人的入侵。艾伦·耶格尔立誓要消灭所有的巨人。',
    totalChapters: 139,
    chapters: generateChapters('comic-008', 139, 2),
  },
];

export const getComicById = (id: string): Comic | undefined => {
  return mockComics.find(comic => comic.id === id);
};

export const searchComics = (keyword: string): Comic[] => {
  if (!keyword.trim()) return mockComics;
  const lowerKeyword = keyword.toLowerCase();
  return mockComics.filter(
    comic =>
      comic.title.toLowerCase().includes(lowerKeyword) ||
      comic.author.toLowerCase().includes(lowerKeyword)
  );
};
