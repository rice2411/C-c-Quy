import React, { useRef, useState } from 'react';
import Box from '@/components/ui/Box';
import { DiningTable, tableStatus } from '@/types';

/**
 * Sơ đồ quán vẽ bằng SVG theo tỉ lệ mặt bằng (362cm × 450cm → viewBox 100 × 124).
 * Bàn định vị bằng toạ độ chuẩn hoá posX/posY (0..1); màu theo trạng thái
 * (trống = xanh, đang ngồi = hổ phách). Chế độ sửa (editMode) cho kéo-thả bàn.
 *
 * Dùng thuộc tính SVG (fill/stroke) + style thay cho className: (1) SVG element không
 * nhận prop *ClassName của UI convention, (2) tránh scan_page_classname gắn className
 * lowercase-tag vào Box bao ngoài. Map là "bản vẽ trên thẻ trắng" — đọc tốt cả 2 theme.
 */

const VW = 100; // viewBox width
const VH = 124; // viewBox height (giữ tỉ lệ 362:450)

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

// Bảng màu cố định (đọc tốt trên nền thẻ trắng ở cả light/dark).
const C = {
  wall: '#94a3b8',
  paper: '#ffffff',
  room: '#f1f5f9',
  roomStroke: '#cbd5e1',
  sink: '#f0f9ff',
  sinkStroke: '#7dd3fc',
  counter: '#e2e8f0',
  kitchen: '#fff7ed',
  kitchenStroke: '#fdba74',
  partition: '#cbd5e1',
  label: '#64748b',
  amber: '#d97706',
  emerald: '#059669',
  sky: '#0ea5e9',
  orange: '#ea580c',
  doorBack: '#f59e0b',
  doorFront: '#10b981',
  doorWindow: '#38bdf8',
  tableFree: '#34d399',
  tableFreeStroke: '#059669',
  tableBusy: '#fbbf24',
  tableBusyStroke: '#d97706',
};

interface FloorMapProps {
  tables: DiningTable[];
  editMode?: boolean;
  onTableClick?: (t: DiningTable) => void;
  onMoveTable?: (id: string, posX: number, posY: number) => void;
}

