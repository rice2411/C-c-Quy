import React from 'react';
import { BookOpen, Loader2, ChefHat, List, Trash2 } from 'lucide-react';
import { Recipe } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

interface RecipeGridProps {
  recipes: Recipe[];
  loading: boolean;
  onEdit: (recipe: Recipe) => void;
  onCreate: () => void;
  onDelete?: (recipe: Recipe) => void;
}

const RecipeGrid: React.FC<RecipeGridProps> = ({ recipes, loading, onEdit, onCreate, onDelete }) => {
  const { t } = useLanguage();

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('recipes.loading')}</p>
        </div>
      </div>
    );
  }

  if (recipes.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center py-12">
        <div className="text-center space-y-3">
          <BookOpen className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600" />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t('recipes.noData')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {recipes.map((recipe) => (
        <div
          key={recipe.id}
          className="group relative bg-white dark:bg-slate-800 rounded-xl border-2 border-orange-200 dark:border-orange-800 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-200 overflow-hidden"
        >
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(recipe);
              }}
              className="absolute top-2 right-2 z-10 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
              title={t('recipes.delete')}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <div
            onClick={() => onEdit(recipe)}
            className="p-4 cursor-pointer"
          >
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center border border-orange-200 dark:border-orange-800">
                  <ChefHat className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-900 dark:text-white line-clamp-1 text-sm">
                    {recipe.name}
                  </h4>
                </div>
              </div>
            </div>

            {recipe.description && (
              <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-3">
                {recipe.description}
              </p>
            )}

            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-3">
              <List className="w-3.5 h-3.5" />
              <span>
                {recipe.ingredients?.length || 0} {t('recipes.ingredients')}
              </span>
              {recipe.yield && recipe.yield > 0 && (
                <>
                  <span>•</span>
                  <span>
                    {recipe.yield} {recipe.yieldUnit || t('recipes.servings')}
                  </span>
                </>
              )}
            </div>

            {recipe.ingredients && recipe.ingredients.length > 0 && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                <div className="space-y-1">
                  {recipe.ingredients.slice(0, 3).map((ing, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 dark:text-slate-400 truncate flex-1">
                        {ing.ingredientName}
                      </span>
                      <span className="text-slate-900 dark:text-white font-medium ml-2">
                        {ing.quantity} {ing.unit === 'piece' ? t('ingredients.form.unitPiece') : 'g'}
                      </span>
                    </div>
                  ))}
                  {recipe.ingredients.length > 3 && (
                    <p className="text-xs text-slate-400 dark:text-slate-500 italic">
                      +{recipe.ingredients.length - 3} {t('recipes.more')}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default RecipeGrid;
