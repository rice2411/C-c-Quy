import React, { useRef, useState } from 'react';
import Box from '@/components/ui/Box';
import { DiningTable, tableStatus } from '@/types';
import { fmtDuration, useNowTick } from './time';

/**
 * Sơ đồ quán vẽ bằng SVG theo ĐÚNG mặt bằng thật (362cm × 450cm → dùng luôn cm làm
 * đơn vị viewBox). Vẽ lại: bồn rửa, nhà vệ sinh, cửa sau/cửa chính (vòng cung mở cửa),
 * cửa sổ (ô kẻ), quầy bếp chữ U, các vách "Tường" + nhãn kích thước — giống ảnh gốc.
 * Bàn định vị bằng toạ độ chuẩn hoá posX/posY (0..1); màu theo trạng thái.
 *
 * Dùng thuộc tính SVG (fill/stroke) + style thay className: (1) SVG element không nhận
 * prop *ClassName, (2) tránh scan_page_classname gắn className lowercase-tag vào Box ngoài.
 */

const VW = 362; // cm — chiều ngang
const VH = 450; // cm — chiều dọc

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

const C = {
  paper: '#ffffff',
  wall: '#334155', // tường ngoài (đậm)
  wallFill: '#cbd5e1', // vách trong (đặc)
  fixture: '#f1f5f9',
  fixtureStroke: '#94a3b8',
  sink: '#eff6ff',
  sinkStroke: '#60a5fa',
  kitchen: '#fff7ed',
  kitchenStroke: '#fb923c',
  door: '#475569',
  hatch: '#94a3b8',
  label: '#334155',
  dim: '#94a3b8',
  amber: '#b45309',
  emerald: '#047857',
  tableFree: '#34d399',
  tableFreeStroke: '#059669',
  tableBusy: '#fbbf24',
  tableBusyStroke: '#b45309',
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
  const now = useNowTick(1000);
  const [drag, setDrag] = useState<{ id: string; posX: number; posY: number } | null>(null);

  const toNorm = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    // viewBox có margin: map theo vùng khung tường (0..VW, 0..VH) trong ảnh render.
    const vbX = -16, vbY = -10, vbW = 394, vbH = 520;
    const vx = vbX + ((clientX - rect.left) / rect.width) * vbW;
    const vy = vbY + ((clientY - rect.top) / rect.height) * vbH;
    return { posX: clamp01(vx / VW), posY: clamp01(vy / VH) };
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
        viewBox="-16 -10 394 520"
        style={{ width: '100%', height: 'auto', touchAction: 'none', userSelect: 'none', display: 'block' }}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <defs>
          <pattern id="cq-hatch" patternUnits="userSpaceOnUse" width="7" height="7" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="7" stroke={C.hatch} strokeWidth="1.2" />
          </pattern>
        </defs>

        {/* ── Tường ngoài ── */}
        <rect x="0" y="0" width={VW} height={VH} fill={C.paper} stroke={C.wall} strokeWidth="4" />

        {/* ── Vách ngăn ngang trên (phân tách WC/bồn rửa với phòng), dày ~10cm ── */}
        <rect x="0" y="112" width="120" height="10" fill={C.wallFill} />          {/* stub 53cm + tường bồn rửa */}
        <rect x="116" y="112" width="4" height="24" fill={C.wallFill} />           {/* jamb trái cửa sau */}
        <rect x="175" y="112" width="187" height="10" fill={C.wallFill} />         {/* stub 153cm (trước WC) */}
        <rect x="173" y="112" width="4" height="24" fill={C.wallFill} />           {/* jamb phải cửa sau */}

        {/* Cửa sau (vòm mở) */}
        <path d="M120,134 Q147,192 175,134" fill="none" stroke={C.door} strokeWidth="2" />

        {/* Vách trái WC (có ô cửa) */}
        <line x1="175" y1="0" x2="175" y2="60" stroke={C.wallFill} strokeWidth="4" />
        <line x1="175" y1="90" x2="175" y2="112" stroke={C.wallFill} strokeWidth="4" />
        {/* 2 vạch cửa WC treo từ trần (như ảnh) */}
        <line x1="215" y1="0" x2="215" y2="16" stroke={C.wallFill} strokeWidth="3" />
        <line x1="215" y1="40" x2="215" y2="56" stroke={C.wallFill} strokeWidth="3" />

        {/* Bồn rửa mặt (nửa bầu dục, mở sang phải) */}
        <path d="M92,26 A34,40 0 0 0 92,106" fill={C.sink} stroke={C.sinkStroke} strokeWidth="2" />
        <text x="70" y="66" textAnchor="middle" fill={C.label} fontSize="11"
          transform="rotate(-90 70 66)">Bồn rửa mặt</text>

        {/* Nhà vệ sinh */}
        <text x="272" y="60" textAnchor="middle" fill={C.label} fontSize="13">Nhà vệ sinh</text>

        {/* ── Vách "Tường" 70cm (trái giữa), dày 17cm ── */}
        <rect x="0" y="250" width="70" height="17" fill={C.wallFill} stroke={C.fixtureStroke} strokeWidth="0.5" />

        {/* ── Bếp (phải giữa–dưới): vách + quầy bếp chữ U ── */}
        <rect x="130" y="250" width="170" height="16" fill={C.wallFill} stroke={C.fixtureStroke} strokeWidth="0.5" />
        {/* cạnh trái bếp chạy xuống */}
        <rect x="130" y="266" width="9" height="124" fill={C.wallFill} />
        {/* quầy bếp */}
        <rect x="175" y="290" width="125" height="140" fill={C.kitchen} stroke={C.kitchenStroke} strokeWidth="1.5" />
        <text x="252" y="286" textAnchor="middle" fill={C.amber} fontSize="11">bếp</text>
        <text x="235" y="366" textAnchor="middle" fill={C.amber} fontSize="12">quầy bếp</text>
        <text x="291" y="360" textAnchor="middle" fill={C.amber} fontSize="11"
          transform="rotate(-90 291 360)">Bếp</text>

        {/* ── Cửa chính (2 cánh, vòng cung mở vào phòng) ── */}
        <line x1="78" y1="450" x2="78" y2="410" stroke={C.door} strokeWidth="2" />
        <line x1="158" y1="450" x2="158" y2="410" stroke={C.door} strokeWidth="2" />
        <path d="M118,450 A40,40 0 0 0 78,410" fill="none" stroke={C.door} strokeWidth="2" />
        <path d="M118,450 A40,40 0 0 1 158,410" fill="none" stroke={C.door} strokeWidth="2" />

        {/* ── Tường 10cm (stub đứng gần cửa sổ) ── */}
        <rect x="201" y="415" width="10" height="35" fill={C.wallFill} />

        {/* ── Cửa sổ (ô kẻ) ── */}
        <rect x="238" y="435" width="62" height="14" fill="url(#cq-hatch)" stroke={C.fixtureStroke} strokeWidth="1" />
        <line x1="269" y1="435" x2="269" y2="449" stroke={C.fixtureStroke} strokeWidth="1" />

        {/* ── Nhãn phòng/cửa (giữ tên khu vực, đã bỏ nhãn kích thước cm) ── */}
        <text x="147" y="176" textAnchor="middle" fill={C.label} fontSize="11">Cửa sau</text>
        <text x="118" y="474" textAnchor="middle" fill={C.label} fontSize="11">Cửa chính</text>
        <text x="269" y="474" textAnchor="middle" fill={C.label} fontSize="11">Cửa sổ</text>

        {/* ── Bàn ── */}
        {tables.map((t) => {
          const isDragging = drag?.id === t.id;
          const posX = isDragging ? drag!.posX : t.posX;
          const posY = isDragging ? drag!.posY : t.posY;
          const cx = posX * VW;
          const cy = posY * VH;
          const occupied = tableStatus(t) === 'occupied';
          const W = 58;
          const H = 44;
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
                x="0" y="0" width={W} height={H} rx="5"
                fill={occupied ? C.tableBusy : C.tableFree}
                stroke={occupied ? C.tableBusyStroke : C.tableFreeStroke}
                strokeWidth="1.5"
              />
              <text x={W / 2} y="20" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="700"
                style={{ pointerEvents: 'none' }}>{t.name}</text>
              <text x={W / 2} y="34" textAnchor="middle" fill="#ffffff" fontSize="10"
                style={{ pointerEvents: 'none', opacity: 0.95 }}>
                {occupied
                  ? `${t.currentOrder?.guestCount ?? '?'}k · ${fmtDuration(t.currentOrder?.seatedAt, now)}`
                  : `${t.seats} ghế`}
              </text>
            </g>
          );
        })}
      </svg>
    </Box>
  );
};

export default FloorMap;
