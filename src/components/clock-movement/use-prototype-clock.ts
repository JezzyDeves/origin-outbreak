import { useCallback, useEffect, useRef, useState } from "react";
import {
  CAP_DAY,
  CLOCK_RATES,
  SIM_STEP_SECONDS,
  START_DAY,
  rateSpec,
  wallSecondsPerStep,
  type ClockRateId,
} from "@/lib/prototype-clock-movement";

const CAP_SECONDS = CAP_DAY * SIM_STEP_SECONDS;

export function usePrototypeClock() {
  const [rate, setRate] = useState<ClockRateId>("hour");
  const [playing, setPlaying] = useState(true);
  const [simSeconds, setSimSeconds] = useState(START_DAY * SIM_STEP_SECONDS);
  const secondsRef = useRef(simSeconds);
  const rateRef = useRef(rate);
  const playingRef = useRef(playing);
  secondsRef.current = simSeconds;
  rateRef.current = rate;
  playingRef.current = playing;

  useEffect(() => {
    if (!playing) {
      setSimSeconds(secondsRef.current);
      return;
    }
    let last = performance.now();
    let shown = 0;
    let raf = 0;
    const loop = (t: number) => {
      const dt = Math.min(0.08, (t - last) / 1000);
      last = t;
      const spec = rateSpec(rateRef.current);
      let next = secondsRef.current + dt * spec.simPerWall;
      if (next >= CAP_SECONDS) {
        next = CAP_SECONDS;
        setPlaying(false);
      }
      secondsRef.current = next;
      shown += dt;
      if (shown >= 0.2 || next >= CAP_SECONDS) {
        shown = 0;
        setSimSeconds(next);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  const clamp = useCallback((s: number) => {
    const next = Math.max(0, Math.min(CAP_SECONDS, s));
    secondsRef.current = next;
    setSimSeconds(next);
    if (next >= CAP_SECONDS) setPlaying(false);
  }, []);

  const skipWeek = useCallback(() => clamp(secondsRef.current + 7 * SIM_STEP_SECONDS), [clamp]);
  const stepDay = useCallback(() => clamp(secondsRef.current + SIM_STEP_SECONDS), [clamp]);

  const day = Math.floor(simSeconds / SIM_STEP_SECONDS);
  const phase = (simSeconds % SIM_STEP_SECONDS) / SIM_STEP_SECONDS;
  const hourOfDay = phase * 24;
  const capped = day >= CAP_DAY;

  return {
    rate,
    setRate,
    playing: playing && !capped,
    setPlaying,
    togglePlaying: () => setPlaying((p) => !p && !capped),
    day,
    phase,
    hourOfDay,
    simSeconds,
    secondsRef,
    rateRef,
    playingRef,
    wallSecondsPerStep: wallSecondsPerStep(rate),
    skipWeek,
    stepDay,
    capped,
    rates: CLOCK_RATES,
  };
}

export type PrototypeClock = ReturnType<typeof usePrototypeClock>;
