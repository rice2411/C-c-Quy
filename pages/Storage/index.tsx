import React, { useState, useEffect, useMemo } from 'react';
import { Package } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Product } from '@/types';
import { fetchProducts, addProduct, updateProduct, deleteProduct } from '@/services/productService';
import ProductForm from '@/pages/Storage/components/ProductForm';
import ConfirmModal from '@/components/ConfirmModal';
import TabsHeader from '@/pages/Storage/components/TabsHeader';
import ProductToolbar from '@/pages/Storage/components/ProductToolbar';
import ProductGrid from '@/pages/Storage/components/ProductGrid';
import PlaceholderTab from '@/pages/Storage/components/PlaceholderTab';

type InventoryTab = 'products' | 'ingredients' | 'recipes';

const InventoryPage: React.FC = () => {
  const { t } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<InventoryTab>('products');
  
  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);

  // Delete State
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
      // Destructure to remove 'id' which is undefined for new products
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, ...productData } = data;
      await addProduct(productData);
    }
    await loadProducts();
    setIsFormOpen(false);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await deleteProduct(deleteId);
      await loadProducts();
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);


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
            onDelete={handleDeleteClick}
            onCreate={handleCreate}
          />
        </>
      );
    }

    return <PlaceholderTab tab={activeTab} />;
  };

  return (
    <div className="h-full relative flex flex-col space-y-6">
      <TabsHeader activeTab={activeTab} onChange={setActiveTab} />

      {renderTabContent()}

      {isFormOpen && (
        <ProductForm 
           initialData={editingProduct}
           onSave={handleSave}
           onCancel={() => setIsFormOpen(false)}
        />
      )}

      <ConfirmModal 
        isOpen={isDeleteModalOpen}
        title={t('inventory.title')}
        message={t('inventory.deleteConfirm')}
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default InventoryPage;