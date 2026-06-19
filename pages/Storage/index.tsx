import React, { useState, useEffect, useMemo } from 'react';
import { Product } from '@/types';
import { fetchProducts, addProduct, updateProduct } from '@/services/productService';
import { useOrders } from '@/hooks/useOrders';
import TabsHeader from '@/pages/Storage/TabsHeader';
import { ProductForm } from '@/pages/Storage/product';
import ProductStatsBanner from '@/pages/Storage/product/ProductStatsBanner';
import ProductSection from '@/pages/Storage/product/ProductSection';
import { getAccessibleStorageTabs } from '@/config/routes';
import { useAuth } from '@/contexts/AuthContext';
import { useScreenConfig } from '@/contexts/ScreenConfigContext';
import { getUserFromLocalStorage } from '@/utils/user/userUtil';
import Box from '@/components/ui/Box';
import Card from '@/components/ui/Card';
import Typography from '@/components/ui/Typography';

const InventoryPage: React.FC = () => {
  const { userData } = useAuth();
  const { screenVisibility } = useScreenConfig();
  const storedUser = React.useMemo(() => getUserFromLocalStorage(), []);
  const userRole = userData?.role || storedUser?.role;
  const { orders } = useOrders();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<string>('products');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);

  const loadProducts = async () => {
    setLoading(true);
    const data = await fetchProducts();
    setProducts(data);
    setLoading(false);
  };

  useEffect(() => {
    loadProducts();
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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, ...productData } = data;
      await addProduct(productData);
    }
    await loadProducts();
    setIsFormOpen(false);
  };

  const filteredProducts = useMemo(() => {
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

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
        <Card
          padding="lg"
          borderClassName="border-slate-200 dark:border-slate-700"
          backgroundClassName="bg-white dark:bg-slate-800"
          textClassName="text-sm text-slate-600 dark:text-slate-300"
        >
          Tất cả tab trong Kho đang bị tắt trong Cài đặt màn hình.
        </Card>
      );
    }

    const activeTabConfig = accessibleTabs.find((tab) => tab.tabId === activeTab);
    if (activeTabConfig?.disabled) {
      return (
        <Card
          padding="lg"
          borderClassName="border-amber-200 dark:border-amber-800"
          backgroundClassName="bg-amber-50 dark:bg-amber-900/20"
          textClassName="text-sm text-amber-700 dark:text-amber-300"
        >
          Tab này đang ở trạng thái bảo trì.
        </Card>
      );
    }

    if (activeTab === 'products') {
      return (
        <>
          <ProductStatsBanner products={products} orders={orders} />
          <ProductSection
            products={products}
            orders={orders}
            loading={loading}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onCreate={handleCreate}
            onEdit={handleEdit}
            onAfterMutate={loadProducts}
          />
        </>
      );
    }

    return null;
  };

  return (
    <Box layoutClassName="relative flex h-full flex-col space-y-6">
      {accessibleTabs.length > 1 ? (
        <TabsHeader tabs={accessibleTabs} activeTab={activeTab} onChange={setActiveTab} />
      ) : null}

      {renderTabContent()}

      {isFormOpen && (
        <ProductForm initialData={editingProduct} onSave={handleSave} onCancel={() => setIsFormOpen(false)} />
      )}
    </Box>
  );
};

export default InventoryPage;
