import React, { useMemo, useState } from 'react';
import BaseModal from '@/components/BaseModal';
import Box from '@/components/ui/Box';
import Image from '@/components/ui/Image';
import Card from '@/components/ui/Card';
import Heading from '@/components/ui/Heading';
import Typography from '@/components/ui/Typography';
import Button from '@/components/ui/Button';
import IconButton from '@/components/ui/IconButton';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Field from '@/components/ui/Field';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/Table';
import {
  useAttendanceHistory,
  useAttendanceOverview,
} from '@/hooks/queries/useAttendanceQuery';
import { kindLabel, shiftLabel, type AttendanceRecord } from '@/types/attendance';

const fmtDateTime = (iso?: string | null): string =>
  iso ? new Date(iso).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—';
const fmtTime = (iso?: string | null): string =>
  iso ? new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '—';

const ManageTab: React.FC = () => {
  const { rows: overview, loading: ovLoading } = useAttendanceOverview(true);

  const [empFilter, setEmpFilter] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  // Ảnh chấm công đang xem phóng to (đã đóng dấu tên/ca/ngày giờ sẵn từ lúc chụp).
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  // Bản ghi đang mở chi tiết (click 1 dòng lịch sử → xem ảnh + thông tin chấm công).
  const [detailRec, setDetailRec] = useState<AttendanceRecord | null>(null);
  const historyParams = useMemo(
    () => ({ employeeId: empFilter || undefined, from: from || undefined, to: to || undefined, limit: 200 }),
    [empFilter, from, to],
  );
  const { data: history, loading: hisLoading } = useAttendanceHistory(historyParams, true);

  return (
    <Box layoutClassName="flex flex-col gap-6">
      {/* ------- Tổng quan nhân viên ------- */}
      <Card
        padding="none"
        layoutClassName="overflow-hidden"
        borderClassName="border border-slate-200 dark:border-slate-700"
        backgroundClassName="bg-white dark:bg-slate-800"
      >
        <Box layoutClassName="flex items-center gap-2 px-4 py-3">
          <Heading level={2} textClassName="text-base font-bold text-slate-900 dark:text-white">
            Nhân viên hôm nay
          </Heading>
        </Box>
        <Box layoutClassName="overflow-x-auto">
          {ovLoading ? (
            <Box layoutClassName="p-6"><Spinner size="sm" textClassName="text-primary-500" /></Box>
          ) : overview.length === 0 ? (
            <EmptyState title="Chưa có nhân viên nào." />
          ) : (
            <Table>
              <TableHead backgroundClassName="bg-slate-50 dark:bg-slate-700/60">
                <TableRow textClassName="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  <TableHeaderCell layoutClassName="px-4 py-3">Tên</TableHeaderCell>
                  <TableHeaderCell layoutClassName="px-4 py-3">Email đăng nhập</TableHeaderCell>
                  <TableHeaderCell layoutClassName="px-4 py-3 text-center">Vào</TableHeaderCell>
                  <TableHeaderCell layoutClassName="px-4 py-3 text-center">Ra</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {overview.map((r) => (
                  <TableRow key={r.employeeId} borderClassName="border-b border-slate-100 dark:border-slate-700/60 last:border-0">
                    <TableCell layoutClassName="whitespace-nowrap px-4 py-3">
                      <Typography as="span" size="sm" layoutClassName="font-medium" textClassName="text-slate-800 dark:text-slate-100">{r.name}</Typography>
                    </TableCell>
                    <TableCell layoutClassName="whitespace-nowrap px-4 py-3">
                      {r.email ? (
                        <Typography as="span" size="sm" layoutClassName="font-mono" textClassName="text-slate-600 dark:text-slate-300">{r.email}</Typography>
                      ) : (
                        <Badge size="sm" layoutClassName="px-2 py-0.5 text-xs" backgroundClassName="bg-amber-50 dark:bg-amber-900/20" textClassName="text-amber-600 dark:text-amber-400">chưa gắn</Badge>
                      )}
                    </TableCell>
                    <TableCell layoutClassName="whitespace-nowrap px-4 py-3 text-center">
                      <Typography as="span" size="sm" textClassName="text-emerald-600 dark:text-emerald-400">{fmtTime(r.todayIn)}</Typography>
                    </TableCell>
                    <TableCell layoutClassName="whitespace-nowrap px-4 py-3 text-center">
                      <Typography as="span" size="sm" textClassName="text-rose-600 dark:text-rose-400">{fmtTime(r.todayOut)}</Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Box>
      </Card>

      {/* ------- Lịch sử ------- */}
      <Card
        padding="none"
        layoutClassName="overflow-hidden"
        borderClassName="border border-slate-200 dark:border-slate-700"
        backgroundClassName="bg-white dark:bg-slate-800"
      >
        <Box layoutClassName="flex flex-wrap items-end gap-3 px-4 py-3">
          <Heading level={2} textClassName="mr-auto text-base font-bold text-slate-900 dark:text-white">
            Lịch sử chấm công
          </Heading>
          <Field label="Nhân viên" htmlFor="his-emp">
            <Select id="his-emp" value={empFilter} onChange={(e) => setEmpFilter(e.target.value)}>
              <option value="">Tất cả</option>
              {overview.map((r) => (
                <option key={r.employeeId} value={r.employeeId}>{r.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Từ ngày" htmlFor="his-from">
            <Input id="his-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </Field>
          <Field label="Đến ngày" htmlFor="his-to">
            <Input id="his-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </Field>
        </Box>
        <Box layoutClassName="overflow-x-auto">
          {hisLoading ? (
            <Box layoutClassName="p-6"><Spinner size="sm" textClassName="text-primary-500" /></Box>
          ) : !history || history.items.length === 0 ? (
            <EmptyState title="Chưa có bản ghi chấm công." />
          ) : (
            <Table>
              <TableHead backgroundClassName="bg-slate-50 dark:bg-slate-700/60">
                <TableRow textClassName="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  <TableHeaderCell layoutClassName="px-4 py-3">Ảnh</TableHeaderCell>
                  <TableHeaderCell layoutClassName="px-4 py-3">Thời gian</TableHeaderCell>
                  <TableHeaderCell layoutClassName="px-4 py-3">Nhân viên</TableHeaderCell>
                  <TableHeaderCell layoutClassName="px-4 py-3 text-center">Loại</TableHeaderCell>
                  <TableHeaderCell layoutClassName="px-4 py-3 text-center">Ca</TableHeaderCell>
                  <TableHeaderCell layoutClassName="px-4 py-3">IP</TableHeaderCell>
                  <TableHeaderCell layoutClassName="px-4 py-3 text-right">Độ khớp</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {history.items.map((rec) => (
                  <TableRow
                    key={rec.id}
                    borderClassName="border-b border-slate-100 dark:border-slate-700/60 last:border-0"
                    layoutClassName="cursor-pointer"
                    hoverClassName="hover:bg-slate-50 dark:hover:bg-slate-700/40"
                    stateClassName="transition-colors"
                    onClick={() => setDetailRec(rec)}
                  >
                    <TableCell layoutClassName="px-4 py-3">
                      {rec.imageUrl ? (
                        <Box
                          layoutClassName="flex h-12 w-12 items-center justify-center overflow-hidden"
                          roundedClassName="rounded-lg"
                          borderClassName="border border-slate-200 dark:border-slate-600"
                        >
                          <Image src={rec.imageUrl} alt="Ảnh chấm công" layoutClassName="h-full w-full object-cover" />
                        </Box>
                      ) : (
                        <Typography as="span" size="xs" variant="muted">—</Typography>
                      )}
                    </TableCell>
                    <TableCell layoutClassName="whitespace-nowrap px-4 py-3">
                      <Typography as="span" size="sm" textClassName="text-slate-700 dark:text-slate-200">{fmtDateTime(rec.checkedAt)}</Typography>
                    </TableCell>
                    <TableCell layoutClassName="whitespace-nowrap px-4 py-3">
                      <Typography as="span" size="sm" textClassName="text-slate-700 dark:text-slate-200">{rec.employeeName || rec.employeeId}</Typography>
                    </TableCell>
                    <TableCell layoutClassName="whitespace-nowrap px-4 py-3 text-center">
                      <Badge
                        size="sm"
                        layoutClassName="inline-flex px-2 py-0.5 text-xs font-semibold"
                        backgroundClassName={rec.kind === 'in' ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-rose-50 dark:bg-rose-900/20'}
                        textClassName={rec.kind === 'in' ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}
                      >
                        {kindLabel(rec.kind)}
                      </Badge>
                    </TableCell>
                    <TableCell layoutClassName="whitespace-nowrap px-4 py-3 text-center">
                      <Typography as="span" size="sm" textClassName="text-slate-600 dark:text-slate-300">{shiftLabel(rec.shift)}</Typography>
                    </TableCell>
                    <TableCell layoutClassName="whitespace-nowrap px-4 py-3">
                      <Typography as="span" size="xs" layoutClassName="font-mono" textClassName="text-slate-500 dark:text-slate-400">{rec.ip || '—'}</Typography>
                    </TableCell>
                    <TableCell layoutClassName="whitespace-nowrap px-4 py-3 text-right">
                      <Typography as="span" size="xs" layoutClassName="tabular-nums" textClassName="text-slate-500 dark:text-slate-400">
                        {rec.faceDistance != null ? rec.faceDistance.toFixed(3) : '—'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Box>
      </Card>

      {/* ------- Chi tiết 1 bản ghi chấm công (ảnh + thông tin) ------- */}
      <BaseModal
        isOpen={!!detailRec}
        onClose={() => setDetailRec(null)}
        title="Chi tiết chấm công"
        size="md"
      >
        {detailRec && (
          <Box layoutClassName="flex flex-col gap-4">
            {/* Ảnh (bấm để phóng to) */}
            {detailRec.imageUrl ? (
              <Box layoutClassName="flex justify-center">
                <Button
                  type="button"
                  aria-label="Phóng to ảnh chấm công"
                  variant="ghost"
                  disableVariantHover
                  disableVariantTextColor
                  sizeClassName="p-0"
                  roundedClassName="rounded-xl"
                  layoutClassName="overflow-hidden"
                  borderClassName="border border-slate-200 dark:border-slate-600"
                  onClick={() => setPreviewUrl(detailRec.imageUrl)}
                >
                  <Image
                    src={detailRec.imageUrl}
                    alt="Ảnh chấm công"
                    layoutClassName="max-h-64 w-auto object-contain"
                  />
                </Button>
              </Box>
            ) : (
              <Box
                layoutClassName="flex h-32 items-center justify-center"
                backgroundClassName="bg-slate-50 dark:bg-slate-700/40"
                roundedClassName="rounded-xl"
              >
                <Typography as="span" size="sm" variant="muted">Không có ảnh</Typography>
              </Box>
            )}

            {/* Thông tin */}
            <Box layoutClassName="flex flex-col gap-2">
              <Box layoutClassName="flex items-center justify-between gap-4">
                <Typography as="span" size="sm" variant="muted">Nhân viên</Typography>
                <Typography as="span" size="sm" layoutClassName="font-semibold" textClassName="text-slate-800 dark:text-slate-100">
                  {detailRec.employeeName || detailRec.employeeId}
                </Typography>
              </Box>
              <Box layoutClassName="flex items-center justify-between gap-4">
                <Typography as="span" size="sm" variant="muted">Thời gian</Typography>
                <Typography as="span" size="sm" textClassName="text-slate-700 dark:text-slate-200">
                  {fmtDateTime(detailRec.checkedAt)}
                </Typography>
              </Box>
              <Box layoutClassName="flex items-center justify-between gap-4">
                <Typography as="span" size="sm" variant="muted">Loại</Typography>
                <Badge
                  size="sm"
                  layoutClassName="inline-flex px-2 py-0.5 text-xs font-semibold"
                  backgroundClassName={detailRec.kind === 'in' ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-rose-50 dark:bg-rose-900/20'}
                  textClassName={detailRec.kind === 'in' ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}
                >
                  {kindLabel(detailRec.kind)}
                </Badge>
              </Box>
              <Box layoutClassName="flex items-center justify-between gap-4">
                <Typography as="span" size="sm" variant="muted">Ca</Typography>
                <Typography as="span" size="sm" textClassName="text-slate-700 dark:text-slate-200">
                  {shiftLabel(detailRec.shift)}
                </Typography>
              </Box>
              <Box layoutClassName="flex items-center justify-between gap-4">
                <Typography as="span" size="sm" variant="muted">IP</Typography>
                <Typography as="span" size="sm" layoutClassName="font-mono" textClassName="text-slate-600 dark:text-slate-300">
                  {detailRec.ip || '—'}
                </Typography>
              </Box>
              <Box layoutClassName="flex items-center justify-between gap-4">
                <Typography as="span" size="sm" variant="muted">Độ khớp khuôn mặt</Typography>
                <Typography as="span" size="sm" layoutClassName="tabular-nums" textClassName="text-slate-600 dark:text-slate-300">
                  {detailRec.faceDistance != null ? detailRec.faceDistance.toFixed(3) : '—'}
                </Typography>
              </Box>
              {detailRec.note ? (
                <Box layoutClassName="flex items-start justify-between gap-4">
                  <Typography as="span" size="sm" variant="muted">Ghi chú</Typography>
                  <Typography as="span" size="sm" layoutClassName="text-right" textClassName="text-slate-700 dark:text-slate-200">
                    {detailRec.note}
                  </Typography>
                </Box>
              ) : null}
            </Box>
          </Box>
        )}
      </BaseModal>

      {/* Zoom ảnh (mở từ modal chi tiết) — đặt SAU để nổi trên modal chi tiết */}
      <BaseModal
        isOpen={!!previewUrl}
        onClose={() => setPreviewUrl(null)}
        title="Ảnh chấm công"
        size="md"
      >
        {previewUrl && (
          <Box layoutClassName="flex items-center justify-center">
            <Image
              src={previewUrl}
              alt="Ảnh chấm công"
              layoutClassName="max-h-[70vh] w-auto"
              roundedClassName="rounded-lg"
            />
          </Box>
        )}
      </BaseModal>
    </Box>
  );
};

export default ManageTab;
