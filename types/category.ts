/**
 * Danh mục sản phẩm — hỗ trợ cấu trúc cây (parent/child) qua `parentId`.
 * Lưu trong configurations/categories document.
 */
export interface ProductCategory {
  id: string;
  name: string;
  /** Parent category id — null/undefined = root */
  parentId?: string | null;
  /** Icon emoji (vd: '🍞', '🧁') */
  icon?: string;
  /** Hex color cho chip hiển thị */
  color?: string;
  /** Vị trí sort trong cùng level (số nhỏ hiện trước) */
  sortOrder?: number;
  /** Mô tả tùy chọn */
  description?: string;
}

export interface CategoryNode extends ProductCategory {
  children: CategoryNode[];
  depth: number;
}

export const DEFAULT_CATEGORY_COLORS = [
  '#ea580c', '#f59e0b', '#eab308', '#84cc16',
  '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6',
  '#d946ef', '#ec4899', '#f43f5e',
];

/** Build cây từ flat list. Bảo toàn sortOrder. */
export const buildCategoryTree = (flat: ProductCategory[]): CategoryNode[] => {
  const byId = new Map<string, CategoryNode>();
  flat.forEach((c) => byId.set(c.id, { ...c, children: [], depth: 0 }));

  const roots: CategoryNode[] = [];
  flat.forEach((c) => {
    const node = byId.get(c.id)!;
    if (c.parentId && byId.has(c.parentId)) {
      const parent = byId.get(c.parentId)!;
      node.depth = parent.depth + 1;
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  });

  const sortBy = (a: CategoryNode, b: CategoryNode) =>
    (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name);

  const sortRecursive = (nodes: CategoryNode[]) => {
    nodes.sort(sortBy);
    nodes.forEach((n) => {
      // recompute depth in case it shifted
      n.children.forEach((c) => { c.depth = n.depth + 1; });
      sortRecursive(n.children);
    });
  };
  sortRecursive(roots);
  return roots;
};

/** Trả tất cả descendant ids (bao gồm chính nó) */
export const getDescendantIds = (id: string, flat: ProductCategory[]): string[] => {
  const ids: string[] = [id];
  const queue = [id];
  while (queue.length > 0) {
    const cur = queue.shift()!;
    flat.forEach((c) => {
      if (c.parentId === cur) {
        ids.push(c.id);
        queue.push(c.id);
      }
    });
  }
  return ids;
};
