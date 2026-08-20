import { useCallback, useLayoutEffect, useRef } from 'react';

interface Props {
  text: string;
  className?: string;
}

/**
 * Renders text so that individual words which would overflow the card are
 * shrunk to fit, while every other word keeps its natural size. Words still
 * wrap at spaces between words; only a word wider than the card is scaled.
 *
 * Works with any font (including OpenDyslexic): sizes are measured from the
 * actual rendered glyphs, so wider fonts automatically get shrunk more.
 */
export function FitWords({ text, className }: Props) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);

  const fit = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const cs = getComputedStyle(container);
    const padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
    const borderX = parseFloat(cs.borderLeftWidth) + parseFloat(cs.borderRightWidth);
    const avail = container.clientWidth - padX - borderX;
    if (avail <= 0) return;
    for (const word of wordRefs.current) {
      if (!word) continue;
      word.style.fontSize = '';
      const natural = word.offsetWidth;
      if (natural > avail) {
        const size = parseFloat(getComputedStyle(word).fontSize);
        word.style.fontSize = `${(size * (avail / natural)).toFixed(2)}px`;
      }
    }
  }, []);

  // Re-measure after every render so font swaps, late-loaded webfonts, and
  // content changes (new card instances) always end up fitting.
  useLayoutEffect(() => {
    fit();
  });

  // Watch for container resizes (window, card row wrapping, orientation) and
  // re-fit once all webfonts (e.g. OpenDyslexic) have finished loading.
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(fit);
    ro.observe(container);
    window.addEventListener('resize', fit);
    document.fonts?.ready.then(fit).catch(() => {});
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', fit);
    };
  }, [fit]);

  const words = text.split(/\s+/).filter(Boolean);
  wordRefs.current.length = words.length;

  return (
    <span ref={containerRef} className={className} style={{ display: 'block', width: '100%', minWidth: 0 }}>
      {words.flatMap((word, i) => [
        i > 0 ? ' ' : '',
        <span
          key={i}
          ref={(el) => {
            wordRefs.current[i] = el;
          }}
          style={{ display: 'inline-block', whiteSpace: 'nowrap' }}
        >
          {word}
        </span>,
      ])}
    </span>
  );
}