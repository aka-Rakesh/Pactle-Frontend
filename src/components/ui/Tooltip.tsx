import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const anchorRef = useRef<HTMLDivElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  const updatePosition = () => {
    const el = anchorRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const spacing = 8;
    const tEl = tooltipRef.current;
    const tWidth = tEl?.offsetWidth || 200;
    const tHeight = tEl?.offsetHeight || 36;

    let top = 0;
    let left = 0;

    if (position === 'bottom') {
      top = rect.bottom + spacing;
      left = rect.left + rect.width / 2 - tWidth / 2;
    } else if (position === 'left') {
      top = rect.top + rect.height / 2 - tHeight / 2;
      left = rect.left - spacing - tWidth;
    } else if (position === 'right') {
      top = rect.top + rect.height / 2 - tHeight / 2;
      left = rect.right + spacing;
    } else {
      top = rect.top - spacing - tHeight;
      left = rect.left + rect.width / 2 - tWidth / 2;
    }

    // Clamp within viewport
    const maxLeft = Math.max(8, Math.min(left, window.innerWidth - tWidth - 8));
    const maxTop = Math.max(8, Math.min(top, window.innerHeight - tHeight - 8));
    setCoords({ top: maxTop, left: maxLeft });
  };

  useEffect(() => {
    if (!isVisible) return;
    updatePosition();
    const onScrollOrResize = () => updatePosition();
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [isVisible, position]);

  const tooltipNode =
    isVisible && coords
      ? createPortal(
          <div
            className="fixed z-50 pointer-events-none"
            style={{ top: coords.top, left: coords.left }}
          >
            <div
              ref={tooltipRef}
              className="relative px-2 py-1 text-xs text-black bg-white border border-border-dark rounded shadow-sm max-w-[280px] break-words whitespace-normal"
            >
              {content}
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <div
      ref={anchorRef}
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {tooltipNode}
    </div>
  );
};