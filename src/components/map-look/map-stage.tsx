import { useEffect, useRef, useState, type PointerEvent as PE, type ReactNode } from "react";
import { MAP_H, MAP_W, STATE_SHAPES } from "@/lib/geo";
import { cn } from "@/lib/cn";

type Stage = { w: number; h: number; left: number; top: number; scale: number };

function fitStage(cw: number, ch: number): Stage {
  const scale = Math.min(cw / MAP_W, ch / MAP_H);
  const w = MAP_W * scale;
  const h = MAP_H * scale;
  return { w, h, left: (cw - w) / 2, top: (ch - h) / 2, scale };
}

export type MapCamera = { x: number; y: number; k: number };

type Props = {
  className?: string;
  focus?: { x: number; y: number; k: number };
  drawCanvas?: (ctx: CanvasRenderingContext2D) => void;
  children: ReactNode;
  onTap: (mx: number, my: number, stateId: string | null, scale: number) => void;
  onCamera?: (cam: MapCamera) => void;
};

export function MapStage({ className, focus, drawCanvas, children, onTap, onCamera }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [stage, setStage] = useState<Stage>({ w: 0, h: 0, left: 0, top: 0, scale: 1 });
  const [view, setView] = useState<MapCamera>({ x: 0, y: 0, k: 1 });
  const drag = useRef<{ id: number; x: number; y: number; vx: number; vy: number } | null>(null);
  const pinch = useRef<{ d: number; k: number } | null>(null);
  const moved = useRef(false);
  const viewRef = useRef(view);
  viewRef.current = view;
  const stageRef = useRef(stage);
  stageRef.current = stage;
  const userMoved = useRef(false);
  const tapRef = useRef(onTap);
  tapRef.current = onTap;

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
    userMoved.current = false;
    if (!focus) {
      setView({ x: 0, y: 0, k: 1 });
      return;
    }
    const st = stageRef.current;
    if (st.scale <= 0) return;
    setView({
      k: focus.k,
      x: (MAP_W / 2 - focus.x) * st.scale * focus.k,
      y: (MAP_H / 2 - focus.y) * st.scale * focus.k,
    });
  }, [focus?.x, focus?.y, focus?.k, stage.scale]);

  useEffect(() => {
    onCamera?.(view);
  }, [view, onCamera]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || stage.w < 2 || !drawCanvas) return;
    let raf = 0;
    const draw = () => {
      const st = stageRef.current;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const pw = Math.round(st.w * dpr);
      const ph = Math.round(st.h * dpr);
      if (canvas.width !== pw || canvas.height !== ph) {
        canvas.width = pw;
        canvas.height = ph;
        canvas.style.width = `${st.w}px`;
        canvas.style.height = `${st.h}px`;
      }
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, st.w, st.h);
        ctx.save();
        ctx.scale(st.scale, st.scale);
        drawCanvas(ctx);
        ctx.restore();
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [drawCanvas, stage.w, stage.h]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      userMoved.current = true;
      const factor = e.deltaY < 0 ? 1.12 : 0.9;
      setView((v) => ({ ...v, k: Math.min(8, Math.max(1, v.k * factor)) }));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
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
        /* empty */
      }
    }
    return null;
  }

  function onPointerDown(e: PE<HTMLDivElement>) {
    if ((e.target as HTMLElement).closest("[data-pin]")) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* */
    }
    moved.current = false;
    drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, vx: view.x, vy: view.y };
  }

  function onPointerMove(e: PE<HTMLDivElement>) {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (dx * dx + dy * dy > 9) {
      moved.current = true;
      userMoved.current = true;
    }
    setView((v) => ({ ...v, x: d.vx + dx, y: d.vy + dy }));
  }

  function onPointerUp(e: PE<HTMLDivElement>) {
    if (drag.current && drag.current.id !== e.pointerId) return;
    const tapped = drag.current !== null && !moved.current;
    drag.current = null;
    if (!tapped) return;
    const p = clientToMap(e.clientX, e.clientY);
    const sid = stateAtClient(e.clientX, e.clientY);
    if (p) tapRef.current(p.mx, p.my, sid, p.scale);
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
    userMoved.current = true;
    setView((v) => ({ ...v, k: Math.min(8, Math.max(1, p.k * (dist / p.d))) }));
  }

  const dirty = view.k > 1.02 || Math.abs(view.x) > 4 || Math.abs(view.y) > 4;

  return (
    <div
      ref={wrapRef}
      className={cn("absolute inset-0 touch-none overflow-hidden", className)}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onLostPointerCapture={onPointerUp}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMovePinch}
      onTouchEnd={() => {
        pinch.current = null;
      }}
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
            className="absolute inset-0 z-0 block h-full w-full select-none"
            role="img"
            aria-label="United States Places and Corridors prototype"
          >
            {STATE_SHAPES.map((sh) => (
              <path key={sh.id} data-state={sh.id} d={sh.d} fill="transparent" />
            ))}
            {children}
          </svg>
          {drawCanvas ? (
            <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 z-10 block" />
          ) : null}
        </div>
      ) : null}
      {dirty ? (
        <button
          type="button"
          data-pin="ui"
          className="absolute bottom-2 left-2 z-20 h-8 rounded-full bg-bg/80 px-3 text-[11px] font-medium text-fg backdrop-blur-sm"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => {
            userMoved.current = false;
            if (!focus) {
              setView({ x: 0, y: 0, k: 1 });
              return;
            }
            const st = stageRef.current;
            setView({
              k: focus.k,
              x: (MAP_W / 2 - focus.x) * st.scale * focus.k,
              y: (MAP_H / 2 - focus.y) * st.scale * focus.k,
            });
          }}
        >
          Reset map
        </button>
      ) : null}
    </div>
  );
}

export { STATE_SHAPES };
