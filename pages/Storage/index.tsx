import React, { useState, useEffect, useMemo } from 'react';
import { Package } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Product, Ingredient } from '@/types';
import { fetchProducts, addProduct, updateProduct } from '@/services/productService';
import { fetchIngredients, addIngredient, updateIngredient } from '@/services/ingredientService';
import TabsHeader from '@/pages/Storage/TabsHeader';
import { ProductForm, ProductToolbar, ProductGrid } from '@/pages/Storage/product';
import { IngredientForm, IngredientToolbar, IngredientGrid } from '@/pages/Storage/ingredient';
import { BaseRecipeForm, FullRecipeForm, RecipeToolbar, RecipeGrid } from '@/pages/Storage/recipe';
import { fetchRecipes, addRecipe, updateRecipe, deleteRecipe } from '@/services/recipeService';
import { Recipe } from '@/types';
import ConfirmModal from '@/components/ConfirmModal';
import toast from 'react-hot-toast';

type InventoryTab = 'products' | 'ingredients' | 'recipes';

const InventoryPage: React.FC = () => {
  const { t } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingIngredients, setLoadingIngredients] = useState(true);
  const [loadingRecipes, setLoadingRecipes] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [ingredientSearch, setIngredientSearch] = useState('');
  const [recipeSearch, setRecipeSearch] = useState('');
  const [activeTab, setActiveTab] = useState<InventoryTab>('products');
  
  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);
  const [isIngredientFormOpen, setIsIngredientFormOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | undefined>(undefined);
  const [isBaseRecipeFormOpen, setIsBaseRecipeFormOpen] = useState(false);
  const [isFullRecipeFormOpen, setIsFullRecipeFormOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | undefined>(undefined);
  const [recipeToDelete, setRecipeToDelete] = useState<Recipe | null>(null);
  const [isDeletingRecipe, setIsDeletingRecipe] = useState(false);
  const [recipeViewMode, setRecipeViewMode] = useState<'all' | 'base' | 'full'>('all');

  const loadProducts = async () => {
    setLoading(true);
    const data = await fetchProducts();
    setProducts(data);
    setLoading(false);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const loadIngredients = async () => {
    setLoadingIngredients(true);
    const data = await fetchIngredients();
    setIngredients(data);
    setLoadingIngredients(false);
  };

  useEffect(() => {
    loadIngredients();
  }, []);

  const loadRecipes = async () => {
    setLoadingRecipes(true);
    const data = await fetchRecipes();
    setRecipes(data);
    setLoadingRecipes(false);
  };

  useEffect(() => {
    loadRecipes();
  }, []);

  const handleCreate = () => {
    setEditingProduct(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const handleSave = async (data: any) => {
    if (data.id) {
      await updateProduct(data.id, data);
    } else {
      // Destructure to remove 'id' which is undefined for new products
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, ...productData } = data;
      await addProduct(productData);
    }
    await loadProducts();
    setIsFormOpen(false);
  };

  // Ingredient handlers
  const handleCreateIngredient = () => {
    setEditingIngredient(undefined);
    setIsIngredientFormOpen(true);
  };

  const handleEditIngredient = (ingredient: Ingredient) => {
    setEditingIngredient(ingredient);
    setIsIngredientFormOpen(true);
  };

  const handleSaveIngredient = async (data: any) => {
    const { _isHistoryUpdate, ...cleanData } = data;
    if (cleanData.id) {
      await updateIngredient(cleanData.id, cleanData);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, ...payload } = cleanData;
      await addIngredient(payload);
    }
    await loadIngredients();
    if (!_isHistoryUpdate) {
      setIsIngredientFormOpen(false);
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  const filteredIngredients = useMemo(() => {
    return ingredients.filter((ing) =>
      ing.name.toLowerCase().includes(ingredientSearch.toLowerCase()) ||
      t(`ingredients.form.types.${ing.type}`).toLowerCase().includes(ingredientSearch.toLowerCase())
    );
  }, [ingredients, ingredientSearch, t]);

  const filteredRecipes = useMemo(() => {
    let result = recipes.filter((recipe) =>
      recipe.name.toLowerCase().includes(recipeSearch.toLowerCase()) ||
      (recipe.description && recipe.description.toLowerCase().includes(recipeSearch.toLowerCase()))
    );

    if (recipeViewMode === 'base') {
      result = result.filter(r => r.recipeType === 'base' || (!r.recipeType && !r.baseRecipeId));
    } else if (recipeViewMode === 'full') {
      result = result.filter(r => r.recipeType === 'full' || (r.recipeType && r.baseRecipeId));
    }

    return result;
  }, [recipes, recipeSearch, recipeViewMode]);

  // Recipe handlers
  const handleCreateBaseRecipe = () => {
    setEditingRecipe(undefined);
    setIsBaseRecipeFormOpen(true);
  };

  const handleCreateFullRecipe = () => {
    setEditingRecipe(undefined);
    setIsFullRecipeFormOpen(true);
  };

  const handleEditRecipe = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    const recipeType = recipe.recipeType || (recipe.baseRecipeId ? 'full' : 'base');
    if (recipeType === 'base') {
      setIsBaseRecipeFormOpen(true);
    } else {
      setIsFullRecipeFormOpen(true);
    }
  };

  const handleSaveBaseRecipe = async (data: any) => {
    if (data.id) {
      await updateRecipe(data.id, data);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, ...payload } = data;
      await addRecipe(payload);
    }
    await loadRecipes();
    setIsBaseRecipeFormOpen(false);
    setEditingRecipe(undefined);
  };

  const handleSaveFullRecipe = async (data: any) => {
    if (data.id) {
      await updateRecipe(data.id, data);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, ...payload } = data;
      await addRecipe(payload);
    }
    await loadRecipes();
    setIsFullRecipeFormOpen(false);
    setEditingRecipe(undefined);
  };

  const handleDeleteRecipe = (recipe: Recipe) => {
    setRecipeToDelete(recipe);
  };

  const confirmDeleteRecipe = async () => {
    if (!recipeToDelete?.id) return;

    try {
      setIsDeletingRecipe(true);
      await deleteRecipe(recipeToDelete.id);
      toast.success(t('recipes.deleteSuccess'));
      await loadRecipes();
      setRecipeToDelete(null);
    } catch (error) {
      console.error('Error deleting recipe:', error);
      toast.error(t('recipes.deleteError'));
    } finally {
      setIsDeletingRecipe(false);
    }
  };


  const renderTabContent = () => {
    if (activeTab === 'products') {
      return (
        <>
          <ProductToolbar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onCreate={handleCreate}
          />

          <ProductGrid
            products={filteredProducts}
            loading={loading}
            onEdit={handleEdit}
            onCreate={handleCreate}
          />
        </>
      );
    }

    if (activeTab === 'ingredients') {
      return (
        <>
          <IngredientToolbar
            searchTerm={ingredientSearch}
            onSearchChange={setIngredientSearch}
            onCreate={handleCreateIngredient}
          />
          <IngredientGrid
            ingredients={filteredIngredients}
            loading={loadingIngredients}
            onEdit={handleEditIngredient}
            onCreate={handleCreateIngredient}
          />
        </>
      );
    }

    if (activeTab === 'recipes') {
      return (
        <>
          <RecipeToolbar
            searchTerm={recipeSearch}
            onSearchChange={setRecipeSearch}
            onCreateBase={handleCreateBaseRecipe}
            onCreateFull={handleCreateFullRecipe}
          />
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => setRecipeViewMode('all')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                recipeViewMode === 'all'
                  ? 'bg-orange-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {t('recipes.all') || 'Tất cả'}
            </button>
            <button
              onClick={() => setRecipeViewMode('base')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                recipeViewMode === 'base'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {t('recipes.form.baseRecipe')}
            </button>
            <button
              onClick={() => setRecipeViewMode('full')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                recipeViewMode === 'full'
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {t('recipes.form.fullRecipe')}
            </button>
          </div>
          <RecipeGrid
            recipes={filteredRecipes}
            loading={loadingRecipes}
            onEdit={handleEditRecipe}
            onCreate={handleCreateBaseRecipe}
            onDelete={handleDeleteRecipe}
          />
        </>
      );
    }

    return null;
  };

  return (
    <div className="h-full relative flex flex-col space-y-6">
      <TabsHeader activeTab={activeTab} onChange={setActiveTab} />

      {renderTabContent()}

      {isFormOpen && (
        <ProductForm 
           initialData={editingProduct}
           ingredients={ingredients}
           onSave={handleSave}
           onCancel={() => setIsFormOpen(false)}
        />
      )}

      {isIngredientFormOpen && (
        <IngredientForm
          isOpen={isIngredientFormOpen}
          initialData={editingIngredient}
          onSave={handleSaveIngredient}
          onClose={() => setIsIngredientFormOpen(false)}
        />
      )}

      {isBaseRecipeFormOpen && (
        <BaseRecipeForm
          isOpen={isBaseRecipeFormOpen}
          initialData={editingRecipe}
          ingredients={ingredients}
          onSave={handleSaveBaseRecipe}
          onClose={() => {
            setIsBaseRecipeFormOpen(false);
            setEditingRecipe(undefined);
          }}
        />
      )}

      {isFullRecipeFormOpen && (
        <FullRecipeForm
          isOpen={isFullRecipeFormOpen}
          initialData={editingRecipe}
          ingredients={ingredients}
          onSave={handleSaveFullRecipe}
          onClose={() => {
            setIsFullRecipeFormOpen(false);
            setEditingRecipe(undefined);
          }}
          baseRecipes={recipes.filter(r => r.recipeType === 'base' || (!r.recipeType && !r.baseRecipeId))}
        />
      )}

      <ConfirmModal
        isOpen={!!recipeToDelete}
        title={t('recipes.deleteConfirmTitle')}
        message={t('recipes.deleteConfirmMessage').replace('{name}', recipeToDelete?.name || '')}
        onConfirm={confirmDeleteRecipe}
        onCancel={() => setRecipeToDelete(null)}
        isLoading={isDeletingRecipe}
      />
    </div>
  );
};

export default InventoryPage;