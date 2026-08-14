import { useEffect, useMemo, useRef, useState, type PointerEvent as PE } from "react";
import {
  AIRPORTS,
  AIRPORT_BY_ID,
  AIR_ROUTES,
  HIGHWAYS,
  MAJOR_HOSPITALS,
  MAP_H,
  MAP_W,
  STATE_SHAPES,
  hospitalsInState,
  type Hospital,
} from "@/lib/geo";
import {
  heatColor,
  metricToT,
  metricValue,
  type MapMetric,
  type StateSim,
} from "@/lib/simulation";
import { cn } from "@/lib/cn";

export type MapLayers = { roads: boolean; air: boolean; hospitals: boolean };

type Props = {
  states: StateSim[] | null;
  metric: MapMetric;
  selected: string | null;
  onSelect: (id: string) => void;
  origin?: string;
  highlight?: Set<string>;
  className?: string;
  animate?: boolean;
  mobility?: number;
  layers?: MapLayers;
  selectedHospital?: string | null;
  onHospital?: (h: Hospital) => void;
  hospitalLoad?: (h: Hospital) => { patients: number; capacity: number };
};

const DEFAULT_LAYERS: MapLayers = { roads: true, air: true, hospitals: true };

const HW_LEN: number[][] = HIGHWAYS.map((hw) => {
  const seg = [0];
  let len = 0;
  for (let i = 1; i < hw.pts.length; i++) {
    len += Math.hypot(hw.pts[i][0] - hw.pts[i - 1][0], hw.pts[i][1] - hw.pts[i - 1][1]);
    seg.push(len);
  }
  return seg;
});

type Stage = { w: number; h: number; left: number; top: number; scale: number };

function fitStage(cw: number, ch: number): Stage {
  const scale = Math.min(cw / MAP_W, ch / MAP_H);
  const w = MAP_W * scale;
  const h = MAP_H * scale;
  return { w, h, left: (cw - w) / 2, top: (ch - h) / 2, scale };
}

