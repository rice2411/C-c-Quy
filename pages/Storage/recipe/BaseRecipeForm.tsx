import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  AlertCircle,
  ChefHat,
  Save,
  Search,
  AlignLeft,
  Box,
  CheckCircle2,
} from "lucide-react";
import BaseSlidePanel from "@/components/BaseSlidePanel";
import { Recipe, RecipeIngredient, Ingredient, IngredientType } from "@/types";
import { useLanguage } from "@/contexts/LanguageContext";
import { calculateCurrentQuantity, isOutOfStock } from "@/utils/ingredientUtil";

const getTypeColors = (type: IngredientType) => {
  switch (type) {
    case IngredientType.BASE:
      return {
        bg: "bg-blue-50 dark:bg-blue-900/20",
        border: "border-blue-200 dark:border-blue-800",
        text: "text-blue-700 dark:text-blue-300",
        icon: "text-blue-600 dark:text-blue-400",
      };
    default:
      return {
        bg: "bg-slate-50 dark:bg-slate-800",
        border: "border-slate-200 dark:border-slate-700",
        text: "text-slate-700 dark:text-slate-300",
        icon: "text-slate-600 dark:text-slate-400",
      };
  }
};

interface BaseRecipeFormProps {
  isOpen: boolean;
  initialData?: Recipe;
  ingredients: Ingredient[];
  onSave: (data: any) => Promise<void>;
  onClose: () => void;
}

