/**
 * Nhập bill → ghi `stock_receipts`, upsert `suppliers` + `materials`.
 */

import {
  Timestamp,
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import type {
  BillLineItem,
  ImportedMaterialSummary,
  ImportedSupplierSummary,
  SavedStockReceiptDetail,
  SavedStockReceiptSummary,
  StockReceiptStructured,
  StockReceiptValidationSnapshot,
  SupplierContactInfo,
} from '@/types/billReceipt';
import { canonicalUnit, normalizeItem, normalizeSupplierKey, sha256Hex } from '@/utils/data/normalize';

const RECEIPTS_COLLECTION = 'stock_receipts';
const LINES_SUBCOLLECTION = 'lines';
const SUPPLIERS_COLLECTION = 'suppliers';
const MATERIALS_COLLECTION = 'materials';
const BATCH_LIMIT_SAFE = 480;

const toNumberOrNull = (v: unknown): number | null => {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  return null;
};

const toStringOrNull = (v: unknown): string | null => {
  if (typeof v === 'string') {
    const s = v.trim();
    return s || null;
  }
  return null;
};

const normalizeLine = (raw: unknown): BillLineItem | null => {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const name = typeof r.name === 'string' ? r.name.trim() : '';
  if (!name) return null;
  return {
    name,
    quantity: toNumberOrNull(r.quantity),
    unit: toStringOrNull(r.unit),
    unitPrice: toNumberOrNull(r.unitPrice),
    lineTotal: toNumberOrNull(r.lineTotal),
  };
};

const nowIso = () => new Date().toISOString();

function cleanContact(input?: SupplierContactInfo | null): SupplierContactInfo {
  if (!input) return {};
  const out: SupplierContactInfo = {};
  (Object.keys(input) as Array<keyof SupplierContactInfo>).forEach((k) => {
    const v = input[k];
    if (typeof v === 'string') {
      const s = v.trim();
      if (s) (out as Record<string, string>)[k] = s;
    }
  });
  return out;
}

export function computeAmountCheck(structured: StockReceiptStructured): {
  sumLines: number;
  totalAmount: number | null;
  deltaPct: number;
  warn: boolean;
} {
  const sumLines = (structured.lineItems || []).reduce((s, l) => {
    const lt = typeof l.lineTotal === 'number' ? l.lineTotal : 0;
    return s + lt;
  }, 0);
  const totalAmount = typeof structured.totalAmount === 'number' ? structured.totalAmount : null;
  const deltaPct =
    totalAmount && totalAmount > 0 ? Math.abs(sumLines - totalAmount) / totalAmount : 0;
  return { sumLines, totalAmount, deltaPct, warn: deltaPct > 0.02 };
}

async function computeBillHash(input: {
  ocrText: string;
  totalAmount: number | null;
  receiptDate: string | null;
  supplierKey: string;
}): Promise<string> {
  const payload = [
    input.supplierKey,
    input.receiptDate ?? '',
    String(input.totalAmount ?? ''),
    (input.ocrText || '').trim().slice(0, 4000),
  ].join('||');
  return sha256Hex(payload);
}

async function findReceiptByHash(billHash: string): Promise<string | null> {
  const q = query(collection(db, RECEIPTS_COLLECTION), where('billHash', '==', billHash), limit(1));
  const snap = await getDocs(q);
  return snap.empty ? null : snap.docs[0].id;
}

interface SupplierResolution {
  ref: ReturnType<typeof doc>;
  isNew: boolean;
  name: string;
  normalizedKey: string;
}

async function resolveSupplier(
  rawName: string | null,
  targetSupplierId: string | null,
): Promise<SupplierResolution | null> {
  if (targetSupplierId) {
    const ref = doc(db, SUPPLIERS_COLLECTION, targetSupplierId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data() as Record<string, unknown>;
      const existingName = typeof data.name === 'string' ? data.name : (rawName || '').trim();
      const normalizedKey =
        typeof data.normalizedName === 'string'
          ? data.normalizedName
          : normalizeSupplierKey(existingName);
      return { ref, isNew: false, name: existingName, normalizedKey };
    }
  }

  const name = (rawName || '').trim();
  if (!name) return null;
  const normalizedKey = normalizeSupplierKey(name);
  if (!normalizedKey) return null;

  const q = query(
    collection(db, SUPPLIERS_COLLECTION),
    where('normalizedName', '==', normalizedKey),
    limit(1),
  );
  const snap = await getDocs(q);
  if (!snap.empty) {
    return {
      ref: doc(db, SUPPLIERS_COLLECTION, snap.docs[0].id),
      isNew: false,
      name,
      normalizedKey,
    };
  }
  return {
    ref: doc(collection(db, SUPPLIERS_COLLECTION)),
    isNew: true,
    name,
    normalizedKey,
  };
}

interface MaterialResolution {
  ref: ReturnType<typeof doc>;
  isNew: boolean;
  canonicalName: string;
  canonicalUnit: string | null;
  normalizedKey: string;
}

async function resolveMaterial(line: BillLineItem): Promise<MaterialResolution | null> {
  const name = (line.name || '').trim();
  if (!name) return null;
  const { fullKey } = normalizeItem(name);
  if (!fullKey) return null;
  const unitCanon = canonicalUnit(line.unit);

  const q = query(
    collection(db, MATERIALS_COLLECTION),
    where('normalizedName', '==', fullKey),
    limit(1),
  );
  const snap = await getDocs(q);
  if (!snap.empty) {
    return {
      ref: doc(db, MATERIALS_COLLECTION, snap.docs[0].id),
      isNew: false,
      canonicalName: name,
      canonicalUnit: unitCanon,
      normalizedKey: fullKey,
    };
  }
  return {
    ref: doc(collection(db, MATERIALS_COLLECTION)),
    isNew: true,
    canonicalName: name,
    canonicalUnit: unitCanon,
    normalizedKey: fullKey,
  };
}

export async function saveStockReceiptDraft(input: {
  structured: StockReceiptStructured;
  validation: StockReceiptValidationSnapshot;
  ocrText: string;
  receiptImageBase64?: string | null;
  receiptImageMimeType?: string | null;
  createdByUid?: string | null;
  targetSupplierId?: string | null;
  supplierContact?: SupplierContactInfo | null;
}): Promise<string> {
  const {
    structured,
    validation,
    ocrText,
    receiptImageBase64,
    receiptImageMimeType,
    createdByUid,
    targetSupplierId,
    supplierContact,
  } = input;

  const supplier = await resolveSupplier(
    structured.supplierName ?? null,
    targetSupplierId ?? null,
  );
  const supplierKey = supplier?.normalizedKey ?? '';

  const billHash = await computeBillHash({
    ocrText,
    totalAmount: structured.totalAmount ?? null,
    receiptDate: structured.receiptDate ?? null,
    supplierKey,
  });
  const dupId = await findReceiptByHash(billHash);
  if (dupId) {
    throw new Error(`DUPLICATE_BILL:${dupId}`);
  }

  const rawLines = (structured.lineItems || [])
    .map(normalizeLine)
    .filter((x): x is BillLineItem => Boolean(x));

  const materialResolutions = await Promise.all(rawLines.map(resolveMaterial));

  const writesEstimate =
    1 + (supplier ? 1 : 0) + materialResolutions.filter(Boolean).length * 2 + rawLines.length;
  if (writesEstimate > BATCH_LIMIT_SAFE) {
    throw new Error('TOO_MANY_LINES');
  }

  const batch = writeBatch(db);
  const headerRef = doc(collection(db, RECEIPTS_COLLECTION));
  const total = typeof structured.totalAmount === 'number' ? structured.totalAmount : 0;
  const amountCheck = computeAmountCheck(structured);
  const contact = cleanContact(supplierContact);

  if (supplier) {
    if (supplier.isNew) {
      batch.set(supplier.ref, {
        name: supplier.name,
        normalizedName: supplier.normalizedKey,
        receiptCount: 1,
        totalAmount: total,
        lastReceiptDate: nowIso(),
        ...contact,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      batch.update(supplier.ref, {
        receiptCount: increment(1),
        totalAmount: increment(total),
        lastReceiptDate: nowIso(),
        ...contact,
        updatedAt: serverTimestamp(),
      });
    }
  }

  batch.set(headerRef, {
    supplierId: supplier?.ref.id ?? null,
    supplierNameRaw: structured.supplierName ?? null,
    supplierNameCanonical: supplier?.name ?? null,
    storeOrBranch: structured.storeOrBranch ?? null,
    invoiceNumber: structured.invoiceNumber ?? null,
    supplierPhone: structured.supplierPhone ?? null,
    supplierAddress: structured.supplierAddress ?? null,
    receiptDate: structured.receiptDate ?? null,
    receiptTime: structured.receiptTime ?? null,
    subtotal: structured.subtotal ?? null,
    tax: structured.tax ?? null,
    discount: structured.discount ?? null,
    totalAmount: structured.totalAmount ?? null,
    currency: structured.currency || 'VND',
    paymentMethod: structured.paymentMethod ?? null,
    notes: structured.notes ?? null,
    productLineCount: Number.isFinite(structured.productLineCount)
      ? structured.productLineCount
      : rawLines.length,
    ocrText,
    receiptImageBase64: receiptImageBase64 ?? null,
    receiptImageMimeType: receiptImageMimeType ?? null,
    validation,
    amountCheck: {
      sumLines: amountCheck.sumLines,
      deltaPct: amountCheck.deltaPct,
      warn: amountCheck.warn,
    },
    billHash,
    status: 'committed',
    createdByUid: createdByUid ?? null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  materialResolutions.forEach((mres, idx) => {
    const line = rawLines[idx];
    if (!line || !mres) return;
    const qty = typeof line.quantity === 'number' ? line.quantity : 0;
    const amount = typeof line.lineTotal === 'number' ? line.lineTotal : 0;
    const unitPrice =
      typeof line.unitPrice === 'number'
        ? line.unitPrice
        : qty > 0 && amount > 0
          ? amount / qty
          : null;

    if (mres.isNew) {
      batch.set(mres.ref, {
        name: mres.canonicalName,
        normalizedName: mres.normalizedKey,
        canonicalUnit: mres.canonicalUnit,
        importCount: 1,
        totalQty: qty,
        totalAmount: amount,
        lastUnitPrice: unitPrice,
        lastSupplierId: supplier?.ref.id ?? null,
        lastSupplierName: supplier?.name ?? null,
        lastReceiptDate: nowIso(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      batch.update(mres.ref, {
        importCount: increment(1),
        totalQty: increment(qty),
        totalAmount: increment(amount),
        lastUnitPrice: unitPrice,
        lastSupplierId: supplier?.ref.id ?? null,
        lastSupplierName: supplier?.name ?? null,
        lastReceiptDate: nowIso(),
        updatedAt: serverTimestamp(),
      });
    }

    const lineRef = doc(collection(headerRef, LINES_SUBCOLLECTION));
    batch.set(lineRef, {
      ...line,
      unitPrice,
      materialId: mres.ref.id,
      materialNameRaw: mres.canonicalName,
      receiptId: headerRef.id,
      receiptDate: structured.receiptDate ?? null,
      supplierId: supplier?.ref.id ?? null,
      supplierNameRaw: supplier?.name ?? null,
      createdAt: serverTimestamp(),
    });
  });

  await batch.commit();
  return headerRef.id;
}

export async function updateSupplier(
  id: string,
  patch: Partial<SupplierContactInfo> & { name?: string },
): Promise<void> {
  const ref = doc(db, SUPPLIERS_COLLECTION, id);
  const payload: Record<string, unknown> = { updatedAt: serverTimestamp() };

  const setField = (key: keyof SupplierContactInfo, v?: string | null) => {
    if (v === undefined) return;
    if (typeof v === 'string') {
      const s = v.trim();
      payload[key] = s ? s : null;
    } else {
      payload[key] = v;
    }
  };
  setField('phone', patch.phone);
  setField('address', patch.address);
  setField('contactPerson', patch.contactPerson);
  setField('email', patch.email);
  setField('taxCode', patch.taxCode);
  setField('category', patch.category);
  setField('notes', patch.notes);

  if (patch.name !== undefined) {
    const nm = (patch.name || '').trim();
    if (nm) {
      payload.name = nm;
      payload.normalizedName = normalizeSupplierKey(nm);
    }
  }
  await updateDoc(ref, payload);
}

export async function fetchImportedSuppliers(): Promise<ImportedSupplierSummary[]> {
  const q = query(collection(db, SUPPLIERS_COLLECTION), orderBy('updatedAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const raw = d.data() as Record<string, unknown>;
    return {
      id: d.id,
      name: typeof raw.name === 'string' ? raw.name : '(Unknown)',
      normalizedName: typeof raw.normalizedName === 'string' ? raw.normalizedName : '',
      receiptCount: typeof raw.receiptCount === 'number' ? raw.receiptCount : 0,
      totalAmount: typeof raw.totalAmount === 'number' ? raw.totalAmount : 0,
      lastReceiptDate: typeof raw.lastReceiptDate === 'string' ? raw.lastReceiptDate : undefined,
      phone: typeof raw.phone === 'string' ? raw.phone : null,
      address: typeof raw.address === 'string' ? raw.address : null,
      contactPerson: typeof raw.contactPerson === 'string' ? raw.contactPerson : null,
      email: typeof raw.email === 'string' ? raw.email : null,
      taxCode: typeof raw.taxCode === 'string' ? raw.taxCode : null,
      category: typeof raw.category === 'string' ? raw.category : null,
      notes: typeof raw.notes === 'string' ? raw.notes : null,
    };
  });
}

export async function fetchImportedMaterials(): Promise<ImportedMaterialSummary[]> {
  const q = query(collection(db, MATERIALS_COLLECTION), orderBy('updatedAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const raw = d.data() as Record<string, unknown>;
    return {
      id: d.id,
      name: typeof raw.name === 'string' ? raw.name : '(Unknown)',
      normalizedName: typeof raw.normalizedName === 'string' ? raw.normalizedName : '',
      importCount: typeof raw.importCount === 'number' ? raw.importCount : 0,
      totalQty: typeof raw.totalQty === 'number' ? raw.totalQty : 0,
      totalAmount: typeof raw.totalAmount === 'number' ? raw.totalAmount : 0,
      lastSupplierName:
        typeof raw.lastSupplierName === 'string' ? raw.lastSupplierName : undefined,
      lastReceiptDate: typeof raw.lastReceiptDate === 'string' ? raw.lastReceiptDate : undefined,
    };
  });
}

export interface MaterialPriceOption {
  id: string;
  name: string;
  unitPrice: number;
}

/**
 * Trả về danh sách nguyên liệu kèm đơn giá nhập trung bình (totalAmount / totalQty),
 * dùng cho dropdown "Trang trí thêm" khi tạo/sửa đơn. Sort theo name (vi).
 */
export async function fetchMaterialPriceOptions(): Promise<MaterialPriceOption[]> {
  const materials = await fetchImportedMaterials();
  return materials
    .map((m) => ({
      id: m.id,
      name: m.name,
      unitPrice: m.totalQty > 0 ? Math.round(m.totalAmount / m.totalQty) : 0,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'vi'));
}

export async function fetchStockReceiptSummaries(): Promise<SavedStockReceiptSummary[]> {
  const q = query(collection(db, RECEIPTS_COLLECTION), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const raw = d.data();
    const createdTs = raw.createdAt instanceof Timestamp ? raw.createdAt : null;
    const updatedTs = raw.updatedAt instanceof Timestamp ? raw.updatedAt : null;
    const importedAt = createdTs ?? updatedTs;
    return {
      id: d.id,
      supplierNameRaw: toStringOrNull(raw.supplierNameRaw),
      storeOrBranch: toStringOrNull(raw.storeOrBranch),
      receiptDate: toStringOrNull(raw.receiptDate),
      invoiceNumber: toStringOrNull(raw.invoiceNumber),
      totalAmount: toNumberOrNull(raw.totalAmount),
      currency: toStringOrNull(raw.currency) || 'VND',
      productLineCount: typeof raw.productLineCount === 'number' ? raw.productLineCount : 0,
      createdAt: importedAt ? importedAt.toDate().toISOString() : undefined,
    };
  });
}

export async function fetchStockReceiptDetail(receiptId: string): Promise<SavedStockReceiptDetail | null> {
  const headerSnap = await getDoc(doc(db, RECEIPTS_COLLECTION, receiptId));
  if (!headerSnap.exists()) return null;
  const raw = headerSnap.data();

  const linesSnap = await getDocs(
    query(collection(db, RECEIPTS_COLLECTION, receiptId, LINES_SUBCOLLECTION), orderBy('createdAt', 'asc')),
  );
  const lineItems = linesSnap.docs
    .map((d) => normalizeLine(d.data()))
    .filter((x): x is BillLineItem => Boolean(x));

  const v = (raw.validation || {}) as Record<string, unknown>;
  const validation: StockReceiptValidationSnapshot = {
    isLikelyReceipt: Boolean(v.isLikelyReceipt),
    confidence: toNumberOrNull(v.confidence) ?? 0,
    reasonVi: toStringOrNull(v.reasonVi) || '',
    heuristicScore: toNumberOrNull(v.heuristicScore) ?? 0,
    heuristicNoteVi: toStringOrNull(v.heuristicNoteVi) || '',
  };

  return {
    id: headerSnap.id,
    supplierNameRaw: toStringOrNull(raw.supplierNameRaw),
    storeOrBranch: toStringOrNull(raw.storeOrBranch),
    receiptDate: toStringOrNull(raw.receiptDate),
    invoiceNumber: toStringOrNull(raw.invoiceNumber),
    totalAmount: toNumberOrNull(raw.totalAmount),
    currency: toStringOrNull(raw.currency) || 'VND',
    productLineCount:
      typeof raw.productLineCount === 'number' ? raw.productLineCount : lineItems.length,
    createdAt: raw.createdAt instanceof Timestamp ? raw.createdAt.toDate().toISOString() : undefined,
    subtotal: toNumberOrNull(raw.subtotal),
    tax: toNumberOrNull(raw.tax),
    discount: toNumberOrNull(raw.discount),
    paymentMethod: toStringOrNull(raw.paymentMethod),
    notes: toStringOrNull(raw.notes),
    ocrText: typeof raw.ocrText === 'string' ? raw.ocrText : '',
    receiptImageBase64:
      typeof raw.receiptImageBase64 === 'string' ? raw.receiptImageBase64 : undefined,
    receiptImageMimeType:
      typeof raw.receiptImageMimeType === 'string' ? raw.receiptImageMimeType : undefined,
    lineItems,
    validation,
  };
}

// ==================== MERGE OPERATIONS ====================

/**
 * Chia mảng thành chunks size ≤ N (Firestore 'in' query max 10 values).
 */
const chunk = <T>(arr: T[], size: number): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

/**
 * Gộp nhiều suppliers (duplicates) vào 1 supplier root.
 * - Cập nhật mọi stock_receipts có supplierId trong duplicateIds → set về rootId
 * - Cộng dồn receiptCount + totalAmount vào root
 * - Xoá các duplicate supplier docs
 *
 * @throws nếu root nằm trong duplicateIds hoặc root không tồn tại
 */
export async function mergeSuppliers(rootId: string, duplicateIds: string[]): Promise<void> {
  const dupSet = new Set(duplicateIds.filter((id) => id && id !== rootId));
  if (dupSet.size === 0) return;
  const dups = Array.from(dupSet);

  const rootRef = doc(db, SUPPLIERS_COLLECTION, rootId);
  const rootSnap = await getDoc(rootRef);
  if (!rootSnap.exists()) throw new Error('Root supplier không tồn tại');
  const rootData = rootSnap.data();
  const rootName = typeof rootData.name === 'string' ? rootData.name : '';

  // Fetch + sum duplicates
  const dupSnaps = await Promise.all(dups.map((id) => getDoc(doc(db, SUPPLIERS_COLLECTION, id))));
  let receiptCountSum = 0;
  let totalAmountSum = 0;
  const existing: string[] = [];
  dupSnaps.forEach((s, idx) => {
    if (!s.exists()) return;
    const d = s.data();
    receiptCountSum += typeof d.receiptCount === 'number' ? d.receiptCount : 0;
    totalAmountSum += typeof d.totalAmount === 'number' ? d.totalAmount : 0;
    existing.push(dups[idx]);
  });
  if (existing.length === 0) return;

  // Tìm stock_receipts (chunk vì Firestore 'in' giới hạn 10)
  const receiptDocs: { id: string; ref: any }[] = [];
  for (const grp of chunk(existing, 10)) {
    const snap = await getDocs(
      query(collection(db, RECEIPTS_COLLECTION), where('supplierId', 'in', grp)),
    );
    snap.docs.forEach((d) => receiptDocs.push({ id: d.id, ref: d.ref }));
  }

  // Tìm materials có lastSupplierId trong duplicates
  const materialDocs: { ref: any }[] = [];
  for (const grp of chunk(existing, 10)) {
    const snap = await getDocs(
      query(collection(db, MATERIALS_COLLECTION), where('lastSupplierId', 'in', grp)),
    );
    snap.docs.forEach((d) => materialDocs.push({ ref: d.ref }));
  }

  // Batch update (Firestore batch limit 500)
  const allWrites = receiptDocs.length + materialDocs.length + existing.length + 1;
  if (allWrites > 480) {
    // Chia batch
    const writeOps: Array<() => void> = [];
    const batches: any[] = [writeBatch(db)];
    let count = 0;
    const enqueue = (fn: (b: any) => void) => {
      if (count >= 450) { batches.push(writeBatch(db)); count = 0; }
      fn(batches[batches.length - 1]);
      count++;
    };
    receiptDocs.forEach((r) =>
      enqueue((b) => b.update(r.ref, { supplierId: rootId, supplierNameCanonical: rootName, updatedAt: serverTimestamp() })),
    );
    materialDocs.forEach((m) =>
      enqueue((b) => b.update(m.ref, { lastSupplierId: rootId, lastSupplierName: rootName, updatedAt: serverTimestamp() })),
    );
    enqueue((b) =>
      b.update(rootRef, {
        receiptCount: increment(receiptCountSum),
        totalAmount: increment(totalAmountSum),
        updatedAt: serverTimestamp(),
      }),
    );
    existing.forEach((id) => enqueue((b) => b.delete(doc(db, SUPPLIERS_COLLECTION, id))));
    for (const b of batches) await b.commit();
    return;
  }

  const batch = writeBatch(db);
  receiptDocs.forEach((r) =>
    batch.update(r.ref, { supplierId: rootId, supplierNameCanonical: rootName, updatedAt: serverTimestamp() }),
  );
  materialDocs.forEach((m) =>
    batch.update(m.ref, { lastSupplierId: rootId, lastSupplierName: rootName, updatedAt: serverTimestamp() }),
  );
  batch.update(rootRef, {
    receiptCount: increment(receiptCountSum),
    totalAmount: increment(totalAmountSum),
    updatedAt: serverTimestamp(),
  });
  existing.forEach((id) => batch.delete(doc(db, SUPPLIERS_COLLECTION, id)));
  await batch.commit();
}

/**
 * Gộp nhiều materials (duplicates) vào 1 material root.
 * - Cập nhật mọi line trong subcollection `lines` có materialId trong duplicateIds (via collectionGroup)
 * - Cộng dồn importCount + totalQty + totalAmount vào root
 * - Xoá các duplicate material docs
 */
export async function mergeMaterials(rootId: string, duplicateIds: string[]): Promise<void> {
  const dupSet = new Set(duplicateIds.filter((id) => id && id !== rootId));
  if (dupSet.size === 0) return;
  const dups = Array.from(dupSet);

  const rootRef = doc(db, MATERIALS_COLLECTION, rootId);
  const rootSnap = await getDoc(rootRef);
  if (!rootSnap.exists()) throw new Error('Root material không tồn tại');
  const rootData = rootSnap.data();
  const rootName = typeof rootData.name === 'string' ? rootData.name : '';

  const dupSnaps = await Promise.all(dups.map((id) => getDoc(doc(db, MATERIALS_COLLECTION, id))));
  let importCountSum = 0;
  let totalQtySum = 0;
  let totalAmountSum = 0;
  const existing: string[] = [];
  dupSnaps.forEach((s, idx) => {
    if (!s.exists()) return;
    const d = s.data();
    importCountSum += typeof d.importCount === 'number' ? d.importCount : 0;
    totalQtySum += typeof d.totalQty === 'number' ? d.totalQty : 0;
    totalAmountSum += typeof d.totalAmount === 'number' ? d.totalAmount : 0;
    existing.push(dups[idx]);
  });
  if (existing.length === 0) return;

  // collectionGroup query — fetch lines có materialId trong duplicates
  const lineDocs: { ref: any }[] = [];
  for (const grp of chunk(existing, 10)) {
    const snap = await getDocs(
      query(collectionGroup(db, LINES_SUBCOLLECTION), where('materialId', 'in', grp)),
    );
    snap.docs.forEach((d) => lineDocs.push({ ref: d.ref }));
  }

  const allWrites = lineDocs.length + existing.length + 1;
  if (allWrites > 480) {
    const batches: any[] = [writeBatch(db)];
    let count = 0;
    const enqueue = (fn: (b: any) => void) => {
      if (count >= 450) { batches.push(writeBatch(db)); count = 0; }
      fn(batches[batches.length - 1]);
      count++;
    };
    lineDocs.forEach((l) =>
      enqueue((b) => b.update(l.ref, { materialId: rootId, materialNameRaw: rootName })),
    );
    enqueue((b) =>
      b.update(rootRef, {
        importCount: increment(importCountSum),
        totalQty: increment(totalQtySum),
        totalAmount: increment(totalAmountSum),
        updatedAt: serverTimestamp(),
      }),
    );
    existing.forEach((id) => enqueue((b) => b.delete(doc(db, MATERIALS_COLLECTION, id))));
    for (const b of batches) await b.commit();
    return;
  }

  const batch = writeBatch(db);
  lineDocs.forEach((l) => batch.update(l.ref, { materialId: rootId, materialNameRaw: rootName }));
  batch.update(rootRef, {
    importCount: increment(importCountSum),
    totalQty: increment(totalQtySum),
    totalAmount: increment(totalAmountSum),
    updatedAt: serverTimestamp(),
  });
  existing.forEach((id) => batch.delete(doc(db, MATERIALS_COLLECTION, id)));
  await batch.commit();
}
