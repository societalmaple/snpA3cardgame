import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
}

/**
 * Renders its children on a single line, shrinking the font when the text would
 * overflow the card instead of letting it wrap. The CSS class keeps its own
 * em-relative font size; this component only scales it further via `calc(1em * scale)`,
 * so font-scale changes (e.g. OpenDyslexic) stay proportional.
 */
export function FitText({ children, className }: Props) {
  const innerRef = useRef<HTMLSpanElement>(null);
  const scaleRef = useRef(1);
  const [scale, setScale] = useState(1);

  const fit = useCallback(() => {
    const el = innerRef.current;
    if (!el) return;
    const width = el.clientWidth;
    if (width <= 0) return;
    el.style.fontSize = '';
    const natural = el.scrollWidth;
    el.style.fontSize = `calc(1em * ${scaleRef.current})`;
    const next = natural > width ? Math.max(0.1, width / natural) : 1;
    if (Math.abs(next - scaleRef.current) > 0.002) {
      scaleRef.current = next;
      setScale(next);
    }
  }, []);

  // Re-measure after every render so font swaps, late-loaded webfonts, and
  // content changes (new card instances) always end up fitting.
  useEffect(() => {
    fit();
  });

  // Watch for container resizes (window, card row wrapping, orientation).
  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(fit);
    observer.observe(el);
    window.addEventListener('resize', fit);
    document.fonts?.ready.then(fit).catch(() => {});
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', fit);
    };
  }, [fit]);

  return (
    <span className={className} style={{ display: 'block', width: '100%', minWidth: 0 }}>
      <span
        ref={innerRef}
        style={{ fontSize: `calc(1em * ${scale})`, whiteSpace: 'nowrap', overflowWrap: 'normal', display: 'block', width: '100%', overflow: 'hidden' }}
      >
        {children}
      </span>
    </span>
  );
}
