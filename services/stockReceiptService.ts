import {
  Timestamp,
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
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
} from '@/types/billReceipt';

const RECEIPTS_COLLECTION = 'stock_receipts';
const LINES_SUBCOLLECTION = 'lines';
const IMPORT_SUPPLIERS_COLLECTION = 'import_suppliers';
const IMPORT_MATERIALS_COLLECTION = 'import_materials';

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

const normalizeNameKey = (name: string | null | undefined): string => {
  const v = (name || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return v.replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
};

const nowIso = () => new Date().toISOString();

async function findOrCreateSupplierByName(rawName: string | null, receiptTotal: number): Promise<{ id: string | null; name: string | null }> {
  const name = (rawName || '').trim();
  if (!name) return { id: null, name: null };
  const normalizedName = normalizeNameKey(name);
  const q = query(collection(db, IMPORT_SUPPLIERS_COLLECTION), where('normalizedName', '==', normalizedName));
  const snap = await getDocs(q);
  if (!snap.empty) {
    const d = snap.docs[0];
    const data = d.data() as Record<string, unknown>;
    await updateDoc(doc(db, IMPORT_SUPPLIERS_COLLECTION, d.id), {
      receiptCount: (typeof data.receiptCount === 'number' ? data.receiptCount : 0) + 1,
      totalAmount: (typeof data.totalAmount === 'number' ? data.totalAmount : 0) + receiptTotal,
      lastReceiptDate: nowIso(),
      updatedAt: serverTimestamp(),
    });
    return { id: d.id, name };
  }

  const created = await addDoc(collection(db, IMPORT_SUPPLIERS_COLLECTION), {
    name,
    normalizedName,
    receiptCount: 1,
    totalAmount: receiptTotal,
    lastReceiptDate: nowIso(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return { id: created.id, name };
}

async function findOrCreateMaterialByName(
  rawName: string,
  qty: number,
  lineTotal: number,
  supplierName: string | null
): Promise<{ id: string | null; name: string }> {
  const name = rawName.trim();
  if (!name) return { id: null, name: rawName };
  const normalizedName = normalizeNameKey(name);
  const q = query(collection(db, IMPORT_MATERIALS_COLLECTION), where('normalizedName', '==', normalizedName));
  const snap = await getDocs(q);
  if (!snap.empty) {
    const d = snap.docs[0];
    const data = d.data() as Record<string, unknown>;
    await updateDoc(doc(db, IMPORT_MATERIALS_COLLECTION, d.id), {
      importCount: (typeof data.importCount === 'number' ? data.importCount : 0) + 1,
      totalQty: (typeof data.totalQty === 'number' ? data.totalQty : 0) + qty,
      totalAmount: (typeof data.totalAmount === 'number' ? data.totalAmount : 0) + lineTotal,
      lastSupplierName: supplierName ?? null,
      lastReceiptDate: nowIso(),
      updatedAt: serverTimestamp(),
    });
    return { id: d.id, name };
  }

  const created = await addDoc(collection(db, IMPORT_MATERIALS_COLLECTION), {
    name,
    normalizedName,
    importCount: 1,
    totalQty: qty,
    totalAmount: lineTotal,
    lastSupplierName: supplierName ?? null,
    lastReceiptDate: nowIso(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return { id: created.id, name };
}

export async function saveStockReceiptDraft(input: {
  structured: StockReceiptStructured;
  validation: StockReceiptValidationSnapshot;
  ocrText: string;
  receiptImageBase64?: string | null;
  receiptImageMimeType?: string | null;
  createdByUid?: string | null;
}): Promise<string> {
  const { structured, validation, ocrText, receiptImageBase64, receiptImageMimeType, createdByUid } = input;
  const receiptTotal = typeof structured.totalAmount === 'number' ? structured.totalAmount : 0;
  const supplier = await findOrCreateSupplierByName(structured.supplierName ?? null, receiptTotal);

  const headerRef = await addDoc(collection(db, RECEIPTS_COLLECTION), {
    supplierId: supplier.id,
    supplierNameRaw: supplier.name ?? null,
    storeOrBranch: structured.storeOrBranch ?? null,
    receiptDate: structured.receiptDate ?? null,
    receiptTime: structured.receiptTime ?? null,
    subtotal: structured.subtotal ?? null,
    tax: structured.tax ?? null,
    discount: structured.discount ?? null,
    totalAmount: structured.totalAmount ?? null,
    currency: structured.currency || 'VND',
    paymentMethod: structured.paymentMethod ?? null,
    notes: structured.notes ?? null,
    productLineCount: Number.isFinite(structured.productLineCount) ? structured.productLineCount : structured.lineItems.length,
    ocrText,
    receiptImageBase64: receiptImageBase64 ?? null,
    receiptImageMimeType: receiptImageMimeType ?? null,
    validation,
    status: 'draft',
    createdByUid: createdByUid ?? null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const lines = (structured.lineItems || []).map(normalizeLine).filter((x): x is BillLineItem => Boolean(x));
  for (const line of lines) {
    const qty = typeof line.quantity === 'number' ? line.quantity : 0;
    const amount = typeof line.lineTotal === 'number' ? line.lineTotal : 0;
    const material = await findOrCreateMaterialByName(line.name, qty, amount, supplier.name ?? null);
    await addDoc(collection(db, RECEIPTS_COLLECTION, headerRef.id, LINES_SUBCOLLECTION), {
      ...line,
      materialId: material.id,
      materialNameRaw: material.name,
      receiptId: headerRef.id,
      receiptDate: structured.receiptDate ?? null,
      supplierId: supplier.id,
      supplierNameRaw: supplier.name ?? null,
      createdAt: serverTimestamp(),
    });
  }

  return headerRef.id;
}

export async function fetchImportedSuppliers(): Promise<ImportedSupplierSummary[]> {
  const q = query(collection(db, IMPORT_SUPPLIERS_COLLECTION), orderBy('updatedAt', 'desc'));
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
    };
  });
}

export async function fetchImportedMaterials(): Promise<ImportedMaterialSummary[]> {
  const q = query(collection(db, IMPORT_MATERIALS_COLLECTION), orderBy('updatedAt', 'desc'));
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
      lastSupplierName: typeof raw.lastSupplierName === 'string' ? raw.lastSupplierName : undefined,
      lastReceiptDate: typeof raw.lastReceiptDate === 'string' ? raw.lastReceiptDate : undefined,
    };
  });
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
    query(collection(db, RECEIPTS_COLLECTION, receiptId, LINES_SUBCOLLECTION), orderBy('createdAt', 'asc'))
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
    totalAmount: toNumberOrNull(raw.totalAmount),
    currency: toStringOrNull(raw.currency) || 'VND',
    productLineCount: typeof raw.productLineCount === 'number' ? raw.productLineCount : lineItems.length,
    createdAt: raw.createdAt instanceof Timestamp ? raw.createdAt.toDate().toISOString() : undefined,
    subtotal: toNumberOrNull(raw.subtotal),
    tax: toNumberOrNull(raw.tax),
    discount: toNumberOrNull(raw.discount),
    paymentMethod: toStringOrNull(raw.paymentMethod),
    notes: toStringOrNull(raw.notes),
    ocrText: typeof raw.ocrText === 'string' ? raw.ocrText : '',
    receiptImageBase64: typeof raw.receiptImageBase64 === 'string' ? raw.receiptImageBase64 : undefined,
    receiptImageMimeType: typeof raw.receiptImageMimeType === 'string' ? raw.receiptImageMimeType : undefined,
    lineItems,
    validation,
  };
}
