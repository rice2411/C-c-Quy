import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Save, Image, Tag, DollarSign, AlignLeft, AlertCircle, Upload, Loader2, Plus, X } from 'lucide-react';
import BaseSlidePanel from '@/components/BaseSlidePanel';
import Badge from '@/components/ui/Badge';
import Textarea from '@/components/ui/Textarea';
import { Product, Ingredient } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { uploadImage, getProductImagePath } from '@/services/imageService';

interface ProductFormProps {
  initialData?: Product | null;
  ingredients: Ingredient[];
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
}

const TAG_COLOR_PALETTES = [
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

const ProductForm: React.FC<ProductFormProps> = ({ initialData, ingredients: _ingredients, onSave, onCancel }) => {
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [price, setPrice] = useState(0);
  const [image, setImage] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagSearch, setTagSearch] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const TAG_SUGGESTIONS = useMemo(
    () => ['Bánh kem', 'Bánh quy', 'Set quà', 'Sinh nhật', 'Lễ tết', 'Bán chạy', 'Mới', 'Theo mùa'],
    []
  );

  const filteredTagSuggestions = useMemo(() => {
    const q = tagSearch.trim().toLowerCase();
    return TAG_SUGGESTIONS.filter((tag) => tag.toLowerCase().includes(q));
  }, [TAG_SUGGESTIONS, tagSearch]);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setPrice(initialData.price);
      setImage(initialData.image || '');
      setCategory(initialData.category);
      setTags(initialData.tags || []);
      setDescription(initialData.description || '');
      setStatus(initialData.status);
    } else {
      setImage('');
      setTags([]);
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

  const normalizeTag = (raw: string) => raw.trim().replace(/\s+/g, ' ');

  const hasTag = (value: string) => {
    const normalized = normalizeTag(value).toLowerCase();
    return tags.some((tag) => tag.toLowerCase() === normalized);
  };

  const addTag = (rawTag: string) => {
    const normalized = normalizeTag(rawTag);
    if (!normalized || hasTag(normalized)) return;
    setTags((prev) => [...prev, normalized]);
  };

  const removeTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((tag) => tag !== tagToRemove));
  };

  const handleAddTagFromInput = () => {
    addTag(tagSearch);
    setTagSearch('');
  };

  const getTagPalette = (tag: string) => {
    const hash = tag.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
    return TAG_COLOR_PALETTES[hash % TAG_COLOR_PALETTES.length];
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
        tags: tags.filter((tag) => normalizeTag(tag) !== ''),
        description,
        status,
      };

      await onSave(formData);
    } catch (err: any) {
      setError(err.message || "Không thể lưu sản phẩm");
      setIsSubmitting(false);
    }
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
                    <Image layoutClassName="w-12 h-12" />
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

              {/* Price, Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

              {/* Product Tags */}
              <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wide">
                    Tag sản phẩm <span className="text-slate-500 dark:text-slate-400 font-normal">(Tùy chọn)</span>
                  </h3>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {tags.length} đã chọn
                  </span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagSearch}
                    onChange={(e) => setTagSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTagFromInput();
                      }
                    }}
                    className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                    placeholder="Nhập tag sản phẩm..."
                  />
                  <button
                    type="button"
                    onClick={handleAddTagFromInput}
                    className="px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Thêm
                  </button>
                </div>

                {filteredTagSuggestions.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {filteredTagSuggestions.map((tag) => {
                      const selected = hasTag(tag);
                      const palette = getTagPalette(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => (selected ? removeTag(tag) : addTag(tag))}
                          className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                            selected
                              ? palette.selected
                              : palette.idle
                          }`}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                )}

                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {tags.map((tag) => {
                      const palette = getTagPalette(tag);
                      return (
                        <Badge
                          key={tag}
                          className={palette.chip}
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className={palette.removeHover}
                            aria-label={`Remove tag ${tag}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      );
                    })}
                  </div>
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
                <Textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={3}
                  className="resize-none"
                  placeholder="Mô tả sản phẩm..."
                  leftIcon={<AlignLeft className="h-4 w-4" />}
                />
              </div>
            </div>

          </form>

    </BaseSlidePanel>
  );
};

export default ProductForm;
