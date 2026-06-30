import React, { useCallback, useMemo, useState } from 'react';
import { Check, GitMerge, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  DEFAULT_MATERIAL_MERGE_THRESHOLD,
  useMaterialMergeSuggestions,
  useStockReceiptMutations,
} from '@/hooks/queries/useStockReceiptQuery';
import type { MaterialMergeCandidate } from '@/services/stockReceiptService';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Checkbox from '@/components/ui/Checkbox';
import EmptyState from '@/components/ui/EmptyState';
import Input from '@/components/ui/Input';
import Spinner from '@/components/ui/Spinner';
import Typography from '@/components/ui/Typography';

export interface MergeSuggestionsPanelProps {
  /** Hiển thị panel + bật fetch suggestions (chỉ fetch khi mở). */
  open: boolean;
  /** Refetch danh sách NVL sau khi gộp xong (parent sở hữu list). */
  onMerged: () => void;
  /** Nhúng trong modal: bỏ Card + header riêng (modal đã có khung + tiêu đề). */
  embedded?: boolean;
}

/** 1 thành viên trong nhóm, kèm độ giống cao nhất của thành viên đó với nhóm. */
interface GroupMember extends MaterialMergeCandidate {
  /** Similarity lớn nhất giữa member này với 1 cặp bất kỳ trong nhóm (0–1). */
  topSimilarity: number;
}

/** 1 nhóm NVL nghi trùng (connected component theo id). */
interface SuggestionGroup {
  /** Khoá ổn định = các id thành viên sort & nối — để giữ state khi refetch. */
  key: string;
  members: GroupMember[];
  /** Similarity lớn nhất trong nhóm (để hiển thị độ giống tổng quát). */
  topSimilarity: number;
}

/** Lựa chọn người dùng cho 1 nhóm. */
interface GroupChoice {
  rootId: string;
  /** id các bản gộp vào root (tick). */
  duplicateIds: Set<string>;
  name: string;
  unit: string;
}