export function UsaMap({
  states,
  metric,
  selected,
  onSelect,
  origin,
  highlight,
  className,
  animate = false,
  mobility = 1,
  layers = DEFAULT_LAYERS,
  selectedHospital,
  onHospital,
  hospitalLoad,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [view, setView] = useState({ x: 0, y: 0, k: 1 });
  const [stage, setStage] = useState<Stage>({ w: 0, h: 0, left: 0, top: 0, scale: 1 });
  const drag = useRef<{ id: number; x: number; y: number; vx: number; vy: number } | null>(null);
  const pinch = useRef<{ d: number; k: number } | null>(null);
  const viewRef = useRef(view);
  viewRef.current = view;
  const stageRef = useRef(stage);
  stageRef.current = stage;
  const t0 = useRef(performance.now());
  const moved = useRef(false);

  const byId = useMemo(() => new Map(states?.map((s) => [s.id, s])), [states]);

  const extraHospitals = useMemo(() => {
    if (!selected) return [] as Hospital[];
    const major = new Set(MAJOR_HOSPITALS.map((h) => h.id));
    return hospitalsInState(selected)
      .filter((h) => !major.has(h.id))
      .sort((a, b) => Number(b.e) - Number(a.e) || b.b - a.b)
      .slice(0, 70);
  }, [selected]);

  const shownHospitals = useMemo(
    () => (layers.hospitals ? [...MAJOR_HOSPITALS, ...extraHospitals] : []),
    [layers.hospitals, extraHospitals],
  );

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) return;
      setStage(fitStage(r.width, r.height));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || stage.w < 2) return;
    let raf = 0;
    const palette = readPalette();
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const draw = (now: number) => {
      const t = (now - t0.current) / 1000;
      const st = stageRef.current;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const cssW = st.w;
      const cssH = st.h;
      if (cssW < 2 || cssH < 2) {
        raf = requestAnimationFrame(draw);
        return;
      }
      const pw = Math.round(cssW * dpr);
      const ph = Math.round(cssH * dpr);
      if (canvas.width !== pw || canvas.height !== ph) {
        canvas.width = pw;
        canvas.height = ph;
        canvas.style.width = `${cssW}px`;
        canvas.style.height = `${cssH}px`;
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cssW, cssH);
      ctx.save();
      ctx.scale(st.scale, st.scale);

      if (layers.roads) {
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.strokeStyle = palette.road;
        ctx.lineWidth = 0.7;
        for (const hw of HIGHWAYS) {
          if (hw.pts.length < 2) continue;
          ctx.beginPath();
          ctx.moveTo(hw.pts[0][0], hw.pts[0][1]);
          for (let i = 1; i < hw.pts.length; i++) ctx.lineTo(hw.pts[i][0], hw.pts[i][1]);
          ctx.stroke();
        }
      }

      if (layers.air) {
        for (const rt of AIR_ROUTES) {
          const A = AIRPORT_BY_ID[rt.a];
          const B = AIRPORT_BY_ID[rt.b];
          if (!A || !B) continue;
          const sa = byId.get(A.s);
          const sb = byId.get(B.s);
          const cases = Math.max(sa ? sa.E + sa.I : 0, sb ? sb.E + sb.I : 0);
          const hot = cases > 40;
          ctx.beginPath();
          ctx.moveTo(A.x, A.y);
          const mx = (A.x + B.x) / 2;
          const my = (A.y + B.y) / 2 - Math.hypot(B.x - A.x, B.y - A.y) * 0.16;
          ctx.quadraticCurveTo(mx, my, B.x, B.y);
          ctx.strokeStyle = hot ? palette.airHot : palette.air;
          ctx.lineWidth = 0.55 + rt.w * 1.6;
          ctx.stroke();

          if (animate && !reduce) {
            const n = 1 + Math.round(rt.w * 3 * Math.max(0.35, mobility));
            for (let i = 0; i < n; i++) {
              const u = (t * (0.05 + rt.w * 0.1) * mobility + i / n) % 1;
              const p = quadPoint(A.x, A.y, mx, my, B.x, B.y, u);
              const infected = hot && (i + Math.floor(t * 2.4)) % 3 === 0;
              ctx.fillStyle = infected ? palette.infect : palette.plane;
              ctx.beginPath();
              ctx.arc(p[0], p[1], infected ? 1.8 : 1.25, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }

        for (const ap of AIRPORTS) {
          ctx.fillStyle = palette.hub;
          ctx.beginPath();
          ctx.arc(ap.x, ap.y, ap.hub === "L" ? 2.3 : ap.hub === "M" ? 1.6 : 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      if (layers.roads && animate && !reduce) {
        const stride = mobility > 0.7 ? 2 : 3;
        for (let hi = 0; hi < HIGHWAYS.length; hi += stride) {
          const hw = HIGHWAYS[hi];
          if (hw.pts.length < 3) continue;
          const u = (t * 0.07 * mobility + (hi % 7) / 7) % 1;
          const p = alongCached(hw.pts, HW_LEN[hi], u);
          ctx.fillStyle = palette.car;
          ctx.beginPath();
          ctx.arc(p[0], p[1], 1.15, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore();
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [animate, layers.air, layers.roads, mobility, byId, stage.w, stage.h]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.12 : 0.9;
      setView((v) => ({ ...v, k: Math.min(6, Math.max(1, v.k * factor)) }));
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) e.preventDefault();
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("touchmove", onTouchMove);
    };
  }, []);

  function clientToMap(clientX: number, clientY: number) {
    const wrap = wrapRef.current;
    if (!wrap || stage.scale <= 0) return null;
    const rect = wrap.getBoundingClientRect();
    const cx = rect.left + stage.left + stage.w / 2;
    const cy = rect.top + stage.top + stage.h / 2;
    const s = stage.scale * view.k;
    if (s <= 0) return null;
    const mx = (clientX - cx - view.x) / s + MAP_W / 2;
    const my = (clientY - cy - view.y) / s + MAP_H / 2;
    return { mx, my, scale: s };
  }

  function nearestHospital(mx: number, my: number, scale: number): Hospital | null {
    const thresh = 12 / scale;
    let best: Hospital | null = null;
    let bestD = thresh;
    for (const h of shownHospitals) {
      const d = Math.hypot(h.x - mx, h.y - my);
      if (d < bestD) {
        bestD = d;
        best = h;
      }
    }
    return best;
  }

  function stateAtClient(clientX: number, clientY: number): string | null {
    const svg = svgRef.current;
    if (!svg) return null;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const loc = pt.matrixTransform(ctm.inverse());
    const paths = svg.querySelectorAll<SVGPathElement>("path[data-state]");
    for (const path of paths) {
      try {
        if (path.isPointInFill(loc)) return path.dataset.state ?? null;
      } catch {
        /* some browsers throw on empty paths */
      }
    }
    return null;
  }

  function handleTap(clientX: number, clientY: number) {
    const p = clientToMap(clientX, clientY);
    if (layers.hospitals && onHospital && p) {
      const h = nearestHospital(p.mx, p.my, p.scale);
      if (h) {
        onHospital(h);
        return;
      }
    }
    const id = stateAtClient(clientX, clientY);
    if (id) onSelect(id);
  }

  function onPointerDown(e: PE<HTMLDivElement>) {
    if ((e.target as HTMLElement).closest("[data-pin]")) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* Safari can throw if the pointer is already gone */
    }
    moved.current = false;
    drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, vx: view.x, vy: view.y };
  }

  function onPointerMove(e: PE<HTMLDivElement>) {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (dx * dx + dy * dy > 9) moved.current = true;
    const nx = d.vx + dx;
    const ny = d.vy + dy;
    setView((v) => ({ ...v, x: nx, y: ny }));
  }

  function onPointerUp(e: PE<HTMLDivElement>) {
    if (drag.current && drag.current.id !== e.pointerId) return;
    const tapped = drag.current !== null && !moved.current;
    drag.current = null;
    if (tapped) handleTap(e.clientX, e.clientY);
  }

  function onTouchStart(e: React.TouchEvent) {
    if (e.touches.length === 2) {
      const d = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      );
      pinch.current = { d: d || 1, k: viewRef.current.k };
      drag.current = null;
    }
  }

  function onTouchMovePinch(e: React.TouchEvent) {
    const p = pinch.current;
    if (e.touches.length !== 2 || !p) return;
    const dist = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY,
    );
    const nk = Math.min(6, Math.max(1, p.k * (dist / p.d)));
    setView((v) => ({ ...v, k: nk }));
  }

  function onTouchEnd() {
    pinch.current = null;
  }

  const dirty = view.k > 1.02 || Math.abs(view.x) > 4 || Math.abs(view.y) > 4;

  return (
    <div
      ref={wrapRef}
      className={cn("relative touch-none overflow-hidden", className)}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onLostPointerCapture={onPointerUp}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMovePinch}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
    >
      {stage.w > 0 ? (
        <div
          className="absolute overflow-visible"
          style={{
            width: stage.w,
            height: stage.h,
            left: stage.left,
            top: stage.top,
            transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})`,
            transformOrigin: "center center",
          }}
        >
          <svg
            ref={svgRef}
            viewBox={`0 0 ${MAP_W} ${MAP_H}`}
            preserveAspectRatio="none"
            role="img"
            aria-label="United States outbreak map"
            className="absolute inset-0 z-0 block h-full w-full select-none"
          >
            {STATE_SHAPES.map((sh) => {
              const st = byId.get(sh.id);
              const t = st ? metricToT(metricValue(st, metric), metric) : 0;
              const isSel = selected === sh.id;
              const isOrigin = origin === sh.id;
              const isHi = highlight?.has(sh.id);
              const fill = states
                ? heatColor(t)
                : isOrigin || isHi
                  ? "var(--color-map-2)"
                  : "var(--color-map-0)";
              return (
                <path
                  key={sh.id}
                  data-state={sh.id}
                  d={sh.d}
                  fill={fill}
                  stroke={isSel ? "var(--color-fg)" : "var(--color-bg)"}
                  strokeWidth={isSel ? 1.8 : 0.55}
                  className="cursor-pointer"
                >
                  <title>
                    {`${sh.name}${st ? ` — ${Math.round(st.E + st.I).toLocaleString()} active` : ""}`}
                  </title>
                </path>
              );
            })}
            {shownHospitals.map((h) => {
              const load = hospitalLoad?.(h);
              const overflow = load ? load.patients > load.capacity : false;
              const sel = selectedHospital === h.id;
              const r = sel ? 5 : overflow ? 4 : 3.2;
              return (
                <g key={h.id} data-pin="hospital" className="pointer-events-none">
                  <rect
                    x={h.x - r}
                    y={h.y - r}
                    width={r * 2}
                    height={r * 2}
                    rx={0.6}
                    fill={overflow ? "var(--color-infect)" : sel ? "var(--color-fg)" : "var(--color-warn)"}
                    stroke="var(--color-bg)"
                    strokeWidth={0.6}
                  />
                  <path
                    d={`M ${h.x} ${h.y - r * 0.55} V ${h.y + r * 0.55} M ${h.x - r * 0.55} ${h.y} H ${h.x + r * 0.55}`}
                    stroke={sel ? "var(--color-primary-fg)" : "var(--color-bg)"}
                    strokeWidth={0.7}
                    strokeLinecap="round"
                  />
                  <title>{h.n}</title>
                </g>
              );
            })}
          </svg>
          <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 z-10 block" />
        </div>
      ) : null}
      {dirty ? (
        <button
          type="button"
          data-pin="ui"
          className="absolute bottom-2 left-2 z-20 h-8 rounded-full bg-bg/80 px-3 text-[11px] font-medium text-fg backdrop-blur-sm"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => setView({ x: 0, y: 0, k: 1 })}
        >
          Reset map
        </button>
      ) : null}
    </div>
  );
}

function readPalette() {
  const css = getComputedStyle(document.documentElement);
  const fg = css.getPropertyValue("--color-fg").trim() || "#efe8dc";
  const infect = css.getPropertyValue("--color-infect").trim() || "#b54a3a";
  const warn = css.getPropertyValue("--color-warn").trim() || "#c4a574";
  return {
    road: withAlpha(fg, 0.14),
    air: withAlpha(fg, 0.13),
    airHot: withAlpha(infect, 0.32),
    plane: withAlpha(fg, 0.88),
    infect,
    hub: withAlpha(fg, 0.58),
    car: withAlpha(warn, 0.72),
  };
}

function withAlpha(color: string, a: number): string {
  const hex = color.startsWith("#") ? color.slice(1) : "";
  if (hex.length === 6) {
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${a})`;
  }
  return color;
}

function quadPoint(
  x1: number,
  y1: number,
  cx: number,
  cy: number,
  x2: number,
  y2: number,
  t: number,
): [number, number] {
  const u = 1 - t;
  return [
    u * u * x1 + 2 * u * t * cx + t * t * x2,
    u * u * y1 + 2 * u * t * cy + t * t * y2,
  ];
}

function alongCached(pts: [number, number][], seg: number[], u: number): [number, number] {
  const len = seg[seg.length - 1] || 1;
  const target = u * len;
  for (let i = 1; i < pts.length; i++) {
    if (seg[i] >= target) {
      const span = seg[i] - seg[i - 1] || 1;
      const f = (target - seg[i - 1]) / span;
      return [
        pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * f,
        pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * f,
      ];
    }
  }
  return pts[pts.length - 1];
}
