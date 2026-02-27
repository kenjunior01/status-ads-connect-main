import { useEffect, useRef, useState } from "react";

export const CountUp = ({ value, duration = 800 }: { value: number; duration?: number }) => {
  const [display, setDisplay] = useState(0);
  const start = useRef(0);
  const from = useRef(0);
  const to = useRef(value);
  const raf = useRef<number | null>(null);
  const current = useRef(0);

  useEffect(() => {
    from.current = current.current;
    to.current = value;
    start.current = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = Math.round(from.current + (to.current - from.current) * eased);
      setDisplay(next);
      current.current = next;
      if (progress < 1) {
        raf.current = requestAnimationFrame(tick);
      }
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [value, duration]);

  return <span>{display.toLocaleString()}</span>;
};
