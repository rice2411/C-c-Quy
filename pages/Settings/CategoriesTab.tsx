/**
 * CategoriesTab — quản lý cây danh mục sản phẩm trong Settings.
 * Tree view với expand/collapse, drag handle (move up/down trong cùng level),
 * thêm child, edit inline, xoá (cảnh báo nếu có descendant).
 */
import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Edit2, Folder, FolderPlus, Loader2, Plus, Save, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  buildCategoryTree,
  DEFAULT_CATEGORY_COLORS,
  getDescendantIds,
  type CategoryNode,
  type ProductCategory,
} from '@/types/category';
import { generateCategoryId } from '@/services/categoryService';
import { useCategories, useSaveCategories } from '@/hooks/queries/useCategoriesQuery';

import Heading from '@/components/ui/Heading';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
const CategoriesTab: React.FC = () => {
  const { categories, loading, error } = useCategories();
  const { saveCategories } = useSaveCategories();
  const [items, setItems] = useState<ProductCategory[]>([]);
  const [seeded, setSeeded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addingParentId, setAddingParentId] = useState<string | null>(null); // null = add root
  const [draftName, setDraftName] = useState('');
  const [draftIcon, setDraftIcon] = useState('');
  const [draftColor, setDraftColor] = useState(DEFAULT_CATEGORY_COLORS[0]);
  const [showAddRoot, setShowAddRoot] = useState(false);

  // Seed local editable state từ query lần đầu có data (giữ items như draft để CRUD inline).
  useEffect(() => {
    if (seeded || loading) return;
    setItems(categories);
    const rootIds = categories.filter((c) => !c.parentId).map((c) => c.id);
    setExpandedIds(new Set(rootIds));
    setSeeded(true);
  }, [categories, loading, seeded]);

  useEffect(() => {
    if (error) toast.error('Không tải được danh mục');
  }, [error]);

  const tree = useMemo(() => buildCategoryTree(items), [items]);

  const persist = async (next: ProductCategory[]) => {
    setSaving(true);
    try {
      await saveCategories(next);
      setItems(next);
      toast.success('Đã lưu danh mục');
    } catch (e: any) {
      toast.error(e?.message || 'Lỗi lưu');
    } finally {
      setSaving(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const startEdit = (cat: ProductCategory) => {
    setEditingId(cat.id);
    setDraftName(cat.name);
    setDraftIcon(cat.icon || '');
    setDraftColor(cat.color || DEFAULT_CATEGORY_COLORS[0]);
    setAddingParentId(null);
    setShowAddRoot(false);
  };

  const startAddChild = (parentId: string | null) => {
    setAddingParentId(parentId);
    setEditingId(null);
    setDraftName('');
    setDraftIcon('');
    setDraftColor(DEFAULT_CATEGORY_COLORS[items.length % DEFAULT_CATEGORY_COLORS.length]);
    if (parentId) {
      setExpandedIds((prev) => new Set([...prev, parentId]));
    } else {
      setShowAddRoot(true);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setAddingParentId(null);
    setShowAddRoot(false);
    setDraftName('');
    setDraftIcon('');
  };

  const saveEdit = async () => {
    const name = draftName.trim();
    if (!name) {
      toast.error('Tên danh mục không được trống');
      return;
    }

    let next: ProductCategory[];
    if (editingId) {
      next = items.map((c) =>
        c.id === editingId ? { ...c, name, icon: draftIcon || undefined, color: draftColor } : c
      );
    } else {
      const siblings = items.filter((c) => (c.parentId || null) === (addingParentId || null));
      const newCat: ProductCategory = {
        id: generateCategoryId(name),
        name,
        parentId: addingParentId || null,
        icon: draftIcon || undefined,
        color: draftColor,
        sortOrder: siblings.length,
      };
      next = [...items, newCat];
    }
    await persist(next);
    cancelEdit();
  };

  const handleDelete = async (id: string) => {
    const descendants = getDescendantIds(id, items);
    const count = descendants.length;
    const msg = count > 1
      ? `Xoá danh mục này sẽ xoá ${count - 1} danh mục con. Tiếp tục?`
      : 'Xoá danh mục này?';
    if (!window.confirm(msg)) return;
    const next = items.filter((c) => !descendants.includes(c.id));
    await persist(next);
  };

  const moveItem = async (id: string, dir: -1 | 1) => {
    const target = items.find((c) => c.id === id);
    if (!target) return;
    const siblings = items
      .filter((c) => (c.parentId || null) === (target.parentId || null))
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    const idx = siblings.findIndex((c) => c.id === id);
    const swap = idx + dir;
    if (swap < 0 || swap >= siblings.length) return;

    const a = siblings[idx];
    const b = siblings[swap];
    const aOrder = a.sortOrder ?? idx;
    const bOrder = b.sortOrder ?? swap;
    const next = items.map((c) => {
      if (c.id === a.id) return { ...c, sortOrder: bOrder };
      if (c.id === b.id) return { ...c, sortOrder: aOrder };
      return c;
    });
    await persist(next);
  };

  const renderEditor = () => (
    <div className="rounded-lg border-2 border-primary-300 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-700 p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Input
          value={draftIcon}
          onChange={(e) => setDraftIcon(e.target.value.slice(0, 2))}
          placeholder="🍞"
          className="w-12 px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-center text-lg"
         />
        <Input
          value={draftName}
          onChange={(e) => setDraftName(e.target.value)}
          placeholder="Tên danh mục"
          autoFocus
          className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-sm focus:ring-2 focus:ring-primary-500 outline-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter') void saveEdit();
            if (e.key === 'Escape') cancelEdit();
          }}
         />
      </div>
      <div className="flex items-center gap-1 flex-wrap">
        <span className="text-xs text-slate-500 dark:text-slate-400 mr-1">Màu:</span>
        {DEFAULT_CATEGORY_COLORS.map((c) => (
          <Button
            key={c}
            type="button"
            onClick={() => setDraftColor(c)}
            className={`h-5 w-5 rounded-full border-2 transition-all ${
              draftColor === c ? 'border-slate-700 dark:border-white scale-110' : 'border-transparent'
            }`}
            style={{ backgroundColor: c }}
           variant="ghost" disableVariantHover disableVariantTextColor borderClassName="border-transparent" />
        ))}
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          onClick={() => void saveEdit()}
          disabled={saving}
          className="inline-flex items-center gap-1 rounded bg-primary-600 hover:bg-primary-700 text-white px-3 py-1 text-xs font-medium disabled:opacity-50"
         variant="ghost" disableVariantHover disableVariantTextColor borderClassName="border-transparent">
          <Save className="h-3 w-3" /> Lưu
        </Button>
        <Button
          type="button"
          onClick={cancelEdit}
          className="inline-flex items-center gap-1 rounded border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 px-3 py-1 text-xs font-medium"
         variant="ghost" disableVariantHover disableVariantTextColor borderClassName="border-transparent">
          <X className="h-3 w-3" /> Huỷ
        </Button>
      </div>
    </div>
  );

  const renderNode = (node: CategoryNode) => {
    const isExpanded = expandedIds.has(node.id);
    const isEditing = editingId === node.id;
    const isAddingHere = addingParentId === node.id;
    const hasChildren = node.children.length > 0;

    return (
      <li key={node.id} className="space-y-1">
        {isEditing ? (
          renderEditor()
        ) : (
          <div
            className="group flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1.5 hover:border-primary-300 dark:hover:border-primary-600 transition-colors"
            style={{ marginLeft: node.depth * 16 }}
          >
            {hasChildren ? (
              <Button
                type="button"
                onClick={() => toggleExpand(node.id)}
                className="rounded p-0.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
               variant="ghost" disableVariantHover disableVariantTextColor borderClassName="border-transparent">
                {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              </Button>
            ) : (
              <span className="w-4" />
            )}
            <span className="text-lg leading-none">{node.icon || '📁'}</span>
            <span
              className="flex-1 text-sm font-medium truncate"
              style={{ color: node.color || undefined }}
            >
              {node.name}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
              {hasChildren ? `${node.children.length} sub` : ''}
            </span>
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                type="button"
                onClick={() => void moveItem(node.id, -1)}
                title="Lên"
                className="rounded p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
               variant="ghost" disableVariantHover disableVariantTextColor borderClassName="border-transparent">
                <span className="block leading-none">↑</span>
              </Button>
              <Button
                type="button"
                onClick={() => void moveItem(node.id, 1)}
                title="Xuống"
                className="rounded p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
               variant="ghost" disableVariantHover disableVariantTextColor borderClassName="border-transparent">
                <span className="block leading-none">↓</span>
              </Button>
              <Button
                type="button"
                onClick={() => startAddChild(node.id)}
                title="Thêm danh mục con"
                className="rounded p-1 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30"
               variant="ghost" disableVariantHover disableVariantTextColor borderClassName="border-transparent">
                <FolderPlus className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                onClick={() => startEdit(node)}
                title="Sửa"
                className="rounded p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30"
               variant="ghost" disableVariantHover disableVariantTextColor borderClassName="border-transparent">
                <Edit2 className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                onClick={() => void handleDelete(node.id)}
                title="Xoá"
                className="rounded p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
               variant="ghost" disableVariantHover disableVariantTextColor borderClassName="border-transparent">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}

        {isAddingHere && (
          <div style={{ marginLeft: (node.depth + 1) * 16 }}>{renderEditor()}</div>
        )}

        {isExpanded && hasChildren && (
          <ul className="space-y-1">{node.children.map(renderNode)}</ul>
        )}
      </li>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <Heading level={3} textClassName="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Folder className="h-4 w-4 text-primary-500" />
              Cây danh mục sản phẩm
            </Heading>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Tổ chức danh mục thành cấu trúc cây (parent → sub-category). Dùng để lọc, group sản phẩm.
            </p>
          </div>
          <Button
            type="button"
            onClick={() => startAddChild(null)}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white px-3 py-1.5 text-xs font-medium disabled:opacity-50 shadow-sm"
           variant="ghost" disableVariantHover disableVariantTextColor borderClassName="border-transparent">
            <Plus className="h-3.5 w-3.5" /> Danh mục gốc
          </Button>
        </div>

        {showAddRoot && <div className="mb-3">{renderEditor()}</div>}

        {tree.length === 0 && !showAddRoot ? (
          <div className="rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 p-8 text-center">
            <Folder className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Chưa có danh mục nào</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Bấm "Danh mục gốc" để tạo danh mục đầu tiên.
            </p>
          </div>
        ) : (
          <ul className="space-y-1">{tree.map(renderNode)}</ul>
        )}
      </div>

      <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3">
        <p className="text-xs text-blue-700 dark:text-blue-300">
          💡 <strong>Mẹo:</strong> Trong form sản phẩm, danh mục là free text — nhưng nếu khớp với tên danh mục ở đây, sản phẩm sẽ kế thừa màu/icon và có thể lọc theo nhánh.
        </p>
      </div>
    </div>
  );
};

export default CategoriesTab;
