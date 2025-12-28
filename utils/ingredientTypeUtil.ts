import { Box, Package, ChefHat, Sparkles, Layers } from 'lucide-react';
import { IngredientType } from '@/types';

export interface IngredientTypeColors {
  bg: string;
  border: string;
  text: string;
  icon: string;
  badge?: string;
  header?: string;
}

/**
 * Get icon component for ingredient type
 * @param type - Ingredient type
 * @returns Lucide icon component
 */
export const getTypeIcon = (type: IngredientType) => {
  switch (type) {
    case IngredientType.BASE:
      return Box;
    case IngredientType.FLAVOR:
      return ChefHat;
    case IngredientType.TOPPING:
      return Sparkles;
    case IngredientType.DECORATION:
      return Sparkles;
    case IngredientType.MATERIAL:
      return Package;
    default:
      return Box;
  }
};

/**
 * Get color scheme for ingredient type
 * @param type - Ingredient type
 * @returns Color scheme object
 */
export const getTypeColors = (type: IngredientType): IngredientTypeColors => {
  switch (type) {
    case IngredientType.BASE:
      return {
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        border: 'border-blue-200 dark:border-blue-800',
        text: 'text-blue-700 dark:text-blue-300',
        icon: 'text-blue-600 dark:text-blue-400',
        badge: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
        header: 'bg-blue-100 dark:bg-blue-900/40',
      };
    case IngredientType.FLAVOR:
      return {
        bg: 'bg-purple-50 dark:bg-purple-900/20',
        border: 'border-purple-200 dark:border-purple-800',
        text: 'text-purple-700 dark:text-purple-300',
        icon: 'text-purple-600 dark:text-purple-400',
        badge: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300',
        header: 'bg-purple-100 dark:bg-purple-900/40',
      };
    case IngredientType.TOPPING:
      return {
        bg: 'bg-pink-50 dark:bg-pink-900/20',
        border: 'border-pink-200 dark:border-pink-800',
        text: 'text-pink-700 dark:text-pink-300',
        icon: 'text-pink-600 dark:text-pink-400',
        badge: 'bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300',
        header: 'bg-pink-100 dark:bg-pink-900/40',
      };
    case IngredientType.DECORATION:
      return {
        bg: 'bg-yellow-50 dark:bg-yellow-900/20',
        border: 'border-yellow-200 dark:border-yellow-800',
        text: 'text-yellow-700 dark:text-yellow-300',
        icon: 'text-yellow-600 dark:text-yellow-400',
        badge: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300',
        header: 'bg-yellow-100 dark:bg-yellow-900/40',
      };
    case IngredientType.MATERIAL:
      return {
        bg: 'bg-green-50 dark:bg-green-900/20',
        border: 'border-green-200 dark:border-green-800',
        text: 'text-green-700 dark:text-green-300',
        icon: 'text-green-600 dark:text-green-400',
        badge: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',
        header: 'bg-green-100 dark:bg-green-900/40',
      };
    default:
      return {
        bg: 'bg-slate-50 dark:bg-slate-800',
        border: 'border-slate-200 dark:border-slate-700',
        text: 'text-slate-700 dark:text-slate-300',
        icon: 'text-slate-600 dark:text-slate-400',
        badge: 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300',
        header: 'bg-slate-100 dark:bg-slate-700',
      };
  }
};

