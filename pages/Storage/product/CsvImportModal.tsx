/**
 * CsvImportModal — bulk import sản phẩm từ file CSV.
 * Flow: chọn file → parse → preview với validation → import.
 * Match logic: nếu CSV row có ID khớp với product existing → UPDATE, ngược lại → ADD.
 */
import React, { useMemo, useRef, useState } from 'react';
import { AlertCircle, Check, Download, FileSpreadsheet, Loader2, Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Product } from '@/types';
import { addProduct, updateProduct } from '@/services/productService';
import { detectProductColumns, parseCsvText, parseNumberCell, readCell } from '@/utils/product/csvParser';
import CsvPreviewTable, { type CsvPreviewRow } from '@/pages/Storage/product/components/CsvPreviewTable';
import Button from '@/components/ui/Button';
import IconButton from '@/components/ui/IconButton';
import Heading from '@/components/ui/Heading';

interface CsvImportModalProps {
  existingProducts: Product[];
  onClose: () => void;
  onComplete: () => void;
}

interface ParsedRow extends CsvPreviewRow {
  id?: string;
  costPrice?: number;
  tags?: string[];
  description?: string;
  stockUnit?: string;
  currentStock?: number;
  lowStockThreshold?: number;
}

const CsvImportModal: React.FC<CsvImportModalProps> = ({ existingProducts, onClose, onComplete }) => {
  const [step, setStep] = useState<'pick' | 'preview' | 'importing'>('pick');
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const idMap = useMemo(() => new Map(existingProducts.map((p) => [p.id, p])), [existingProducts]);
  const nameMap = useMemo(() => {
    const m = new Map<string, Product>();
    existingProducts.forEach((p) => m.set(p.name.trim().toLowerCase(), p));
    return m;
  }, [existingProducts]);

  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error('Vui lòng chọn file .csv');
      return;
    }
    const text = await file.text();
    const all = parseCsvText(text);
    if (all.length < 2) {
      toast.error('File CSV trống hoặc không có dữ liệu');
      return;
    }
    const idx = detectProductColumns(all[0]);
    if (idx.name === -1) {
      toast.error('CSV phải có cột "Tên" hoặc "Name"');
      return;
    }

    const parsed: ParsedRow[] = all.slice(1).map((cells, i) => {
      const id = readCell(cells, idx.id);
      const name = readCell(cells, idx.name);
      const price = parseNumberCell(readCell(cells, idx.price)) ?? 0;
      const costPrice = parseNumberCell(readCell(cells, idx.cost));
      const statusRaw = readCell(cells, idx.status).toLowerCase();
      const status: 'active' | 'inactive' =
        statusRaw === 'inactive' || statusRaw === 'tạm dừng' || statusRaw === '0' ? 'inactive' : 'active';
      const tagsRaw = readCell(cells, idx.tags);
      const tags = tagsRaw ? tagsRaw.split(/[;,]/).map((t) => t.trim()).filter(Boolean) : undefined;

      let action: ParsedRow['__action'] = 'add';
      let matchedId: string | undefined = undefined;
      if (id && idMap.has(id)) {
        action = 'update';
        matchedId = id;
      } else if (name && nameMap.has(name.toLowerCase())) {
        action = 'update';
        matchedId = nameMap.get(name.toLowerCase())!.id;
      }

      let error: string | undefined = undefined;
      if (!name) error = 'Thiếu tên';
      else if (!Number.isFinite(price) || price < 0) error = 'Giá không hợp lệ';

      return {
        id: matchedId || (id || undefined),
        name,
        category: readCell(cells, idx.category) || 'General',
        price,
        costPrice,
        status,
        tags,
        description: readCell(cells, idx.desc) || undefined,
        stockUnit: readCell(cells, idx.stockUnit) || undefined,
        currentStock: parseNumberCell(readCell(cells, idx.stock)),
        lowStockThreshold: parseNumberCell(readCell(cells, idx.threshold)),
        __row: i + 2,
        __action: error ? 'skip' : action,
        __error: error,
      };
    });

    setRows(parsed);
    setStep('preview');
  };

  const handleImport = async () => {
    setStep('importing');
    const valid = rows.filter((r) => r.__action !== 'skip');
    let done = 0;
    let added = 0;
    let updated = 0;
    let errors = 0;

    for (const r of valid) {
      try {
        const payload: Partial<Product> = {
          name: r.name,
          category: r.category,
          price: r.price,
          status: r.status,
          image: '',
        };
        if (r.costPrice != null) payload.costPrice = r.costPrice;
        if (r.tags && r.tags.length > 0) payload.tags = r.tags;
        if (r.description) payload.description = r.description;
        if (r.stockUnit) payload.stockUnit = r.stockUnit;
        if (r.currentStock != null && !Number.isNaN(r.currentStock)) payload.currentStock = r.currentStock;
        if (r.lowStockThreshold != null && !Number.isNaN(r.lowStockThreshold)) payload.lowStockThreshold = r.lowStockThreshold;

        if (r.__action === 'update' && r.id) {
          const existing = idMap.get(r.id);
          if (existing?.image) payload.image = existing.image;
          await updateProduct(r.id, payload);
          updated++;
        } else {
          await addProduct(payload as Omit<Product, 'id'>);
          added++;
        }
      } catch (e) {
        console.error('Import row failed:', r, e);
        errors++;
      }
      done++;
      setProgress(Math.round((done / valid.length) * 100));
    }

    toast.success(`Hoàn tất: +${added} mới, ↻${updated} cập nhật${errors ? `, ❌${errors} lỗi` : ''}`);
    onComplete();
    onClose();
  };

  const downloadTemplate = () => {
    const csv =
      '﻿ID,Tên,Category,Giá bán,Giá vốn,Status,Tags,Mô tả,Đơn vị,Tồn kho,Ngưỡng cảnh báo\n' +
      ',Bánh kem chocolate,Bánh kem,250000,150000,active,"Bán chạy; Mới",Bánh kem 18cm phủ socola,cái,10,3\n' +
      ',Cookie bơ,Cookie,15000,8000,active,Bán chạy,Cookie bơ giòn,cái,50,10\n';
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'product-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const counts = {
    add: rows.filter((r) => r.__action === 'add').length,
    update: rows.filter((r) => r.__action === 'update').length,
    skip: rows.filter((r) => r.__action === 'skip').length,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-slate-800 shadow-2xl border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-orange-500" />
            <Heading level={2} textClassName="text-base font-bold">Import sản phẩm từ CSV</Heading>
          </div>
          <IconButton label="Đóng" variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </IconButton>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {step === 'pick' && (
            <div className="space-y-4">
              <div className="rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 p-8 text-center">
                <Upload className="mx-auto h-12 w-12 text-slate-400 mb-3" />
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Chọn file CSV để import</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                  Hệ thống tự match theo ID (nếu có) hoặc Tên — match sẽ UPDATE, không match sẽ ADD mới
                </p>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f); }}
                />
                <div className="flex items-center justify-center gap-2">
                  <Button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    leftIcon={<Upload />}
                    iconClassName="inline-flex shrink-0 [&_svg]:h-4 [&_svg]:w-4"
                    sizeClassName="px-4 py-2 text-sm"
                    backgroundClassName="bg-orange-600 hover:bg-orange-700"
                    textClassName="font-medium text-white"
                    roundedClassName="rounded-lg"
                    borderClassName="border border-transparent"
                    shadowClassName="shadow-sm"
                    layoutClassName="inline-flex items-center gap-1.5"
                    disableVariantHover
                    disableVariantTextColor
                  >
                    Chọn file CSV
                  </Button>
                  <Button
                    type="button"
                    onClick={downloadTemplate}
                    variant="secondary"
                    leftIcon={<Download />}
                    iconClassName="inline-flex shrink-0 [&_svg]:h-4 [&_svg]:w-4"
                    sizeClassName="px-4 py-2 text-sm"
                    textClassName="font-medium"
                    roundedClassName="rounded-lg"
                    layoutClassName="inline-flex items-center gap-1.5"
                  >
                    Tải template
                  </Button>
                </div>
              </div>

              <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3 text-xs text-blue-700 dark:text-blue-300 space-y-1">
                <p className="font-semibold">📋 Cột hỗ trợ (header không phân biệt hoa thường):</p>
                <ul className="ml-4 list-disc space-y-0.5">
                  <li><strong>ID</strong> — để trống = tạo mới, có ID khớp = cập nhật</li>
                  <li><strong>Tên</strong> (bắt buộc) — nếu trùng tên với SP cũ sẽ cập nhật</li>
                  <li><strong>Category, Giá bán, Giá vốn, Status</strong> (active/inactive)</li>
                  <li><strong>Tags</strong> (ngăn cách bằng <code>;</code> hoặc <code>,</code>)</li>
                  <li><strong>Mô tả, Đơn vị, Tồn kho, Ngưỡng cảnh báo</strong></li>
                </ul>
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-3">
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold uppercase">Sẽ thêm</p>
                  <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{counts.add}</p>
                </div>
                <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3">
                  <p className="text-xs text-blue-700 dark:text-blue-300 font-semibold uppercase">Sẽ cập nhật</p>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{counts.update}</p>
                </div>
                <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3">
                  <p className="text-xs text-red-700 dark:text-red-300 font-semibold uppercase">Bỏ qua (lỗi)</p>
                  <p className="text-2xl font-bold text-red-700 dark:text-red-300">{counts.skip}</p>
                </div>
              </div>

              <CsvPreviewTable rows={rows} />

              {counts.skip > 0 && (
                <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span><strong>{counts.skip} hàng có lỗi</strong> sẽ bị bỏ qua. Sửa lại CSV nếu muốn import đủ.</span>
                </div>
              )}
            </div>
          )}

          {step === 'importing' && (
            <div className="space-y-4 py-8 text-center">
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-orange-500" />
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Đang import sản phẩm...</p>
              <div className="mx-auto w-full max-w-md rounded-full bg-slate-200 dark:bg-slate-700 h-2 overflow-hidden">
                <div className="h-full bg-orange-500 transition-all" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">{progress}%</p>
            </div>
          )}
        </div>

        {step === 'preview' && (
          <div className="flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-700 px-5 py-3 bg-slate-50 dark:bg-slate-800/50">
            <Button
              type="button"
              onClick={() => setStep('pick')}
              variant="secondary"
              sizeClassName="px-4 py-2 text-sm"
              roundedClassName="rounded-lg"
              textClassName="font-medium"
            >
              Chọn file khác
            </Button>
            <Button
              type="button"
              onClick={() => void handleImport()}
              disabled={counts.add + counts.update === 0}
              leftIcon={<Check />}
              iconClassName="inline-flex shrink-0 [&_svg]:h-4 [&_svg]:w-4"
              sizeClassName="px-4 py-2 text-sm"
              backgroundClassName="bg-orange-600 hover:bg-orange-700"
              textClassName="font-medium text-white"
              roundedClassName="rounded-lg"
              borderClassName="border border-transparent"
              shadowClassName="shadow-sm"
              layoutClassName="inline-flex items-center gap-1.5"
              stateClassName="disabled:opacity-50"
              disableVariantHover
              disableVariantTextColor
            >
              Import {counts.add + counts.update} sản phẩm
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CsvImportModal;
