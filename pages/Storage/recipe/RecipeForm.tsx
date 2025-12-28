import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  AlertCircle,
  ChefHat,
  Save,
  X,
  Plus,
  Trash2,
  Search,
  AlignLeft,
  Package,
  ArrowRight,
  Box,
  FlaskConical,
  Sparkles,
  Layers,
  Minus,
  CheckCircle2,
  Edit2,
} from "lucide-react";
import BaseSlidePanel from "@/components/BaseSlidePanel";
import {
  Recipe,
  RecipeIngredient,
  Ingredient,
  IngredientType,
  RecipeType,
} from "@/types";
import { useLanguage } from "@/contexts/LanguageContext";
import { calculateCurrentQuantity, isOutOfStock } from "@/utils/ingredientUtil";
import { fetchRecipes } from "@/services/recipeService";

const getTypeIcon = (type: IngredientType) => {
  switch (type) {
    case IngredientType.BASE:
      return Box;
    case IngredientType.FLAVOR:
      return FlaskConical;
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

const getTypeColors = (type: IngredientType) => {
  switch (type) {
    case IngredientType.BASE:
      return {
        bg: "bg-blue-50 dark:bg-blue-900/20",
        border: "border-blue-200 dark:border-blue-800",
        text: "text-blue-700 dark:text-blue-300",
        icon: "text-blue-600 dark:text-blue-400",
        header: "bg-blue-100 dark:bg-blue-900/40",
      };
    case IngredientType.FLAVOR:
      return {
        bg: "bg-purple-50 dark:bg-purple-900/20",
        border: "border-purple-200 dark:border-purple-800",
        text: "text-purple-700 dark:text-purple-300",
        icon: "text-purple-600 dark:text-purple-400",
        header: "bg-purple-100 dark:bg-purple-900/40",
      };
    case IngredientType.TOPPING:
      return {
        bg: "bg-pink-50 dark:bg-pink-900/20",
        border: "border-pink-200 dark:border-pink-800",
        text: "text-pink-700 dark:text-pink-300",
        icon: "text-pink-600 dark:text-pink-400",
        header: "bg-pink-100 dark:bg-pink-900/40",
      };
    case IngredientType.DECORATION:
      return {
        bg: "bg-yellow-50 dark:bg-yellow-900/20",
        border: "border-yellow-200 dark:border-yellow-800",
        text: "text-yellow-700 dark:text-yellow-300",
        icon: "text-yellow-600 dark:text-yellow-400",
        header: "bg-yellow-100 dark:bg-yellow-900/40",
      };
    case IngredientType.MATERIAL:
      return {
        bg: "bg-teal-50 dark:bg-teal-900/20",
        border: "border-teal-200 dark:border-teal-800",
        text: "text-teal-700 dark:text-teal-300",
        icon: "text-teal-600 dark:text-teal-400",
        header: "bg-teal-100 dark:bg-teal-900/40",
      };
    default:
      return {
        bg: "bg-slate-50 dark:bg-slate-800",
        border: "border-slate-200 dark:border-slate-700",
        text: "text-slate-700 dark:text-slate-300",
        icon: "text-slate-600 dark:text-slate-400",
        header: "bg-slate-100 dark:bg-slate-700",
      };
  }
};

interface RecipeFormProps {
  isOpen: boolean;
  initialData?: Recipe;
  ingredients: Ingredient[];
  onSave: (data: any) => Promise<void>;
  onClose: () => void;
  baseRecipes?: Recipe[];
}

const RecipeForm: React.FC<RecipeFormProps> = ({
  isOpen,
  initialData,
  ingredients,
  onSave,
  onClose,
  baseRecipes = [],
}) => {
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [recipeType, setRecipeType] = useState<RecipeType>("base");
  const [baseRecipeId, setBaseRecipeId] = useState<string>("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [outputQuantity, setOutputQuantity] = useState(0);
  const [wasteRate, setWasteRate] = useState(0);
  const [recipeIngredients, setRecipeIngredients] = useState<
    RecipeIngredient[]
  >([]);
  const [loadedBaseRecipes, setLoadedBaseRecipes] = useState<Recipe[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const [ingredientSearch, setIngredientSearch] = useState("");
  const [showIngredientDropdown, setShowIngredientDropdown] = useState(false);
  const [animatingIngredient, setAnimatingIngredient] = useState<string | null>(
    null
  );
  const [flyingIngredient, setFlyingIngredient] = useState<{
    id: string;
    name: string;
    from: { x: number; y: number };
    to: { x: number; y: number };
  } | null>(null);
  const [editingQuantity, setEditingQuantity] = useState<string | null>(null);
  const [tempQuantity, setTempQuantity] = useState<string>("");
  const ingredientRef = useRef<HTMLDivElement>(null);
  const ingredientRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const selectedRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const quantityInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadBaseRecipes = async () => {
      try {
        const recipes = await fetchRecipes();
        const baseOnly = recipes.filter(
          (r) => r.recipeType === "base" || (!r.recipeType && !r.baseRecipeId)
        );
        setLoadedBaseRecipes(baseOnly);
      } catch (error) {
        console.error("Failed to load base recipes:", error);
      }
    };
    if (isOpen) {
      loadBaseRecipes();
    }
  }, [isOpen]);

  const allBaseRecipes = useMemo(() => {
    return baseRecipes.length > 0 ? baseRecipes : loadedBaseRecipes;
  }, [baseRecipes, loadedBaseRecipes]);

  const allowedIngredientTypes = useMemo(() => {
    if (recipeType === "base") {
      return [IngredientType.BASE];
    } else {
      return [IngredientType.FLAVOR, IngredientType.TOPPING];
    }
  }, [recipeType]);

  const typeOrder: IngredientType[] = [
    IngredientType.BASE,
    IngredientType.FLAVOR,
    IngredientType.TOPPING,
  ];

  useEffect(() => {
    if (isOpen) {
      setIsInitialLoad(true);
      if (initialData) {
        setName(initialData.name);
        setDescription(initialData.description || "");
        setInstructions(initialData.instructions || "");
        setOutputQuantity(initialData.outputQuantity || 0);
        setWasteRate(initialData.wasteRate || 0);
        setRecipeType(initialData.recipeType || "base");
        setBaseRecipeId(initialData.baseRecipeId || "");
        setRecipeIngredients(initialData.ingredients || []);
      } else {
        setName("");
        setDescription("");
        setInstructions("");
        setOutputQuantity(0);
        setWasteRate(0);
        setRecipeType("base");
        setBaseRecipeId("");
        setRecipeIngredients([]);
      }
      setError(null);
      setEditingQuantity(null);
      setTempQuantity("");
    }
  }, [initialData, isOpen]);

  useEffect(() => {
    if (isInitialLoad) {
      setIsInitialLoad(false);
      return;
    }

    if (recipeType === "full" && baseRecipeId) {
      const selectedBase = allBaseRecipes.find((r) => r.id === baseRecipeId);
      if (selectedBase) {
        const baseIngredients = selectedBase.ingredients.map((ing) => ({
          ...ing,
          ingredientId: ing.ingredientId,
          ingredientName: ing.ingredientName,
        }));
        const currentFlavorTopping = recipeIngredients.filter((ri) => {
          const ing = ingredients.find((i) => i.id === ri.ingredientId);
          return (
            ing &&
            (ing.type === IngredientType.FLAVOR ||
              ing.type === IngredientType.TOPPING)
          );
        });
        setRecipeIngredients([...baseIngredients, ...currentFlavorTopping]);
      }
    } else if (recipeType === "base") {
      const onlyBase = recipeIngredients.filter((ri) => {
        const ing = ingredients.find((i) => i.id === ri.ingredientId);
        return ing && ing.type === IngredientType.BASE;
      });
      setRecipeIngredients(onlyBase);
      if (!initialData) {
        setBaseRecipeId("");
      }
    }
  }, [recipeType, baseRecipeId, allBaseRecipes, ingredients]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        ingredientRef.current &&
        !ingredientRef.current.contains(event.target as Node)
      ) {
        setShowIngredientDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const availableIngredients = useMemo(
    () =>
      ingredients
        .filter((ing) => {
          if (!allowedIngredientTypes.includes(ing.type)) return false;
          if (!ingredientSearch.trim()) return true;
          return ing.name
            .toLowerCase()
            .includes(ingredientSearch.toLowerCase());
        })
        .filter((ing) => {
          if (recipeType === "full" && baseRecipeId) {
            const selectedBase = allBaseRecipes.find(
              (r) => r.id === baseRecipeId
            );
            if (selectedBase) {
              const baseIngredientIds = selectedBase.ingredients.map(
                (ri) => ri.ingredientId
              );
              if (baseIngredientIds.includes(ing.id)) return false;
            }
          }
          return !recipeIngredients.find((ri) => ri.ingredientId === ing.id);
        }),
    [
      ingredients,
      ingredientSearch,
      recipeIngredients,
      allowedIngredientTypes,
      recipeType,
      baseRecipeId,
      allBaseRecipes,
    ]
  );

  const groupedAvailableIngredients = useMemo(() => {
    const groups: Record<IngredientType, Ingredient[]> = {
      [IngredientType.BASE]: [],
      [IngredientType.FLAVOR]: [],
      [IngredientType.TOPPING]: [],
      [IngredientType.DECORATION]: [],
      [IngredientType.MATERIAL]: [],
    };

    availableIngredients.forEach((ing) => {
      if (groups[ing.type]) {
        groups[ing.type].push(ing);
      }
    });

    return groups;
  }, [availableIngredients]);

  const availableTypes = useMemo(() => {
    const types = new Set<IngredientType>();
    ingredients.forEach((ing) => {
      if (allowedIngredientTypes.includes(ing.type)) {
        types.add(ing.type);
      }
    });
    return Array.from(types).sort((a, b) => {
      const orderA = typeOrder.indexOf(a);
      const orderB = typeOrder.indexOf(b);
      return orderA - orderB;
    });
  }, [ingredients, allowedIngredientTypes]);

  const handleSelectIngredient = (
    ingredient: Ingredient,
    event: React.MouseEvent
  ) => {
    const sourceElement = event.currentTarget as HTMLElement;
    const sourceRect = sourceElement.getBoundingClientRect();

    setTimeout(() => {
      const typeIndex = availableTypes.indexOf(ingredient.type);
      const kanbanContainer = document.querySelector(
        "[data-kanban-container]"
      ) as HTMLElement;
      if (kanbanContainer) {
        const containerRect = kanbanContainer.getBoundingClientRect();
        const columnWidth = containerRect.width / availableTypes.length;
        const targetX =
          containerRect.left + typeIndex * columnWidth + columnWidth / 2;
        const selectedSection = document.querySelector(
          `[data-type="${ingredient.type}"][data-selected-section]`
        ) as HTMLElement;
        const targetY = selectedSection
          ? selectedSection.getBoundingClientRect().top + 50
          : containerRect.top + containerRect.height / 2;

        setFlyingIngredient({
          id: ingredient.id,
          name: ingredient.name,
          from: {
            x: sourceRect.left + sourceRect.width / 2,
            y: sourceRect.top + sourceRect.height / 2,
          },
          to: {
            x: targetX,
            y: targetY,
          },
        });

        setTimeout(() => {
          const newIngredient: RecipeIngredient = {
            ingredientId: ingredient.id,
            ingredientName: ingredient.name,
            quantity: 0,
            unit: ingredient.unit,
          };
          setRecipeIngredients([...recipeIngredients, newIngredient]);
          setIngredientSearch("");
          setShowIngredientDropdown(false);
          setFlyingIngredient(null);
        }, 600);
      } else {
        const newIngredient: RecipeIngredient = {
          ingredientId: ingredient.id,
          ingredientName: ingredient.name,
          quantity: 0,
          unit: ingredient.unit,
        };
        setRecipeIngredients([...recipeIngredients, newIngredient]);
        setIngredientSearch("");
        setShowIngredientDropdown(false);
      }
    }, 10);
  };

  const handleRemoveIngredient = (ingredientId: string) => {
    if (recipeType === "full" && baseRecipeId) {
      const selectedBase = allBaseRecipes.find((r) => r.id === baseRecipeId);
      if (selectedBase) {
        const baseIngredientIds = selectedBase.ingredients.map(
          (ri) => ri.ingredientId
        );
        if (baseIngredientIds.includes(ingredientId)) {
          return;
        }
      }
    }
    setRecipeIngredients(
      recipeIngredients.filter((ri) => ri.ingredientId !== ingredientId)
    );
  };

  const handleUpdateIngredientQuantity = (
    ingredientId: string,
    quantity: number
  ) => {
    setRecipeIngredients(
      recipeIngredients.map((ri) =>
        ri.ingredientId === ingredientId ? { ...ri, quantity } : ri
      )
    );
  };

  const handleStartEditQuantity = (ri: RecipeIngredient) => {
    setEditingQuantity(ri.ingredientId);
    setTempQuantity(ri.quantity.toString());
    setTimeout(() => {
      quantityInputRef.current?.focus();
      quantityInputRef.current?.select();
    }, 10);
  };

  const handleSaveQuantity = (ingredientId: string) => {
    const numValue = tempQuantity === "" ? 0 : Number(tempQuantity);
    if (!isNaN(numValue) && numValue >= 0) {
      handleUpdateIngredientQuantity(ingredientId, numValue);
    }
    setEditingQuantity(null);
    setTempQuantity("");
  };

  const handleCancelEditQuantity = () => {
    setEditingQuantity(null);
    setTempQuantity("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (!name.trim()) throw new Error(t("recipes.form.errors.nameRequired"));
      if (recipeType === "full" && !baseRecipeId) {
        throw new Error(t("recipes.form.errors.baseRecipeRequired"));
      }
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
        outputQuantity: outputQuantity || 0,
        wasteRate: wasteRate || 0,
        recipeType,
      };

      if (recipeType === "full" && baseRecipeId) {
        payload.baseRecipeId = baseRecipeId;
      }

      await onSave(payload);
      handleClose();
    } catch (err: any) {
      setError(err.message || t("recipes.form.errors.saveFailed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  const headerContent = (
    <div className="flex-1 min-w-0 pr-2">
      <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
        {initialData ? t("recipes.form.editTitle") : t("recipes.form.addTitle")}
      </h2>
      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
        {t("recipes.form.subtitle")}
      </p>
    </div>
  );

  const footerContent = (
    <div className="flex justify-end gap-3">
      <button
        type="button"
        onClick={handleClose}
        disabled={isSubmitting}
        className="px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
      >
        {t("form.cancel")}
      </button>
      <button
        type="submit"
        form="recipe-form"
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
    <>
      {flyingIngredient && (
        <>
          <div
            className="fixed z-50 pointer-events-none"
            style={{
              left: `${flyingIngredient.from.x}px`,
              top: `${flyingIngredient.from.y}px`,
              transform: "translate(-50%, -50%)",
              animation: `flyToTarget-${flyingIngredient.id.replace(
                /[^a-zA-Z0-9]/g,
                ""
              )} 0.6s ease-out forwards`,
            }}
          >
            <div className="px-3 py-1.5 bg-orange-500 text-white text-xs font-medium rounded-lg shadow-lg whitespace-nowrap">
              {flyingIngredient.name}
            </div>
          </div>
          <style>{`
            @keyframes flyToTarget-${flyingIngredient.id.replace(
              /[^a-zA-Z0-9]/g,
              ""
            )} {
              0% {
                transform: translate(-50%, -50%) scale(1);
                opacity: 1;
              }
              50% {
                transform: translate(calc(-50% + ${
                  (flyingIngredient.to.x - flyingIngredient.from.x) * 0.5
                }px), calc(-50% + ${
            (flyingIngredient.to.y - flyingIngredient.from.y) * 0.5
          }px)) scale(1.2);
                opacity: 0.9;
              }
              100% {
                left: ${flyingIngredient.to.x}px;
                top: ${flyingIngredient.to.y}px;
                transform: translate(-50%, -50%) scale(0.8);
                opacity: 0;
              }
            }
          `}</style>
        </>
      )}
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
            id="recipe-form"
            onSubmit={handleSubmit}
            className="space-y-4 sm:space-y-5"
          >
            <div className="bg-white dark:bg-slate-800 p-3 sm:p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-3">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1 uppercase tracking-wide">
                  {t("recipes.form.recipeType")} *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRecipeType("base");
                      setBaseRecipeId("");
                    }}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      recipeType === "base"
                        ? "bg-orange-600 text-white"
                        : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                    }`}
                  >
                    {t("recipes.form.baseRecipe")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecipeType("full")}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      recipeType === "full"
                        ? "bg-orange-600 text-white"
                        : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                    }`}
                  >
                    {t("recipes.form.fullRecipe")}
                  </button>
                </div>
              </div>

              {recipeType === "full" && (
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1 uppercase tracking-wide">
                    {t("recipes.form.baseRecipeSelect")} *
                  </label>
                  <div className="relative">
                    <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10 pointer-events-none" />
                    <select
                      value={baseRecipeId}
                      onChange={(e) => setBaseRecipeId(e.target.value)}
                      required={recipeType === "full"}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                    >
                      <option value="">
                        {t("recipes.form.selectBaseRecipe")}
                      </option>
                      {allBaseRecipes.map((recipe) => (
                        <option key={recipe.id} value={recipe.id}>
                          {recipe.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

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

              {recipeType === "full" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1 uppercase tracking-wide">
                      {t("recipes.form.outputQuantity")}
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={outputQuantity === 0 ? "" : outputQuantity}
                      onChange={(e) => {
                        const value = e.target.value;
                        setOutputQuantity(value === "" ? 0 : Number(value));
                      }}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1 uppercase tracking-wide">
                      {t("recipes.form.wasteRate")}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={wasteRate === 0 ? "" : wasteRate}
                        onChange={(e) => {
                          const value = e.target.value;
                          const numValue = value === "" ? 0 : Number(value);
                          setWasteRate(Math.min(100, Math.max(0, numValue)));
                        }}
                        className="w-full px-3 py-2 pr-8 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                        placeholder="0"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                        %
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-slate-800 p-3 sm:p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wide">
                  {t("recipes.form.ingredients")} *
                </h3>
              </div>

              <div ref={ingredientRef} className="relative mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10 pointer-events-none" />
                  <input
                    type="text"
                    value={ingredientSearch}
                    onChange={(e) => {
                      setIngredientSearch(e.target.value);
                      setShowIngredientDropdown(true);
                    }}
                    onFocus={() => setShowIngredientDropdown(true)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                    placeholder={t("recipes.form.addIngredientPlaceholder")}
                  />
                </div>
                {showIngredientDropdown && availableIngredients.length > 0 && (
                  <div className="absolute z-30 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg shadow-xl max-h-64 overflow-y-auto">
                    <ul className="py-1">
                      {availableIngredients.slice(0, 10).map((ing) => {
                        const currentQuantity = calculateCurrentQuantity(ing);
                        const outOfStock = isOutOfStock(ing);
                        const TypeIcon = getTypeIcon(ing.type);
                        const typeColors = getTypeColors(ing.type);
                        return (
                          <li
                            key={ing.id}
                            onClick={(e) => {
                              const fakeEvent = {
                                currentTarget: e.currentTarget,
                              } as React.MouseEvent;
                              handleSelectIngredient(ing, fakeEvent);
                            }}
                            className="px-3 py-2.5 hover:bg-orange-50 dark:hover:bg-slate-700 cursor-pointer transition-colors border-b border-slate-100 dark:border-slate-700 last:border-b-0"
                          >
                            <div className="flex items-start gap-2">
                              <div
                                className={`p-1.5 rounded-lg ${typeColors.bg} ${typeColors.border} border flex-shrink-0 mt-0.5`}
                              >
                                <TypeIcon
                                  className={`w-3.5 h-3.5 ${typeColors.icon}`}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                                  {ing.name}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {t(
                                      `ingredients.form.types.${ing.type
                                        .toString()
                                        .toLowerCase()}`
                                    )}{" "}
                                    •{" "}
                                    {ing.unit === "piece"
                                      ? t("ingredients.form.unitPiece")
                                      : "g"}
                                  </p>
                                </div>
                                <div className="mt-1">
                                  <span
                                    className={`text-xs font-semibold ${
                                      outOfStock
                                        ? "text-red-500 dark:text-red-400"
                                        : "text-slate-600 dark:text-slate-400"
                                    }`}
                                  >
                                    {outOfStock
                                      ? t("recipes.form.outOfStock")
                                      : `${t(
                                          "recipes.form.available"
                                        )}: ${currentQuantity.toLocaleString()} ${
                                          ing.unit === "piece"
                                            ? t("ingredients.form.unitPiece")
                                            : "g"
                                        }`}
                                  </span>
                                </div>
                              </div>
                              <Plus className="w-4 h-4 text-orange-500 dark:text-orange-400 flex-shrink-0 mt-1" />
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[500px] sm:h-[600px]">
                <div className="flex flex-col border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                      {t("recipes.form.availableIngredients")}
                    </h3>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {availableTypes.map((type) => {
                      const TypeIcon = getTypeIcon(type);
                      const colors = getTypeColors(type);
                      const available = groupedAvailableIngredients[type] || [];
                      const typeKey = type.toString().toLowerCase();

                      if (available.length === 0) return null;

                      return (
                        <div key={type} className="space-y-2">
                          <div
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg ${colors.bg} ${colors.border} border`}
                          >
                            <TypeIcon className={`w-4 h-4 ${colors.icon}`} />
                            <h4
                              className={`text-xs font-bold ${colors.text} uppercase tracking-wide`}
                            >
                              {t(`ingredients.form.types.${typeKey}`)}
                            </h4>
                            <span
                              className={`ml-auto text-xs ${colors.text} opacity-70`}
                            >
                              {available.length}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {available.map((ing) => {
                              const currentQuantity =
                                calculateCurrentQuantity(ing);
                              const outOfStock = isOutOfStock(ing);
                              const IngTypeIcon = getTypeIcon(ing.type);
                              const ingColors = getTypeColors(ing.type);
                              return (
                                <div
                                  key={ing.id}
                                  ref={(el) => {
                                    if (el)
                                      ingredientRefs.current.set(ing.id, el);
                                  }}
                                  onClick={(e) =>
                                    !outOfStock &&
                                    handleSelectIngredient(ing, e)
                                  }
                                  className={`p-3 bg-white dark:bg-slate-800 rounded-lg border-2 ${
                                    ingColors.border
                                  } hover:border-orange-400 dark:hover:border-orange-500 hover:shadow-md cursor-pointer transition-all group ${
                                    flyingIngredient?.id === ing.id
                                      ? "opacity-0 scale-0"
                                      : "opacity-100 scale-100"
                                  } ${
                                    outOfStock
                                      ? "opacity-50 cursor-not-allowed"
                                      : ""
                                  }`}
                                >
                                  <div className="flex items-start gap-2 mb-2">
                                    <div
                                      className={`p-1.5 rounded-lg ${ingColors.bg} ${ingColors.border} border flex-shrink-0`}
                                    >
                                      <IngTypeIcon
                                        className={`w-3.5 h-3.5 ${ingColors.icon}`}
                                      />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-semibold text-slate-900 dark:text-white truncate group-hover:text-orange-600 dark:group-hover:text-orange-400">
                                        {ing.name}
                                      </p>
                                      <span
                                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded mt-1 inline-block ${
                                          outOfStock
                                            ? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20"
                                            : "text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-700"
                                        }`}
                                      >
                                        {outOfStock
                                          ? t("recipes.form.outOfStock")
                                          : `${currentQuantity.toLocaleString()} ${
                                              ing.unit === "piece"
                                                ? t(
                                                    "ingredients.form.unitPiece"
                                                  )
                                                : "g"
                                            }`}
                                      </span>
                                    </div>
                                    {!outOfStock && (
                                      <Plus className="w-4 h-4 text-orange-500 dark:text-orange-400 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                    {availableTypes.every(
                      (type) =>
                        (groupedAvailableIngredients[type] || []).length === 0
                    ) && (
                      <div className="text-center py-8 text-slate-400 dark:text-slate-500">
                        <p className="text-sm">{t("recipes.form.allAdded")}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                      {t("recipes.form.selectedIngredients")} (
                      {recipeIngredients.length})
                    </h3>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {recipeIngredients.length === 0 ? (
                      <div className="text-center py-12 text-slate-400 dark:text-slate-500">
                        <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">
                          {t("recipes.form.noIngredientsSelected")}
                        </p>
                      </div>
                    ) : (
                      recipeIngredients.map((ri) => {
                        const ingredient = ingredients.find(
                          (ing) => ing.id === ri.ingredientId
                        );
                        const isNew = flyingIngredient?.id === ri.ingredientId;
                        const isFromBaseRecipe =
                          recipeType === "full" &&
                          baseRecipeId &&
                          (() => {
                            const selectedBase = allBaseRecipes.find(
                              (r) => r.id === baseRecipeId
                            );
                            return selectedBase?.ingredients.some(
                              (bri) => bri.ingredientId === ri.ingredientId
                            );
                          })();
                        const ingType = ingredient?.type || IngredientType.BASE;
                        const colors = getTypeColors(ingType);
                        const TypeIcon = getTypeIcon(ingType);
                        const isEditing = editingQuantity === ri.ingredientId;

                        return (
                          <div
                            key={ri.ingredientId}
                            ref={(el) => {
                              if (el)
                                selectedRefs.current.set(ri.ingredientId, el);
                            }}
                            className={`p-3 bg-white dark:bg-slate-800 rounded-lg border-2 ${
                              colors.border
                            } shadow-sm ${
                              isNew
                                ? "animate-in zoom-in-50 slide-in-from-left-4 duration-500"
                                : ""
                            } ${isFromBaseRecipe ? "opacity-75" : ""}`}
                          >
                            <div className="flex items-start justify-between gap-2 mb-3">
                              <div className="flex items-start gap-2 flex-1 min-w-0">
                                <div
                                  className={`p-1.5 rounded-lg ${colors.bg} ${colors.border} border flex-shrink-0`}
                                >
                                  <TypeIcon
                                    className={`w-3.5 h-3.5 ${colors.icon}`}
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                    {ri.ingredientName}
                                  </p>
                                  {isFromBaseRecipe && (
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                                      {t("recipes.form.fromBaseRecipe")}
                                    </p>
                                  )}
                                </div>
                              </div>
                              {!isFromBaseRecipe && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveIngredient(ri.ingredientId);
                                  }}
                                  className="p-1 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 active:bg-red-100 dark:active:bg-red-900/30 rounded transition-colors flex-shrink-0"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                            {isEditing ? (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <input
                                    ref={quantityInputRef}
                                    type="number"
                                    min="0"
                                    step={ri.unit === "piece" ? 1 : 0.01}
                                    value={tempQuantity}
                                    onChange={(e) =>
                                      setTempQuantity(e.target.value)
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        handleSaveQuantity(ri.ingredientId);
                                      } else if (e.key === "Escape") {
                                        handleCancelEditQuantity();
                                      }
                                    }}
                                    className="flex-1 px-3 py-2 text-sm font-medium bg-slate-50 dark:bg-slate-700 border-2 border-orange-500 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                                    placeholder="0"
                                  />
                                  <span className="text-sm text-slate-500 dark:text-slate-400">
                                    {ri.unit === "piece"
                                      ? t("ingredients.form.unitPiece")
                                      : "g"}
                                  </span>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleSaveQuantity(ri.ingredientId)
                                    }
                                    className="flex-1 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-medium rounded-lg transition-colors"
                                  >
                                    {t("common.apply")}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={handleCancelEditQuantity}
                                    className="flex-1 px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-lg transition-colors"
                                  >
                                    {t("form.cancel")}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-700 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <span className="text-lg font-bold text-slate-900 dark:text-white">
                                    {ri.quantity.toLocaleString()}
                                  </span>
                                  <span className="text-xs text-slate-500 dark:text-slate-400">
                                    {ri.unit === "piece"
                                      ? t("ingredients.form.unitPiece")
                                      : "g"}
                                  </span>
                                </div>
                                {!isFromBaseRecipe && (
                                  <button
                                    type="button"
                                    onClick={() => handleStartEditQuantity(ri)}
                                    className="p-1.5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 rounded transition-colors"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
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
      </BaseSlidePanel>
    </>
  );
};

export default RecipeForm;
