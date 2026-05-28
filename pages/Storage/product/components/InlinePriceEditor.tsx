/**
 * InlinePriceEditor — click vào giá để sửa nhanh trong card/row.
 * Enter = lưu, Esc = huỷ.
 */
import React, { useState } from 'react';
import { formatVND } from '@/utils/format/currencyUtil';
import Input from '@/components/ui/Input';

interface InlinePriceEditorProps {
  value: number;
  onSave: (n: number) => void;
}

const InlinePriceEditor: React.FC<InlinePriceEditorProps> = ({ value, onSave }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));

  if (!editing) {
    return (
      <span
        onClick={(e) => { e.stopPropagation(); setDraft(String(value)); setEditing(true); }}
        title="Click để sửa giá"
        className="cursor-pointer rounded px-1 -mx-1 font-bold text-orange-600 transition-colors hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-900/20"
      >
        {formatVND(value)}
      </span>
    );
  }

  const commit = () => {
    const n = Number(draft.replace(/[^\d.-]/g, ''));
    if (Number.isFinite(n) && n >= 0 && n !== value) onSave(n);
    setEditing(false);
  };

  return (
    <Input
      size="sm"
      type="number"
      min={0}
      step={1000}
      autoFocus
      value={draft}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') { e.preventDefault(); commit(); }
        if (e.key === 'Escape') { e.preventDefault(); setEditing(false); }
      }}
      containerClassName="w-24"
      borderClassName="border-orange-300"
      textClassName="font-bold text-orange-600 dark:text-orange-300"
    />
  );
};

export default InlinePriceEditor;