const MergeSuggestionsPanel: React.FC<MergeSuggestionsPanelProps> = ({ open, onMerged, embedded }) => {
  const { t } = useLanguage();
  const { suggestions, loading } = useMaterialMergeSuggestions(
    open,
    DEFAULT_MATERIAL_MERGE_THRESHOLD,
  );
  const { mergeMaterialsInto, updateMaterialInfo } = useStockReceiptMutations();

  // Overrides do user chỉnh (theo group key) — undefined = dùng default tính từ nhóm.
  const [choices, setChoices] = useState<Record<string, GroupChoice>>({});
  const [submittingKey, setSubmittingKey] = useState<string | null>(null);

  /**
   * Gom các cặp thành NHÓM bằng union-find (connected components theo id).
   * Cặp chung material → cùng 1 nhóm. Đồng thời gom info candidate + similarity.
   */
  const groups = useMemo<SuggestionGroup[]>(() => {
    const parent = new Map<string, string>();
    const find = (x: string): string => {
      let root = x;
      while (parent.get(root) !== root) root = parent.get(root) as string;
      // Path compression
      let cur = x;
      while (parent.get(cur) !== root) {
        const next = parent.get(cur) as string;
        parent.set(cur, root);
        cur = next;
      }
      return root;
    };
    const union = (a: string, b: string) => {
      const ra = find(a);
      const rb = find(b);
      if (ra !== rb) parent.set(ra, rb);
    };

    const ensure = (id: string) => {
      if (!parent.has(id)) parent.set(id, id);
    };

    // Candidate info gần nhất theo id + similarity cao nhất của từng member.
    const infoById = new Map<string, MaterialMergeCandidate>();
    const topSimById = new Map<string, number>();

    for (const pair of suggestions) {
      ensure(pair.a.id);
      ensure(pair.b.id);
      union(pair.a.id, pair.b.id);
      infoById.set(pair.a.id, pair.a);
      infoById.set(pair.b.id, pair.b);
      topSimById.set(pair.a.id, Math.max(topSimById.get(pair.a.id) ?? 0, pair.similarity));
      topSimById.set(pair.b.id, Math.max(topSimById.get(pair.b.id) ?? 0, pair.similarity));
    }

    const byRoot = new Map<string, GroupMember[]>();
    for (const id of parent.keys()) {
      const root = find(id);
      const info = infoById.get(id);
      if (!info) continue;
      const member: GroupMember = { ...info, topSimilarity: topSimById.get(id) ?? 0 };
      const arr = byRoot.get(root);
      if (arr) arr.push(member);
      else byRoot.set(root, [member]);
    }

    const result: SuggestionGroup[] = [];
    for (const members of byRoot.values()) {
      if (members.length < 2) continue;
      // Thành viên nhiều lần nhập nhất lên đầu (ứng viên root mặc định).
      members.sort((a, b) => b.importCount - a.importCount);
      const key = members
        .map((m) => m.id)
        .slice()
        .sort()
        .join('|');
      const topSimilarity = members.reduce((mx, m) => Math.max(mx, m.topSimilarity), 0);
      result.push({ key, members, topSimilarity });
    }
    // Nhóm độ giống cao hiện trước.
    result.sort((a, b) => b.topSimilarity - a.topSimilarity);
    return result;
  }, [suggestions]);

  // Default choice cho 1 nhóm: root = importCount lớn nhất (members[0]), tick hết trừ root.
  const defaultChoice = useCallback((group: SuggestionGroup): GroupChoice => {
    const root = group.members[0];
    return {
      rootId: root.id,
      duplicateIds: new Set(group.members.filter((m) => m.id !== root.id).map((m) => m.id)),
      name: root.name,
      unit: root.canonicalUnit ?? '',
    };
  }, []);

  const getChoice = useCallback(
    (group: SuggestionGroup): GroupChoice => choices[group.key] ?? defaultChoice(group),
    [choices, defaultChoice],
  );

  const setChoice = useCallback(
    (group: SuggestionGroup, updater: (prev: GroupChoice) => GroupChoice) => {
      setChoices((prev) => {
        const current = prev[group.key] ?? defaultChoice(group);
        return { ...prev, [group.key]: updater(current) };
      });
    },
    [defaultChoice],
  );

  const handlePickRoot = useCallback(
    (group: SuggestionGroup, id: string) => {
      const member = group.members.find((m) => m.id === id);
      setChoice(group, (prev) => {
        // Khi đổi root: bỏ root mới khỏi duplicate, thêm root cũ vào duplicate.
        const dup = new Set(prev.duplicateIds);
        dup.delete(id);
        if (prev.rootId !== id) dup.add(prev.rootId);
        return {
          rootId: id,
          duplicateIds: dup,
          name: member?.name ?? prev.name,
          unit: member?.canonicalUnit ?? '',
        };
      });
    },
    [setChoice],
  );

  const handleToggleDuplicate = useCallback(
    (group: SuggestionGroup, id: string) => {
      setChoice(group, (prev) => {
        const dup = new Set(prev.duplicateIds);
        if (dup.has(id)) dup.delete(id);
        else dup.add(id);
        return { ...prev, duplicateIds: dup };
      });
    },
    [setChoice],
  );

  const handleMerge = useCallback(
    async (group: SuggestionGroup) => {
      const choice = getChoice(group);
      const duplicateIds = [...choice.duplicateIds].filter((id) => id !== choice.rootId);
      if (duplicateIds.length === 0) {
        toast.error(t('billImport.materialsMerge.selectAtLeastOne'));
        return;
      }
      const name = choice.name.trim();
      if (!name) {
        toast.error(t('billImport.materialsMerge.nameRequired'));
        return;
      }
      const unit = choice.unit.trim();
      const root = group.members.find((m) => m.id === choice.rootId);

      setSubmittingKey(group.key);
      try {
        await mergeMaterialsInto({ rootId: choice.rootId, duplicateIds });
        // Tên/đơn vị đổi so với root → patch lại NVL gốc.
        const patch: { name?: string; canonicalUnit?: string } = {};
        if (root && name !== root.name) patch.name = name;
        if (root && unit !== (root.canonicalUnit ?? '')) patch.canonicalUnit = unit;
        if (patch.name !== undefined || patch.canonicalUnit !== undefined) {
          await updateMaterialInfo({ id: choice.rootId, patch });
        }
        toast.success(
          t('billImport.materialsMerge.mergeSuccess')
            .replace('{{n}}', String(duplicateIds.length))
            .replace('{{name}}', name),
        );
        // Bỏ override của nhóm vừa gộp (nhóm sẽ biến mất sau refetch).
        setChoices((prev) => {
          const next = { ...prev };
          delete next[group.key];
          return next;
        });
        onMerged();
      } catch (e: any) {
        console.error('Merge materials failed:', e);
        toast.error(
          `${t('billImport.materialsMerge.mergeError')}: ${e?.message || 'Unknown error'}`,
        );
      } finally {
        setSubmittingKey(null);
      }
    },
    [getChoice, mergeMaterialsInto, updateMaterialInfo, onMerged, t],
  );

  if (!open) return null;

  const Wrapper: any = embedded ? Box : Card;
  const wrapperProps: any = embedded
    ? { layoutClassName: 'space-y-4' }
    : { padding: 'md', layoutClassName: 'space-y-4', backgroundClassName: 'bg-white dark:bg-slate-800' };

  return (
    <Wrapper {...wrapperProps}>
      {embedded ? null : (
        <Box layoutClassName="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary-500" />
          <Box layoutClassName="min-w-0">
            <Typography size="sm" tone="strong" layoutClassName="font-semibold">
              {t('billImport.materialsMerge.suggestTitle')}
            </Typography>
            <Typography size="xs" variant="muted">
              {t('billImport.materialsMerge.suggestSubtitle')}
            </Typography>
          </Box>
        </Box>
      )}

      {loading ? (
        <Box layoutClassName="flex items-center justify-center gap-2 py-8">
          <Spinner size="md" textClassName="text-primary-500" />
          <Typography size="sm" variant="muted">
            {t('billImport.materialsMerge.loading')}
          </Typography>
        </Box>
      ) : groups.length === 0 ? (
        <EmptyState
          icon={<GitMerge className="h-6 w-6" />}
          title={t('billImport.materialsMerge.empty')}
          description={t('billImport.materialsMerge.emptyHint')}
        />
      ) : (
        <Box layoutClassName="space-y-4">
          {groups.map((group, idx) => {
            const choice = getChoice(group);
            const submitting = submittingKey === group.key;
            const selectedCount = group.members.filter(
              (m) => m.id !== choice.rootId && choice.duplicateIds.has(m.id),
            ).length;
            return (
              <Box
                key={group.key}
                layoutClassName="rounded-xl border p-4 space-y-3"
                borderClassName="border-slate-200 dark:border-slate-700"
                backgroundClassName="bg-slate-50/60 dark:bg-slate-900/40"
              >
                <Box layoutClassName="flex flex-wrap items-center justify-between gap-2">
                  <Box layoutClassName="flex items-center gap-2">
                    <Typography size="sm" tone="strong" layoutClassName="font-semibold">
                      {t('billImport.materialsMerge.groupLabel').replace('{{n}}', String(idx + 1))}
                    </Typography>
                    <Typography
                      as="span"
                      size="xs"
                      variant="muted"
                      layoutClassName="rounded-md px-2 py-0.5"
                      backgroundClassName="bg-slate-200/70 dark:bg-slate-700/60"
                    >
                      {t('billImport.materialsMerge.membersCount').replace(
                        '{{n}}',
                        String(group.members.length),
                      )}
                    </Typography>
                  </Box>
                  <Typography
                    as="span"
                    size="xs"
                    layoutClassName="rounded-md px-2 py-0.5 font-semibold"
                    backgroundClassName="bg-primary-50 dark:bg-primary-950/40"
                    textClassName="text-primary-700 dark:text-primary-300"
                  >
                    {t('billImport.materialsMerge.similarity').replace(
                      '{{pct}}',
                      String(Math.round(group.topSimilarity * 100)),
                    )}
                  </Typography>
                </Box>

                {/* Thành viên */}
                <Box layoutClassName="space-y-2">
                  {group.members.map((m) => {
                    const isRoot = m.id === choice.rootId;
                    const checked = isRoot || choice.duplicateIds.has(m.id);
                    return (
                      <Box
                        key={m.id}
                        layoutClassName="flex items-center gap-3 rounded-lg border p-2.5"
                        borderClassName={
                          isRoot
                            ? 'border-primary-300 dark:border-primary-700'
                            : 'border-slate-200 dark:border-slate-700'
                        }
                        backgroundClassName={
                          isRoot
                            ? 'bg-primary-50/70 dark:bg-primary-950/30'
                            : 'bg-white dark:bg-slate-800'
                        }
                      >
                        {/* Radio chọn root */}
                        <Input
                          type="radio"
                          name={`root-${group.key}`}
                          checked={isRoot}
                          disabled={submitting}
                          onChange={() => handlePickRoot(group, m.id)}
                          containerClassName="w-auto"
                          sizeClassName="h-4 w-4 p-0"
                          backgroundClassName="bg-transparent"
                        />
                        {/* Checkbox tick gộp (root luôn checked + disabled) */}
                        <Checkbox
                          checked={checked}
                          disabled={isRoot || submitting}
                          onChange={() => handleToggleDuplicate(group, m.id)}
                        />
                        <Box layoutClassName="min-w-0 flex-1">
                          <Typography size="sm" layoutClassName="truncate font-medium">
                            {m.name}
                          </Typography>
                          <Typography size="xs" variant="muted" layoutClassName="truncate">
                            {t('billImport.materialsMerge.importCount').replace(
                              '{{n}}',
                              String(m.importCount),
                            )}
                            {' · '}
                            {t('billImport.materialsMerge.qty').replace('{{n}}', String(m.totalQty))}
                            {m.canonicalUnit ? ` ${m.canonicalUnit}` : ''}
                          </Typography>
                        </Box>
                        {isRoot ? (
                          <Typography
                            as="span"
                            size="xs"
                            layoutClassName="rounded-md px-2 py-0.5 font-bold uppercase"
                            backgroundClassName="bg-primary-600"
                            textClassName="text-white"
                          >
                            {t('billImport.materialsMerge.rootBadge')}
                          </Typography>
                        ) : null}
                      </Box>
                    );
                  })}
                </Box>

                {/* Tên chuẩn + đơn vị */}
                <Box layoutClassName="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Box layoutClassName="space-y-1">
                    <Typography
                      as="span"
                      size="xs"
                      variant="muted"
                      layoutClassName="font-semibold uppercase tracking-wide"
                    >
                      {t('billImport.materialsMerge.canonicalName')}
                    </Typography>
                    <Input
                      value={choice.name}
                      disabled={submitting}
                      onChange={(e) =>
                        setChoice(group, (prev) => ({ ...prev, name: e.target.value }))
                      }
                    />
                  </Box>
                  <Box layoutClassName="space-y-1">
                    <Typography
                      as="span"
                      size="xs"
                      variant="muted"
                      layoutClassName="font-semibold uppercase tracking-wide"
                    >
                      {t('billImport.materialsMerge.canonicalUnit')}
                    </Typography>
                    <Input
                      value={choice.unit}
                      disabled={submitting}
                      placeholder={t('billImport.materialsMerge.unitPlaceholder')}
                      onChange={(e) =>
                        setChoice(group, (prev) => ({ ...prev, unit: e.target.value }))
                      }
                    />
                  </Box>
                </Box>

                <Box layoutClassName="flex justify-end">
                  <Button
                    type="button"
                    onClick={() => handleMerge(group)}
                    disabled={submitting || selectedCount === 0}
                    leftIcon={
                      submitting ? (
                        <Spinner size="sm" textClassName="text-white" borderClassName="border-white" />
                      ) : (
                        <GitMerge className="h-4 w-4" />
                      )
                    }
                    iconClassName="inline-flex shrink-0"
                    sizeClassName="px-4 py-2"
                    layoutClassName="inline-flex items-center gap-2"
                    roundedClassName="rounded-xl"
                  >
                    {submitting
                      ? t('billImport.materialsMerge.merging')
                      : t('billImport.materialsMerge.merge')}
                  </Button>
                </Box>
              </Box>
            );
          })}
        </Box>
      )}
    </Wrapper>
  );
};

export default MergeSuggestionsPanel;