const FloorMap: React.FC<FloorMapProps> = ({
  tables,
  editMode = false,
  onTableClick,
  onMoveTable,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [drag, setDrag] = useState<{ id: string; posX: number; posY: number } | null>(null);

  const toNorm = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    return {
      posX: clamp01((clientX - rect.left) / rect.width),
      posY: clamp01((clientY - rect.top) / rect.height),
    };
  };

  const onPointerDown = (e: React.PointerEvent, t: DiningTable) => {
    if (!editMode) return;
    e.stopPropagation();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    setDrag({ id: t.id, posX: t.posX, posY: t.posY });
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag) return;
    const p = toNorm(e.clientX, e.clientY);
    if (p) setDrag({ id: drag.id, ...p });
  };
  const onPointerUp = () => {
    if (drag) {
      onMoveTable?.(drag.id, drag.posX, drag.posY);
      setDrag(null);
    }
  };

  return (
    <Box
      layoutClassName="w-full overflow-hidden"
      backgroundClassName="bg-white"
      borderClassName="border border-slate-200 dark:border-slate-700"
      roundedClassName="rounded-xl"
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VW} ${VH}`}
        style={{ width: '100%', height: 'auto', touchAction: 'none', userSelect: 'none', display: 'block' }}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        {/* Khung tường ngoài */}
        <rect x="2" y="2" width="96" height="120" rx="1" fill={C.paper} stroke={C.wall} strokeWidth="0.8" />

        {/* Nhà vệ sinh (trên phải) */}
        <rect x="46" y="2" width="52" height="16" fill={C.room} stroke={C.roomStroke} strokeWidth="0.4" />
        <text x="72" y="11" textAnchor="middle" fill={C.label} fontSize="3.4">Nhà vệ sinh</text>

        {/* Bồn rửa mặt (trên trái) */}
        <rect x="6" y="4" width="14" height="12" rx="6" fill={C.sink} stroke={C.sinkStroke} strokeWidth="0.4" />
        <text x="13" y="22" textAnchor="middle" fill={C.label} fontSize="2.6">Bồn rửa</text>

        {/* Cửa sau (giữa trên) */}
        <line x1="33" y1="18" x2="45" y2="18" stroke={C.doorBack} strokeWidth="1.2" />
        <text x="39" y="24" textAnchor="middle" fill={C.amber} fontSize="2.6">Cửa sau</text>

        {/* Bếp / quầy bếp (phải dưới, hình chữ L) */}
        <rect x="52" y="56" width="46" height="6" fill={C.counter} stroke={C.roomStroke} strokeWidth="0.3" />
        <rect x="80" y="56" width="18" height="52" fill={C.kitchen} stroke={C.kitchenStroke} strokeWidth="0.4" />
        <rect x="52" y="62" width="10" height="40" fill={C.kitchen} stroke={C.kitchenStroke} strokeWidth="0.4" />
        <text x="70" y="76" textAnchor="middle" fill={C.orange} fontSize="3.4">Quầy bếp</text>
        <text x="89" y="86" textAnchor="middle" fill={C.orange} fontSize="3">Bếp</text>

        {/* Vách ngăn trong (Tường) */}
        <rect x="14" y="60" width="16" height="3.4" fill={C.partition} />
        <text x="22" y="62.6" textAnchor="middle" fill={C.label} fontSize="2.2">Tường</text>

        {/* Cửa chính (dưới trái) */}
        <line x1="20" y1="122" x2="40" y2="122" stroke={C.doorFront} strokeWidth="1.4" />
        <text x="30" y="119" textAnchor="middle" fill={C.emerald} fontSize="2.8">Cửa chính</text>

        {/* Cửa sổ (dưới giữa) */}
        <line x1="50" y1="122" x2="68" y2="122" stroke={C.doorWindow} strokeWidth="1.2" strokeDasharray="2 1.5" />
        <text x="59" y="119" textAnchor="middle" fill={C.sky} fontSize="2.6">Cửa sổ</text>

        {/* Bàn */}
        {tables.map((t) => {
          const isDragging = drag?.id === t.id;
          const posX = isDragging ? drag!.posX : t.posX;
          const posY = isDragging ? drag!.posY : t.posY;
          const cx = posX * VW;
          const cy = posY * VH;
          const occupied = tableStatus(t) === 'occupied';
          const W = 15;
          const H = 12;
          return (
            <g
              key={t.id}
              transform={`translate(${cx - W / 2} ${cy - H / 2})`}
              style={{ cursor: editMode ? 'move' : 'pointer' }}
              onPointerDown={(e) => onPointerDown(e, t)}
              onClick={() => {
                if (!editMode) onTableClick?.(t);
              }}
            >
              <rect
                x="0" y="0" width={W} height={H} rx="1.6"
                fill={occupied ? C.tableBusy : C.tableFree}
                stroke={occupied ? C.tableBusyStroke : C.tableFreeStroke}
                strokeWidth="0.5"
              />
              <text
                x={W / 2} y="5" textAnchor="middle"
                fill="#ffffff" fontSize="3.4" fontWeight="600"
                style={{ pointerEvents: 'none' }}
              >
                {t.name}
              </text>
              <text
                x={W / 2} y="9.4" textAnchor="middle"
                fill="#ffffff" fontSize="2.6"
                style={{ pointerEvents: 'none', opacity: 0.9 }}
              >
                {occupied ? `${t.currentOrder?.guestCount ?? '?'} khách` : `${t.seats} ghế`}
              </text>
            </g>
          );
        })}
      </svg>
    </Box>
  );
};

export default FloorMap;
