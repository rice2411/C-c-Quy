import React, { useState, useEffect, useRef } from 'react';
import { Save, Image, Tag, DollarSign, AlignLeft, AlertCircle, Upload, Cake, CheckCircle2, Loader2, Trash2 } from 'lucide-react';
import BaseSlidePanel from '@/components/BaseSlidePanel';
import { Product, ProductRecipe, ProductMaterial, Recipe, Ingredient, IngredientType } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { uploadImage, getProductImagePath } from '@/services/imageService';
import { fetchRecipes } from '@/services/recipeService';
import { getTypeColors, getTypeIcon } from '@/utils/ingredientTypeUtil';

interface ProductFormProps {
  initialData?: Product | null;
  ingredients: Ingredient[];
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
}

const ProductForm: React.FC<ProductFormProps> = ({ initialData, ingredients, onSave, onCancel }) => {
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [price, setPrice] = useState(0);
  const [image, setImage] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [recipes, setRecipes] = useState<ProductRecipe[]>([]);
  const [materials, setMaterials] = useState<ProductMaterial[]>([]);
  const [fullRecipes, setFullRecipes] = useState<Recipe[]>([]);
  const [loadingRecipes, setLoadingRecipes] = useState(false);
  const [recipeSearch, setRecipeSearch] = useState('');
  const [materialSearch, setMaterialSearch] = useState('');
  const [showRecipeQuantityModal, setShowRecipeQuantityModal] = useState(false);
  const [showMaterialQuantityModal, setShowMaterialQuantityModal] = useState(false);
  const [quantityModalRecipe, setQuantityModalRecipe] = useState<{ recipe: Recipe; productRecipe: ProductRecipe } | null>(null);
  const [quantityModalMaterial, setQuantityModalMaterial] = useState<{ material: Ingredient; productMaterial: ProductMaterial } | null>(null);
  const [quantityModalValue, setQuantityModalValue] = useState<string>('');
  const quantityInputRef = useRef<HTMLInputElement>(null);

  const materialIngredients = ingredients.filter(ing => ing.type === IngredientType.MATERIAL);

  const filteredRecipes = fullRecipes.filter(r => 
    r.name.toLowerCase().includes(recipeSearch.toLowerCase())
  );

  const filteredMaterials = materialIngredients.filter(ing =>
    ing.name.toLowerCase().includes(materialSearch.toLowerCase())
  );

  useEffect(() => {
    const loadFullRecipes = async () => {
      setLoadingRecipes(true);
      try {
        const recipesData = await fetchRecipes();
        const fullOnly = recipesData.filter(r => r.recipeType === 'full');
        setFullRecipes(fullOnly);
      } catch (error) {
        console.error('Failed to load recipes:', error);
      } finally {
        setLoadingRecipes(false);
      }
    };
    loadFullRecipes();
  }, []);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setPrice(initialData.price);
      setImage(initialData.image || '');
      setCategory(initialData.category);
      setDescription(initialData.description || '');
      setStatus(initialData.status);
      setRecipes(initialData.recipes || []);
      setMaterials(initialData.materials || []);
    } else {
      setImage('');
      setRecipes([]);
      setMaterials([]);
    }
  }, [initialData]);

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Vui lòng chọn file ảnh');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Kích thước ảnh không được vượt quá 5MB');
      return;
    }

    setIsUploading(true);
    setError(null);
    try {
      const productId = initialData?.id || 'new';
      const imagePath = getProductImagePath(productId, file.name);
      const downloadURL = await uploadImage(file, imagePath);
      setImage(downloadURL);
    } catch (err: any) {
      setError(err.message || 'Không thể upload ảnh');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleToggleRecipe = (recipe: Recipe) => {
    const existing = recipes.find(r => r.recipeId === recipe.id);
    if (existing) {
      setRecipes(recipes.filter(r => r.recipeId !== recipe.id));
    } else {
      setRecipes([...recipes, { recipeId: recipe.id, quantity: 1 }]);
    }
  };

  const handleOpenRecipeQuantityModal = (recipe: Recipe, e: React.MouseEvent) => {
    e.stopPropagation();
    const productRecipe = recipes.find(r => r.recipeId === recipe.id);
    if (productRecipe) {
      setQuantityModalRecipe({ recipe, productRecipe });
      setQuantityModalValue(productRecipe.quantity.toString());
      setShowRecipeQuantityModal(true);
      setTimeout(() => {
        quantityInputRef.current?.focus();
        quantityInputRef.current?.select();
      }, 10);
    }
  };

  const handleSaveRecipeQuantity = () => {
    if (!quantityModalRecipe) return;
    const numValue = quantityModalValue === '' ? 1 : Number(quantityModalValue);
    if (!isNaN(numValue) && numValue > 0) {
      setRecipes(recipes.map(r => 
        r.recipeId === quantityModalRecipe.recipe.id 
          ? { ...r, quantity: numValue } 
          : r
      ));
    }
    setShowRecipeQuantityModal(false);
    setQuantityModalRecipe(null);
    setQuantityModalValue('');
  };

  const handleCancelRecipeQuantityModal = () => {
    setShowRecipeQuantityModal(false);
    setQuantityModalRecipe(null);
    setQuantityModalValue('');
  };

  const handleToggleMaterial = (material: Ingredient) => {
    const existing = materials.find(m => m.materialId === material.id);
    if (existing) {
      setMaterials(materials.filter(m => m.materialId !== material.id));
    } else {
      setMaterials([...materials, { materialId: material.id, quantity: 1 }]);
    }
  };

  const handleOpenMaterialQuantityModal = (material: Ingredient, e: React.MouseEvent) => {
    e.stopPropagation();
    const productMaterial = materials.find(m => m.materialId === material.id);
    if (productMaterial) {
      setQuantityModalMaterial({ material, productMaterial });
      setQuantityModalValue(productMaterial.quantity.toString());
      setShowMaterialQuantityModal(true);
      setTimeout(() => {
        quantityInputRef.current?.focus();
        quantityInputRef.current?.select();
      }, 10);
    }
  };

  const handleSaveMaterialQuantity = () => {
    if (!quantityModalMaterial) return;
    const numValue = quantityModalValue === '' ? 1 : Number(quantityModalValue);
    if (!isNaN(numValue) && numValue > 0) {
      setMaterials(materials.map(m => 
        m.materialId === quantityModalMaterial.material.id 
          ? { ...m, quantity: numValue } 
          : m
      ));
    }
    setShowMaterialQuantityModal(false);
    setQuantityModalMaterial(null);
    setQuantityModalValue('');
  };

  const handleCancelMaterialQuantityModal = () => {
    setShowMaterialQuantityModal(false);
    setQuantityModalMaterial(null);
    setQuantityModalValue('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (!name.trim()) throw new Error("Tên sản phẩm là bắt buộc");
      if (price < 0) throw new Error("Giá không được âm");
      if (recipes.length === 0) throw new Error("Vui lòng chọn ít nhất một công thức bánh");

      const formData = {
        id: initialData?.id,
        name,
        price,
        image,
        category: category || 'General',
        description,
        status,
        recipes: recipes.filter(r => r.quantity > 0),
        materials: materials.filter(m => m.quantity > 0)
      };

      await onSave(formData);
    } catch (err: any) {
      setError(err.message || "Không thể lưu sản phẩm");
      setIsSubmitting(false);
    }
  };

  const isRecipeSelected = (recipeId: string) => {
    return recipes.some(r => r.recipeId === recipeId);
  };

  const getSelectedRecipe = (recipeId: string) => {
    return recipes.find(r => r.recipeId === recipeId);
  };

  const isMaterialSelected = (materialId: string) => {
    return materials.some(m => m.materialId === materialId);
  };

  const getSelectedMaterial = (materialId: string) => {
    return materials.find(m => m.materialId === materialId);
  };

  const footerContent = (
    <div className="flex justify-end gap-3">
      <button
        type="button"
        onClick={onCancel}
        disabled={isSubmitting}
        className="px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
      >
        {t('form.cancel')}
      </button>
      <button
        type="submit"
        disabled={isSubmitting || isUploading}
        className="px-6 py-2 bg-orange-600 dark:bg-orange-500 rounded-lg text-sm font-medium text-white hover:bg-orange-700 dark:hover:bg-orange-600 shadow-sm flex items-center justify-center gap-2 disabled:opacity-70 transition-colors"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {t('form.saving')}
          </>
        ) : (
          <>
            <Save className="w-4 h-4" />
            {t('form.save')}
          </>
        )}
      </button>
    </div>
  );

  return (
    <BaseSlidePanel
      isOpen={true}
      onClose={onCancel}
      maxWidth="2xl"
      title={initialData ? t('inventory.formTitleEdit') : t('inventory.formTitleAdd')}
      footer={footerContent}
    >
      <form id="product-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
        {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            {/* Image Upload */}
            <div className="flex flex-col items-center gap-4">
              <div className="w-40 h-40 rounded-lg overflow-hidden border-2 border-slate-200 dark:border-slate-700 shadow-sm relative bg-slate-50 dark:bg-slate-900">
                {image ? (
                  <img 
                    src={image} 
                    alt="Preview" 
                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/400x400?text=No+Image' }}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <Image className="w-12 h-12" />
                  </div>
                )}
                {isUploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  </div>
                )}
              </div>
              <div className="flex flex-col items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" />
                  {isUploading ? 'Đang upload...' : 'Upload ảnh'}
                </button>
                <p className="text-xs text-slate-500 dark:text-slate-400">JPG, PNG tối đa 5MB</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('inventory.name')} *</label>
                <div className="relative">
                  <Tag className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                    placeholder="VD: Bánh kem chocolate"
                  />
                </div>
              </div>

              {/* Price & Category */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('inventory.price')}</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input 
                      type="number" 
                      min="0"
                      step="1000"
                      value={price}
                      onChange={e => setPrice(Number(e.target.value))}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                    />
                  </div>
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('inventory.category')}</label>
                   <input 
                    type="text" 
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                    placeholder="VD: Bánh kem"
                  />
                </div>
              </div>

              {/* Recipes Selection */}
              <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wide">
                    Công thức bánh *
                  </h3>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {recipes.length} {t('recipes.form.selected') || 'đã chọn'}
                  </span>
                </div>

                {loadingRecipes ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <Cake className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10 pointer-events-none" />
                      <input
                        type="text"
                        value={recipeSearch}
                        onChange={(e) => setRecipeSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                        placeholder="Tìm công thức bánh..."
                      />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[400px] overflow-y-auto">
                      {filteredRecipes.map((recipe) => {
                        const isSelected = isRecipeSelected(recipe.id);
                        const selectedRecipe = getSelectedRecipe(recipe.id);
                        return (
                          <div
                            key={recipe.id}
                            onClick={() => handleToggleRecipe(recipe)}
                            className={`relative p-3 bg-white dark:bg-slate-800 rounded-lg border-2 transition-all cursor-pointer touch-manipulation ${
                              isSelected
                                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-md'
                                : 'border-purple-200 dark:border-purple-800 hover:border-purple-400 dark:hover:border-purple-600 hover:shadow-md'
                            }`}
                          >
                            {isSelected && (
                              <div className="absolute top-1 right-1">
                                <CheckCircle2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                              </div>
                            )}
                            <div className="flex flex-col items-center text-center space-y-2">
                              <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                                <Cake className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                              </div>
                              <div className="flex-1 w-full">
                                <p className="text-xs font-semibold text-slate-900 dark:text-white line-clamp-2 mb-1">
                                  {recipe.name}
                                </p>
                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded inline-block text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-700">
                                  Sản phẩm: {recipe.outputQuantity || 0}
                                </span>
                              </div>
                              {isSelected && selectedRecipe && (
                                <div
                                  onClick={(e) => handleOpenRecipeQuantityModal(recipe, e)}
                                  className="w-full px-2 py-1.5 bg-purple-600 dark:bg-purple-500 text-white rounded-md text-xs font-bold hover:bg-purple-700 dark:hover:bg-purple-600 transition-colors touch-manipulation"
                                >
                                  {selectedRecipe.quantity > 0
                                    ? `${selectedRecipe.quantity} set`
                                    : 'Nhập số lượng'}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              {/* Materials Selection */}
              <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wide">
                    Vật liệu
                  </h3>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {materials.length} {t('recipes.form.selected') || 'đã chọn'}
                  </span>
                </div>

                {materialIngredients.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400">Chưa có vật liệu nào</p>
                ) : (
                  <>
                    <div className="relative">
                      <input
                        type="text"
                        value={materialSearch}
                        onChange={(e) => setMaterialSearch(e.target.value)}
                        className="w-full pl-3 pr-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                        placeholder="Tìm vật liệu..."
                      />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[400px] overflow-y-auto">
                      {filteredMaterials.map((material) => {
                        const isSelected = isMaterialSelected(material.id);
                        const selectedMaterial = getSelectedMaterial(material.id);
                        const materialColors = getTypeColors(IngredientType.MATERIAL);
                        const MaterialIcon = getTypeIcon(IngredientType.MATERIAL);
                        return (
                          <div
                            key={material.id}
                            onClick={() => handleToggleMaterial(material)}
                            className={`relative p-3 bg-white dark:bg-slate-800 rounded-lg border-2 transition-all cursor-pointer touch-manipulation ${
                              isSelected
                                ? `${materialColors.border} bg-orange-50 dark:bg-orange-900/20 shadow-md`
                                : `${materialColors.border} hover:border-orange-400 dark:hover:border-orange-500 hover:shadow-md`
                            }`}
                          >
                            {isSelected && (
                              <div className="absolute top-1 right-1">
                                <CheckCircle2 className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                              </div>
                            )}
                            <div className="flex flex-col items-center text-center space-y-2">
                              <div className={`p-2 rounded-lg ${materialColors.bg} ${materialColors.border} border`}>
                                <MaterialIcon className={`w-5 h-5 ${materialColors.icon}`} />
                              </div>
                              <div className="flex-1 w-full">
                                <p className={`text-xs font-semibold ${materialColors.text} line-clamp-2 mb-1`}>
                                  {material.name}
                                </p>
                              </div>
                              {isSelected && selectedMaterial && (
                                <div
                                  onClick={(e) => handleOpenMaterialQuantityModal(material, e)}
                                  className="w-full px-2 py-1.5 bg-orange-600 dark:bg-orange-500 text-white rounded-md text-xs font-bold hover:bg-orange-700 dark:hover:bg-orange-600 transition-colors touch-manipulation"
                                >
                                  {selectedMaterial.quantity > 0
                                    ? `${selectedMaterial.quantity}`
                                    : 'Nhập số lượng'}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

               {/* Status */}
               <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('inventory.status')}</label>
                <select 
                    value={status} 
                    onChange={e => setStatus(e.target.value as 'active' | 'inactive')}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                >
                    <option value="active">{t('inventory.active')}</option>
                    <option value="inactive">{t('inventory.inactive')}</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('inventory.description')}</label>
                <div className="relative">
                   <AlignLeft className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                   <textarea 
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={3}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none resize-none"
                    placeholder="Mô tả sản phẩm..."
                  />
                </div>
              </div>
            </div>

          </form>

          <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 flex justify-end gap-3">
             <button 
              type="button" 
              onClick={onCancel}
              disabled={isSubmitting || isUploading}
              className="px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              {t('form.cancel')}
            </button>
            <button 
              onClick={handleSubmit}
              disabled={isSubmitting || isUploading}
              className="px-6 py-2 bg-orange-600 dark:bg-orange-500 rounded-lg text-sm font-medium text-white hover:bg-orange-700 dark:hover:bg-orange-600 shadow-sm flex items-center gap-2 disabled:opacity-70 transition-colors"
            >
               {isSubmitting ? t('form.saving') : (
                <>
                  <Save className="w-4 h-4" /> {t('form.saveProduct')}
                </>
              )}
            </button>
          </div>

      {/* Recipe Quantity Modal */}
      {showRecipeQuantityModal && quantityModalRecipe && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm"
            onClick={handleCancelRecipeQuantityModal}
          />
          <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              Nhập số lượng set
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              {quantityModalRecipe.recipe.name}
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                  Số lượng set *
                </label>
                <div className="relative">
                  <input
                    ref={quantityInputRef}
                    type="number"
                    min="1"
                    step="1"
                    value={quantityModalValue}
                    onChange={(e) => setQuantityModalValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSaveRecipeQuantity();
                      } else if (e.key === 'Escape') {
                        handleCancelRecipeQuantityModal();
                      }
                    }}
                    className="w-full px-4 py-3 text-base font-medium bg-slate-50 dark:bg-slate-700 border-2 border-purple-500 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none touch-manipulation"
                    placeholder="1"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleCancelRecipeQuantityModal}
                  className="flex-1 px-4 py-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg transition-colors touch-manipulation"
                >
                  {t('form.cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleSaveRecipeQuantity}
                  className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors touch-manipulation"
                >
                  Áp dụng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Material Quantity Modal */}
      {showMaterialQuantityModal && quantityModalMaterial && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm"
            onClick={handleCancelMaterialQuantityModal}
          />
          <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              Nhập số lượng
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              {quantityModalMaterial.material.name}
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                  Số lượng *
                </label>
                <div className="relative">
                  <input
                    ref={quantityInputRef}
                    type="number"
                    min="1"
                    step="1"
                    value={quantityModalValue}
                    onChange={(e) => setQuantityModalValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSaveMaterialQuantity();
                      } else if (e.key === 'Escape') {
                        handleCancelMaterialQuantityModal();
                      }
                    }}
                    className="w-full px-4 py-3 text-base font-medium bg-slate-50 dark:bg-slate-700 border-2 border-orange-500 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none touch-manipulation"
                    placeholder="1"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleCancelMaterialQuantityModal}
                  className="flex-1 px-4 py-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg transition-colors touch-manipulation"
                >
                  {t('form.cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleSaveMaterialQuantity}
                  className="flex-1 px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg transition-colors touch-manipulation"
                >
                  Áp dụng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </BaseSlidePanel>
  );
};

export default ProductForm;
