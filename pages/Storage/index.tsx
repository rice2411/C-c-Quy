import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Product, Ingredient } from '@/types';
import { fetchProducts, addProduct, updateProduct } from '@/services/productService';
import { fetchIngredients, addIngredient, updateIngredient } from '@/services/ingredientService';
import TabsHeader from '@/pages/Storage/TabsHeader';
import { ProductForm, ProductToolbar, ProductGrid } from '@/pages/Storage/product';
import { IngredientForm, IngredientToolbar, IngredientGrid } from '@/pages/Storage/ingredient';
import { getAccessibleStorageTabs } from '@/config/routes';
import { useAuth } from '@/contexts/AuthContext';
import { useScreenConfig } from '@/contexts/ScreenConfigContext';
import { getUserFromLocalStorage } from '@/utils/userUtil';

const InventoryPage: React.FC = () => {
  const { t } = useLanguage();
  const { userData } = useAuth();
  const { screenVisibility } = useScreenConfig();
  const storedUser = React.useMemo(() => getUserFromLocalStorage(), []);
  const userRole = userData?.role || storedUser?.role;
  const [products, setProducts] = useState<Product[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingIngredients, setLoadingIngredients] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [ingredientSearch, setIngredientSearch] = useState('');
  const [activeTab, setActiveTab] = useState<string>('products');
  
  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);
  const [isIngredientFormOpen, setIsIngredientFormOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | undefined>(undefined);

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

  const accessibleTabs = useMemo(() => {
    return getAccessibleStorageTabs(userRole, screenVisibility);
  }, [userRole, screenVisibility]);

  useEffect(() => {
    if (accessibleTabs.length === 0) return;
    const currentTabExists = accessibleTabs.some((tab) => tab.tabId === activeTab);
    if (!currentTabExists) {
      const firstEnabled = accessibleTabs.find((tab) => !tab.disabled);
      setActiveTab(firstEnabled?.tabId || accessibleTabs[0].tabId || 'products');
    }
  }, [accessibleTabs, activeTab]);

  const renderTabContent = () => {
    if (accessibleTabs.length === 0) {
      return (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 text-sm text-slate-600 dark:text-slate-300">
          Tất cả tab trong Kho đang bị tắt trong Cài đặt màn hình.
        </div>
      );
    }

    const activeTabConfig = accessibleTabs.find((tab) => tab.tabId === activeTab);
    if (activeTabConfig?.disabled) {
      return (
        <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-6 text-sm text-amber-700 dark:text-amber-300">
          Tab này đang ở trạng thái bảo trì.
        </div>
      );
    }

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

    return null;
  };

  return (
    <div className="h-full relative flex flex-col space-y-6">
      <TabsHeader tabs={accessibleTabs} activeTab={activeTab} onChange={setActiveTab} />

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
    </div>
  );
};

export default InventoryPage;