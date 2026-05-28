/**
 * AiInsightsModal — hiển thị kết quả phân tích AI (Gemini) cho sản phẩm.
 */
import React from 'react';
import { Loader2, Sparkles, X } from 'lucide-react';
import Button from '@/components/ui/Button';
import IconButton from '@/components/ui/IconButton';

interface AiInsightsModalProps {
  open: boolean;
  loading: boolean;
  text: string;
  productCount: number;
  onClose: () => void;
  onRefresh: () => void;
}

const AiInsightsModal: React.FC<AiInsightsModalProps> = ({
  open, loading, text, productCount, onClose, onRefresh,
}) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[80vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900"
      >
        <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-3 text-white dark:border-slate-700">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            <span className="font-bold">AI Insights — Phân tích sản phẩm</span>
          </div>
          <IconButton
            label="Đóng"
            variant="ghost"
            size="sm"
            onClick={onClose}
            backgroundClassName="bg-transparent hover:bg-white/20"
            textClassName="text-white/80 hover:text-white"
          >
            <X className="h-4 w-4" />
          </IconButton>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-5">
          {loading ? (
            <div className="flex flex-col items-center gap-3 py-12">
              <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
              <span className="text-sm text-slate-600 dark:text-slate-400">
                Gemini đang phân tích {productCount} sản phẩm...
              </span>
            </div>
          ) : (
            <div className="prose prose-sm max-w-none whitespace-pre-wrap text-sm text-slate-800 dark:prose-invert dark:text-slate-200">
              {text || 'Không có dữ liệu.'}
            </div>
          )}
        </div>

        {!loading && text ? (
          <div className="flex items-center justify-end border-t border-slate-200 px-5 py-3 dark:border-slate-700">
            <Button
              type="button"
              onClick={onRefresh}
              leftIcon={<Sparkles />}
              iconClassName="inline-flex shrink-0 [&_svg]:h-4 [&_svg]:w-4"
              sizeClassName="px-4 py-2 text-sm"
              backgroundClassName="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              textClassName="font-medium text-white"
              roundedClassName="rounded-lg"
              borderClassName="border-transparent"
              layoutClassName="inline-flex items-center gap-1.5"
              disableVariantHover
              disableVariantTextColor
            >
              Phân tích lại
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default AiInsightsModal;