const BaseRecipeForm: React.FC<BaseRecipeFormProps> = ({
  isOpen,
  initialData,
  ingredients,
  onSave,
  onClose,
}) => {
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [recipeIngredients, setRecipeIngredients] = useState<
    RecipeIngredient[]
  >([]);

  const [ingredientSearch, setIngredientSearch] = useState("");
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [quantityModalIngredient, setQuantityModalIngredient] = useState<{
    ingredient: Ingredient;
    recipeIngredient: RecipeIngredient;
  } | null>(null);
  const [quantityModalValue, setQuantityModalValue] = useState<string>("");
  const quantityInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setName(initialData.name);
        setDescription(initialData.description || "");
        setInstructions(initialData.instructions || "");
        setRecipeIngredients(initialData.ingredients || []);
      } else {
        setName("");
        setDescription("");
        setInstructions("");
        setRecipeIngredients([]);
      }
      setError(null);
      setShowQuantityModal(false);
      setQuantityModalIngredient(null);
      setQuantityModalValue("");
    }
  }, [initialData, isOpen]);

  useEffect(() => {
    if (showQuantityModal && quantityInputRef.current) {
      setTimeout(() => {
        quantityInputRef.current?.focus();
        quantityInputRef.current?.select();
      }, 100);
    }
  }, [showQuantityModal]);

  const allIngredients = useMemo(
    () =>
      ingredients
        .filter((ing) => ing.type === IngredientType.BASE)
        .filter((ing) => {
          if (!ingredientSearch.trim()) return true;
          return ing.name
            .toLowerCase()
            .includes(ingredientSearch.toLowerCase());
        }),
    [ingredients, ingredientSearch]
  );

  const isIngredientSelected = (ingredientId: string) => {
    return recipeIngredients.some((ri) => ri.ingredientId === ingredientId);
  };

  const getSelectedIngredient = (ingredientId: string) => {
    return recipeIngredients.find((ri) => ri.ingredientId === ingredientId);
  };

  const handleToggleIngredient = (ingredient: Ingredient) => {
    const isSelected = isIngredientSelected(ingredient.id);
    if (isSelected) {
      setRecipeIngredients(
        recipeIngredients.filter((ri) => ri.ingredientId !== ingredient.id)
      );
    } else {
      const newIngredient: RecipeIngredient = {
        ingredientId: ingredient.id,
        ingredientName: ingredient.name,
        quantity: 0,
        unit: ingredient.unit,
      };
      setRecipeIngredients([...recipeIngredients, newIngredient]);
      setShowQuantityModal(true);
      setQuantityModalIngredient({
        ingredient,
        recipeIngredient: newIngredient,
      });
      setQuantityModalValue("0");
    }
  };

  const handleOpenQuantityModal = (
    ingredient: Ingredient,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    const selected = getSelectedIngredient(ingredient.id);
    if (selected) {
      setShowQuantityModal(true);
      setQuantityModalIngredient({ ingredient, recipeIngredient: selected });
      setQuantityModalValue(selected.quantity.toString());
    }
  };

  const handleSaveQuantity = () => {
    if (!quantityModalIngredient) return;
    const numValue = quantityModalValue === "" ? 0 : Number(quantityModalValue);
    if (!isNaN(numValue) && numValue >= 0) {
      setRecipeIngredients(
        recipeIngredients.map((ri) =>
          ri.ingredientId === quantityModalIngredient.ingredient.id
            ? { ...ri, quantity: numValue }
            : ri
        )
      );
    }
    setShowQuantityModal(false);
    setQuantityModalIngredient(null);
    setQuantityModalValue("");
  };

  const handleCancelQuantityModal = () => {
    if (!quantityModalIngredient) return;
    const selected = getSelectedIngredient(
      quantityModalIngredient.ingredient.id
    );
    if (selected && selected.quantity === 0) {
      setRecipeIngredients(
        recipeIngredients.filter(
          (ri) => ri.ingredientId !== quantityModalIngredient.ingredient.id
        )
      );
    }
    setShowQuantityModal(false);
    setQuantityModalIngredient(null);
    setQuantityModalValue("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (!name.trim()) throw new Error(t("recipes.form.errors.nameRequired"));
      if (recipeIngredients.length === 0)
        throw new Error(t("recipes.form.errors.ingredientsRequired"));
      if (recipeIngredients.some((ri) => ri.quantity <= 0)) {
        throw new Error(t("recipes.form.errors.quantityRequired"));
      }

      const payload: any = {
        id: initialData?.id,
        name: name.trim(),
        description: description.trim(),
        ingredients: recipeIngredients,
        instructions: instructions.trim(),
        recipeType: "base",
      };

      await onSave(payload);
      onClose();
    } catch (err: any) {
      setError(err.message || t("recipes.form.errors.saveFailed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const headerContent = (
    <div className="flex-1 min-w-0 pr-2">
      <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
        {initialData
          ? t("recipes.form.editBaseRecipe") || "Sửa công thức nền"
          : t("recipes.form.addBaseRecipe") || "Thêm công thức nền"}
      </h2>
      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
        {t("recipes.form.baseRecipeSubtitle") ||
          "Tạo công thức nền từ nguyên liệu cơ bản"}
      </p>
    </div>
  );

  const footerContent = (
    <div className="flex justify-end gap-3">
      <button
        type="button"
        onClick={onClose}
        disabled={isSubmitting}
        className="px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
      >
        {t("form.cancel")}
      </button>
      <button
        type="submit"
        form="base-recipe-form"
        disabled={isSubmitting}
        className="px-6 py-2 bg-orange-600 dark:bg-orange-500 rounded-lg text-sm font-medium text-white hover:bg-orange-700 dark:hover:bg-orange-600 shadow-sm flex items-center justify-center gap-2 disabled:opacity-70 transition-colors"
      >
        {isSubmitting ? (
          <>
            <Save className="w-4 h-4 animate-spin" />
            {t("form.saving")}
          </>
        ) : (
          <>
            <Save className="w-4 h-4" />
            {t("recipes.form.save")}
          </>
        )}
      </button>
    </div>
  );

  if (!isOpen) return null;

  return (
    <BaseSlidePanel
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="3/4"
      headerContent={headerContent}
      footer={footerContent}
    >
      <div className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-900/50 p-4 sm:p-6 space-y-4 sm:space-y-5">
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <form
          id="base-recipe-form"
          onSubmit={handleSubmit}
          className="space-y-4 sm:space-y-5"
        >
          <div className="bg-white dark:bg-slate-800 p-3 sm:p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-3">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1 uppercase tracking-wide">
                {t("recipes.form.name")} *
              </label>
              <div className="relative">
                <ChefHat className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 sm:py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none touch-manipulation"
                  placeholder={t("recipes.form.namePlaceholder")}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1 uppercase tracking-wide">
                {t("recipes.form.description")}
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none resize-none touch-manipulation"
                placeholder={t("recipes.form.descriptionPlaceholder")}
              />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-3 sm:p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wide">
                {t("recipes.form.ingredients")} * (
                {t("ingredients.form.types.base")})
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {recipeIngredients.length}{" "}
                {t("recipes.form.selected") || "đã chọn"}
              </span>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10 pointer-events-none" />
              <input
                type="text"
                value={ingredientSearch}
                onChange={(e) => setIngredientSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none touch-manipulation"
                placeholder={t("recipes.form.addIngredientPlaceholder")}
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[500px] overflow-y-auto">
              {allIngredients.map((ing) => {
                const currentQuantity = calculateCurrentQuantity(ing);
                const outOfStock = isOutOfStock(ing);
                const colors = getTypeColors(ing.type);
                const isSelected = isIngredientSelected(ing.id);
                const selectedIngredient = getSelectedIngredient(ing.id);

                return (
                  <div
                    key={ing.id}
                    onClick={() => !outOfStock && handleToggleIngredient(ing)}
                    className={`relative p-3 bg-white dark:bg-slate-800 rounded-lg border-2 transition-all cursor-pointer touch-manipulation ${
                      isSelected
                        ? `${colors.border} bg-orange-50 dark:bg-orange-900/20 shadow-md`
                        : outOfStock
                        ? "border-slate-200 dark:border-slate-700 opacity-50 cursor-not-allowed"
                        : `${colors.border} hover:border-orange-400 dark:hover:border-orange-500 hover:shadow-md`
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-1 right-1">
                        <CheckCircle2 className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                      </div>
                    )}
                    <div className="flex flex-col items-center text-center space-y-2">
                      <div
                        className={`p-2 rounded-lg ${colors.bg} ${colors.border} border`}
                      >
                        <Box className={`w-5 h-5 ${colors.icon}`} />
                      </div>
                      <div className="flex-1 w-full">
                        <p className="text-xs font-semibold text-slate-900 dark:text-white line-clamp-2 mb-1">
                          {ing.name}
                        </p>
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded inline-block ${
                            outOfStock
                              ? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20"
                              : "text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-700"
                          }`}
                        >
                          {outOfStock
                            ? t("recipes.form.outOfStock")
                            : `${currentQuantity.toLocaleString()} ${
                                ing.unit === "piece"
                                  ? t("ingredients.form.unitPiece")
                                  : "g"
                              }`}
                        </span>
                      </div>
                      {isSelected && selectedIngredient && (
                        <div
                          onClick={(e) => handleOpenQuantityModal(ing, e)}
                          className="w-full px-2 py-1.5 bg-orange-600 dark:bg-orange-500 text-white rounded-md text-xs font-bold hover:bg-orange-700 dark:hover:bg-orange-600 transition-colors touch-manipulation"
                        >
                          {selectedIngredient.quantity > 0
                            ? `${selectedIngredient.quantity.toLocaleString()} ${
                                selectedIngredient.unit === "piece"
                                  ? t("ingredients.form.unitPiece")
                                  : "g"
                              }`
                            : t("recipes.form.setQuantity") || "Nhập số lượng"}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-3 sm:p-5 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-3 sm:space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1 uppercase tracking-wide">
                {t("recipes.form.instructions")}
              </label>
              <div className="relative">
                <AlignLeft className="absolute left-3 top-3 w-4 h-4 text-slate-400 z-10 pointer-events-none" />
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  rows={4}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none resize-none"
                  placeholder={t("recipes.form.instructionsPlaceholder")}
                />
              </div>
            </div>
          </div>
        </form>
      </div>

      {showQuantityModal && quantityModalIngredient && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm"
            onClick={handleCancelQuantityModal}
          />
          <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              {t("recipes.form.setQuantity") || "Nhập số lượng"}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              {quantityModalIngredient.ingredient.name}
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                  {t("recipes.form.quantity") || "Số lượng"} *
                </label>
                <div className="relative">
                  <input
                    ref={quantityInputRef}
                    type="number"
                    min="0"
                    step={
                      quantityModalIngredient.ingredient.unit === "piece"
                        ? 1
                        : 0.01
                    }
                    value={quantityModalValue}
                    onChange={(e) => setQuantityModalValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSaveQuantity();
                      } else if (e.key === "Escape") {
                        handleCancelQuantityModal();
                      }
                    }}
                    className="w-full px-4 py-3 text-base font-medium bg-slate-50 dark:bg-slate-700 border-2 border-orange-500 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none touch-manipulation"
                    placeholder="0"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-500 dark:text-slate-400">
                    {quantityModalIngredient.ingredient.unit === "piece"
                      ? t("ingredients.form.unitPiece")
                      : "g"}
                  </span>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleCancelQuantityModal}
                  className="flex-1 px-4 py-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg transition-colors touch-manipulation"
                >
                  {t("form.cancel")}
                </button>
                <button
                  type="button"
                  onClick={handleSaveQuantity}
                  className="flex-1 px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg transition-colors touch-manipulation"
                >
                  {t("common.apply")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </BaseSlidePanel>
  );
};

export default BaseRecipeForm;
