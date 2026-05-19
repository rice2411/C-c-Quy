/** Đồng bộ màu tag với ProductForm (chip / gợi ý / đã chọn) */

export interface TagPalette {
  selected: string;
  idle: string;
  chip: string;
  removeHover: string;
}

export const TAG_COLOR_PALETTES: TagPalette[] = [
  {
    selected: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700',
    idle: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700 hover:border-red-300 dark:hover:border-red-600',
    chip: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700',
    removeHover: 'hover:text-red-900 dark:hover:text-red-100',
  },
  {
    selected: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700',
    idle: 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-700 hover:border-orange-300 dark:hover:border-orange-600',
    chip: 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-700',
    removeHover: 'hover:text-orange-900 dark:hover:text-orange-100',
  },
  {
    selected: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700',
    idle: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700 hover:border-amber-300 dark:hover:border-amber-600',
    chip: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700',
    removeHover: 'hover:text-amber-900 dark:hover:text-amber-100',
  },
  {
    selected: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700',
    idle: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700 hover:border-green-300 dark:hover:border-green-600',
    chip: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700',
    removeHover: 'hover:text-green-900 dark:hover:text-green-100',
  },
  {
    selected: 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 border-teal-300 dark:border-teal-700',
    idle: 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-700 hover:border-teal-300 dark:hover:border-teal-600',
    chip: 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-700',
    removeHover: 'hover:text-teal-900 dark:hover:text-teal-100',
  },
  {
    selected: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700',
    idle: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700 hover:border-blue-300 dark:hover:border-blue-600',
    chip: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700',
    removeHover: 'hover:text-blue-900 dark:hover:text-blue-100',
  },
  {
    selected: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700',
    idle: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700 hover:border-indigo-300 dark:hover:border-indigo-600',
    chip: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700',
    removeHover: 'hover:text-indigo-900 dark:hover:text-indigo-100',
  },
  {
    selected: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700',
    idle: 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700 hover:border-purple-300 dark:hover:border-purple-600',
    chip: 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700',
    removeHover: 'hover:text-purple-900 dark:hover:text-purple-100',
  },
];

export function getTagPalette(tag: string): TagPalette {
  const hash = tag.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return TAG_COLOR_PALETTES[hash % TAG_COLOR_PALETTES.length];
}
