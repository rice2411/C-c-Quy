import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Save, Image, Tag, DollarSign, AlignLeft, AlertCircle, Upload, Cake, CheckCircle2, Loader2, Lightbulb } from 'lucide-react';
import BaseSlidePanel from '@/components/BaseSlidePanel';
import { Product, ProductRecipe, ProductMaterial, Recipe, Ingredient, IngredientType } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { uploadImage, getProductImagePath } from '@/services/imageService';
import { fetchRecipes } from '@/services/recipeService';
import { getTypeColors, getTypeIcon } from '@/utils/ingredientTypeUtil';
import { computeRecipeCost } from '@/utils/productUtil';
import { calculateAveragePrice } from '@/utils/ingredientUtil';
import { formatVND } from '@/utils/currencyUtil';

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
  const [cakesPerProduct, setCakesPerProduct] = useState<number>(0);
  const [profitMarginPercent, setProfitMarginPercent] = useState<number>(0);
  const [recipes, setRecipes] = useState<ProductRecipe[]>([]);
  const [materials, setMaterials] = useState<ProductMaterial[]>([]);
  const [fullRecipes, setFullRecipes] = useState<Recipe[]>([]);
  const [loadingRecipes, setLoadingRecipes] = useState(false);
  const [materialSearch, setMaterialSearch] = useState('');
  const [showMaterialQuantityModal, setShowMaterialQuantityModal] = useState(false);
  const [quantityModalMaterial, setQuantityModalMaterial] = useState<{ material: Ingredient; productMaterial: ProductMaterial } | null>(null);
  const [quantityModalValue, setQuantityModalValue] = useState<string>('');
  const quantityInputRef = useRef<HTMLInputElement>(null);

  const materialIngredients = ingredients.filter(ing => ing.type === IngredientType.MATERIAL);

  const filteredRecipes = fullRecipes;

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
      setCakesPerProduct(initialData.cakesPerProduct ?? 0);
      setRecipes(initialData.recipes || []);
      setMaterials(initialData.materials || []);
    } else {
      setImage('');
      setCakesPerProduct(0);
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

  const handleRecipePricePerSetChange = (recipeId: string, value: string) => {
    const num = value.trim() === '' ? undefined : Number(value);
    const pricePerSet = num != null && !isNaN(num) && num >= 0 ? num : undefined;
    setRecipes(recipes.map(r =>
      r.recipeId === recipeId ? { ...r, pricePerSet } : r
    ));
  };

  const handleRecipeQuantityChange = (recipeId: string, value: string) => {
    const num = value.trim() === '' ? 1 : Math.max(1, Math.floor(Number(value)));
    if (isNaN(num)) return;
    setRecipes(recipes.map(r =>
      r.recipeId === recipeId ? { ...r, quantity: num } : r
    ));
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

  /** Danh sách công thức đã chọn kèm giá mỗi thành phẩm (tính từ nguyên liệu). */
  const recipeCostList = useMemo(() => {
    return recipes
      .filter(r => r.quantity > 0)
      .map(pr => {
        const recipe = fullRecipes.find(f => f.id === pr.recipeId);
        if (!recipe) return null;
        const { costPerOutput } = computeRecipeCost(recipe, ingredients);
        return {
          productRecipe: pr,
          recipe,
          costPerOutput,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x != null);
  }, [recipes, fullRecipes, ingredients]);

  /** Tổng tiền công thức (dùng pricePerSet nếu có, không thì dùng totalCost 1 set). */
  const totalRecipeCost = useMemo(() => {
    return recipeCostList.reduce((sum, { productRecipe, recipe }) => {
      const { totalCost } = computeRecipeCost(recipe, ingredients);
      const costPerSet = productRecipe.pricePerSet != null && productRecipe.pricePerSet >= 0
        ? productRecipe.pricePerSet
        : totalCost;
      return sum + productRecipe.quantity * costPerSet;
    }, 0);
  }, [recipeCostList, ingredients]);

  /** Tổng số thành phẩm từ các công thức (số set × thành phẩm/set). */
  const totalCakesFromRecipes = useMemo(() => {
    return recipeCostList.reduce((sum, { productRecipe, recipe }) => {
      const out = recipe.outputQuantity && recipe.outputQuantity > 0 ? recipe.outputQuantity : 1;
      return sum + productRecipe.quantity * out;
    }, 0);
  }, [recipeCostList]);

  /** Giá thành mỗi bánh (VND/bánh) từ công thức. */
  const costPerCake = useMemo(() => {
    if (totalCakesFromRecipes <= 0) return 0;
    return totalRecipeCost / totalCakesFromRecipes;
  }, [totalRecipeCost, totalCakesFromRecipes]);

  /** Tổng giá vật liệu. */
  const materialsCost = useMemo(() => {
    return materials
      .filter(m => m.quantity > 0)
      .reduce((sum, m) => {
        const ing = ingredients.find(i => i.id === m.materialId);
        if (!ing) return sum;
        const avg = calculateAveragePrice(ing);
        if (avg <= 0 || !Number.isFinite(avg)) return sum;
        return sum + m.quantity * avg;
      }, 0);
  }, [materials, ingredients]);

  /** Gợi ý giá thành sản phẩm: vật liệu + (số bánh × giá/bánh). Số bánh mặc định 1, hoặc theo field người dùng nhập. */
  const suggestedPrice = useMemo(() => {
    const cakes = cakesPerProduct > 0 ? cakesPerProduct : 1;
    return materialsCost + cakes * costPerCake;
  }, [cakesPerProduct, costPerCake, materialsCost]);

  /** Giá bán gợi ý = giá thành × (1 + tỉ lệ lời %). */
  const suggestedSellingPrice = useMemo(() => {
    const margin = profitMarginPercent >= 0 && Number.isFinite(profitMarginPercent) ? profitMarginPercent : 0;
    return suggestedPrice * (1 + margin / 100);
  }, [suggestedPrice, profitMarginPercent]);

  const applySuggestedPrice = () => {
    const val = Math.round(suggestedSellingPrice);
    if (Number.isFinite(val) && val >= 0) setPrice(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (!name.trim()) throw new Error("Tên sản phẩm là bắt buộc");
      if (price < 0) throw new Error("Giá không được âm");

      const formData = {
        id: initialData?.id,
        name,
        price,
        image,
        category: category || 'General',
        description,
        status,
        cakesPerProduct: cakesPerProduct > 0 ? cakesPerProduct : undefined,
        recipes: recipes.filter(r => r.quantity > 0).map(r => ({
          recipeId: r.recipeId,
          quantity: r.quantity,
          ...(r.pricePerSet != null && r.pricePerSet >= 0 ? { pricePerSet: r.pricePerSet } : {}),
        })),
        materials: materials.filter(m => m.quantity > 0),
      };

      await onSave(formData);
    } catch (err: any) {
      setError(err.message || "Không thể lưu sản phẩm");
      setIsSubmitting(false);
    }
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
        form="product-form"
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

              {/* Price, Category, Số lượng bánh */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Số lượng bánh</label>
                  <input 
                    type="number" 
                    min="0"
                    step="1"
                    value={cakesPerProduct || ''}
                    onChange={e => setCakesPerProduct(e.target.value === '' ? 0 : Math.max(0, Number(e.target.value)))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                    placeholder="VD: 6"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Dùng cho gợi ý giá thành</p>
                </div>
              </div>

              {/* Suggested cost block: only when at least one recipe or material is selected */}
              {(() => {
                const hasRecipes = recipeCostList.length > 0;
                const hasMaterials = materials.some(m => m.quantity > 0);
                if (!hasRecipes && !hasMaterials) {
                  return (
                    <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-600 rounded-xl p-4">
                      <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-slate-400" />
                        Chọn công thức bánh hoặc thêm vật liệu để xem gợi ý giá thành.
                      </p>
                    </div>
                  );
                }
                return (
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                      <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-200">Gợi ý giá thành sản phẩm</h3>
                    </div>
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      {hasRecipes && hasMaterials
                        ? `Giá vật liệu + (Số bánh × Giá mỗi bánh) = ${formatVND(materialsCost)} + ${cakesPerProduct > 0 ? cakesPerProduct : 1} × ${formatVND(costPerCake)}`
                        : hasRecipes
                          ? `Số bánh × Giá mỗi bánh = ${cakesPerProduct > 0 ? cakesPerProduct : 1} × ${formatVND(costPerCake)}`
                          : `Giá vật liệu = ${formatVND(materialsCost)}`}
                    </p>
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      Giá thành: <span className="font-semibold">{formatVND(suggestedPrice)}</span>
                    </p>
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="flex items-center gap-2 text-sm text-amber-800 dark:text-amber-200">
                        <span>Tỉ lệ lời (%):</span>
                        <input
                          type="number"
                          min={0}
                          step={0.5}
                          value={profitMarginPercent}
                          onChange={(e) => {
                            const v = e.target.value.trim();
                            if (v === '') setProfitMarginPercent(0);
                            else {
                              const n = Number(v);
                              if (!isNaN(n) && n >= 0) setProfitMarginPercent(n);
                            }
                          }}
                          className="w-20 px-2 py-1.5 bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                          placeholder="0"
                        />
                      </label>
                      <span className="text-amber-800 dark:text-amber-200 text-sm">
                        Giá bán gợi ý: <span className="text-lg font-bold text-amber-700 dark:text-amber-300">{formatVND(suggestedSellingPrice)}</span>
                      </span>
                      <button
                        type="button"
                        onClick={applySuggestedPrice}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        Áp dụng vào giá
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* Recipes Selection */}
              <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wide">
                    Giá thành mỗi bánh *
                  </h3>
                </div>

                {loadingRecipes ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[400px] overflow-y-auto">
                      {filteredRecipes.map((recipe) => {
                        const { costPerOutput } = computeRecipeCost(recipe, ingredients);
                        return (
                          <div
                            key={recipe.id}
                            className="relative p-3 bg-white dark:bg-slate-800 rounded-lg border-2 border-purple-200 dark:border-purple-800 transition-all"
                          >
                            <div className="flex flex-col items-center text-center space-y-2">
                              <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                                <Cake className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                              </div>
                              <div className="flex-1 w-full">
                                <p className="text-xs font-semibold text-slate-900 dark:text-white line-clamp-2 mb-1">
                                  {recipe.name}
                                </p>
                                <div className="space-y-0.5">
                                  {costPerOutput > 0 && (
                                    <p className="text-[10px] font-semibold text-orange-600 dark:text-orange-400">
                                      {formatVND(costPerOutput)} / 1 cái
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

             

              {/* Materials Selection (optional) */}
              <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wide">
                    Vật liệu <span className="text-slate-500 dark:text-slate-400 font-normal">(Tùy chọn)</span>
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
                        const avgPrice = calculateAveragePrice(material);
                        const qty = selectedMaterial?.quantity ?? 0;
                        const materialCost = qty > 0 && avgPrice > 0 ? qty * avgPrice : 0;
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
                                {isSelected && selectedMaterial && (
                                  <div className="space-y-0.5">
                                    <div
                                      onClick={(e) => handleOpenMaterialQuantityModal(material, e)}
                                      className="text-[10px] font-semibold px-1.5 py-0.5 rounded inline-block text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-700 cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-900/30 touch-manipulation"
                                    >
                                      Số lượng: {selectedMaterial.quantity > 0 ? selectedMaterial.quantity : 'Nhập'}
                                    </div>
                                    {materialCost > 0 && (
                                      <p className="text-[10px] font-semibold text-orange-600 dark:text-orange-400">
                                        {formatVND(materialCost)}
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
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
