'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { X, ChevronRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export interface CoachMarkStep {
  targetSelector: string;
  title: string;
  description: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

export interface CoachMarksProps {
  steps: CoachMarkStep[];
  tourId: string;
  isActive: boolean;
  onComplete: () => void;
  onStepChange?: (stepIndex: number) => void;
}

type Rect = {
  top: number;
  left: number;
  width: number;
  height: number;
  bottom: number;
  right: number;
};

type Placement = 'top' | 'bottom' | 'left' | 'right';

const BUBBLE_GAP = 16;
const BUBBLE_MAX_WIDTH = 320;
const SPOTLIGHT_PADDING = 8;
const SPOTLIGHT_RADIUS = 12;

function resolveTargetRect(selector: string): Rect | null {
  const el = document.querySelector(`[data-coach-mark="${selector}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return {
    top: r.top + window.scrollY,
    left: r.left + window.scrollX,
    width: r.width,
    height: r.height,
    bottom: r.bottom + window.scrollY,
    right: r.right + window.scrollX,
  };
}

function resolvePlacement(
  preferred: Placement,
  targetRect: Rect,
  bubbleWidth: number,
  bubbleHeight: number,
): Placement {
  const viewW = window.innerWidth;
  const viewH = window.innerHeight;
  const scrollY = window.scrollY;
  const vTop = targetRect.top - scrollY;
  const vBottom = targetRect.bottom - scrollY;

  const fits: Record<Placement, boolean> = {
    top: vTop - BUBBLE_GAP - bubbleHeight > 0,
    bottom: vBottom + BUBBLE_GAP + bubbleHeight < viewH,
    left: targetRect.left - BUBBLE_GAP - bubbleWidth > 0,
    right: targetRect.right + BUBBLE_GAP + bubbleWidth < viewW,
  };

  if (fits[preferred]) return preferred;
  const fallbacks: Placement[] = ['bottom', 'top', 'right', 'left'];
  for (const fb of fallbacks) {
    if (fits[fb]) return fb;
  }
  return 'bottom';
}

function computeBubblePosition(
  placement: Placement,
  targetRect: Rect,
  bubbleWidth: number,
  bubbleHeight: number,
): { top: number; left: number } {
  switch (placement) {
    case 'top':
      return {
        top: targetRect.top - BUBBLE_GAP - bubbleHeight,
        left: targetRect.left + targetRect.width / 2 - bubbleWidth / 2,
      };
    case 'bottom':
      return {
        top: targetRect.bottom + BUBBLE_GAP,
        left: targetRect.left + targetRect.width / 2 - bubbleWidth / 2,
      };
    case 'left':
      return {
        top: targetRect.top + targetRect.height / 2 - bubbleHeight / 2,
        left: targetRect.left - BUBBLE_GAP - bubbleWidth,
      };
    case 'right':
      return {
        top: targetRect.top + targetRect.height / 2 - bubbleHeight / 2,
        left: targetRect.right + BUBBLE_GAP,
      };
  }
}

function clampPosition(
  pos: { top: number; left: number },
  bubbleWidth: number,
): { top: number; left: number } {
  const margin = 12;
  return {
    top: Math.max(margin + window.scrollY, pos.top),
    left: Math.max(margin, Math.min(pos.left, window.innerWidth - bubbleWidth - margin)),
  };
}

function SpotlightOverlay({ targetRect }: { targetRect: Rect | null }) {
  if (!targetRect) return null;

  const pad = SPOTLIGHT_PADDING;
  const r = SPOTLIGHT_RADIUS;
  const x = targetRect.left - pad - window.scrollX;
  const y = targetRect.top - pad - window.scrollY;
  const w = targetRect.width + pad * 2;
  const h = targetRect.height + pad * 2;

  return (
    <svg
      className="pointer-events-none fixed inset-0 z-[9998] h-full w-full"
      aria-hidden="true"
    >
      <defs>
        <mask id="coach-mark-mask">
          <rect x="0" y="0" width="100%" height="100%" fill="white" />
          <rect x={x} y={y} width={w} height={h} rx={r} ry={r} fill="black" />
        </mask>
      </defs>
      <rect
        x="0"
        y="0"
        width="100%"
        height="100%"
        fill="rgba(0, 0, 0, 0.5)"
        mask="url(#coach-mark-mask)"
      />
    </svg>
  );
}

function ArrowSvg({
  placement,
  style,
}: {
  placement: Placement;
  style: React.CSSProperties;
}) {
  const rotations: Record<Placement, string> = {
    bottom: 'rotate(0)',
    top: 'rotate(180)',
    right: 'rotate(-90)',
    left: 'rotate(90)',
  };

  return (
    <svg
      width={12}
      height={12}
      viewBox="0 0 12 12"
      className="absolute z-[1] fill-white drop-shadow-sm"
      style={{ ...style, transform: rotations[placement] }}
      aria-hidden="true"
    >
      <path d="M6 0L12 12H0L6 0Z" />
    </svg>
  );
}

export function CoachMarks({
  steps,
  tourId: _tourId,
  isActive,
  onComplete,
  onStepChange,
}: CoachMarksProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<Rect | null>(null);
  const [bubblePos, setBubblePos] = useState({ top: 0, left: 0 });
  const [resolvedPlacement, setResolvedPlacement] = useState<Placement>('bottom');
  const [visible, setVisible] = useState(false);
  const bubbleRef = useRef<HTMLDivElement>(null);

  const step = steps[currentStep];

  const handleComplete = useCallback(() => {
    setVisible(false);
    setTimeout(() => {
      setCurrentStep(0);
      onComplete();
    }, 200);
  }, [onComplete]);

  const handleSkip = useCallback(() => {
    setVisible(false);
    setTimeout(() => {
      setCurrentStep(0);
      onComplete();
    }, 200);
  }, [onComplete]);

  const handleNext = useCallback(() => {
    setVisible(false);
    setTimeout(() => {
      if (currentStep < steps.length - 1) {
        const next = currentStep + 1;
        setCurrentStep(next);
        onStepChange?.(next);
      } else {
        handleComplete();
      }
    }, 200);
  }, [currentStep, steps.length, onStepChange, handleComplete]);

  const updatePosition = useCallback(() => {
    if (!step || !isActive) return;

    const rect = resolveTargetRect(step.targetSelector);
    setTargetRect(rect);
    if (!rect) return;

    const bubbleEl = bubbleRef.current;
    const bubbleWidth = bubbleEl?.offsetWidth ?? BUBBLE_MAX_WIDTH;
    const bubbleHeight = bubbleEl?.offsetHeight ?? 120;

    const placement = resolvePlacement(
      step.placement ?? 'bottom',
      rect,
      bubbleWidth,
      bubbleHeight,
    );
    setResolvedPlacement(placement);

    const pos = computeBubblePosition(placement, rect, bubbleWidth, bubbleHeight);
    setBubblePos(clampPosition(pos, bubbleWidth));

    const el = document.querySelector(`[data-coach-mark="${step.targetSelector}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [step, isActive]);

  useEffect(() => {
    if (!isActive) {
      setVisible(false);
      return;
    }
    const timer = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(timer);
  }, [isActive, currentStep]);

  useEffect(() => {
    if (!isActive) return;

    const initTimer = setTimeout(updatePosition, 100);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      clearTimeout(initTimer);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isActive, updatePosition]);

  useEffect(() => {
    if (!isActive) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') handleSkip();
      else if (e.key === 'ArrowRight' || e.key === 'Enter') handleNext();
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, handleSkip, handleNext]);

  if (!isActive || !step) return null;

  const isLastStep = currentStep === steps.length - 1;
  const stepLabel = `${currentStep + 1}/${steps.length}`;

  const arrowStyle: React.CSSProperties = (() => {
    const offset = 'calc(50% - 6px)';
    switch (resolvedPlacement) {
      case 'bottom':
        return { top: '-11px', left: offset };
      case 'top':
        return { bottom: '-11px', left: offset };
      case 'right':
        return { left: '-11px', top: offset };
      case 'left':
        return { right: '-11px', top: offset };
    }
  })();

  return (
    <>
      <SpotlightOverlay targetRect={targetRect} />

      <div
        className="fixed inset-0 z-[9999]"
        onClick={handleSkip}
        aria-hidden="true"
      />

      <div
        ref={bubbleRef}
        role="dialog"
        aria-label={`Etape ${stepLabel}: ${step.title}`}
        aria-modal="true"
        className={cn(
          'fixed z-[10000] w-[320px] max-w-[calc(100vw-24px)] rounded-xl border border-border/60 bg-white shadow-lg',
          'transition-all duration-300 ease-out',
          visible
            ? 'translate-y-0 scale-100 opacity-100'
            : 'translate-y-2 scale-95 opacity-0',
        )}
        style={{
          top: bubblePos.top - window.scrollY,
          left: bubblePos.left,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <ArrowSvg placement={resolvedPlacement} style={arrowStyle} />

        <div className="relative p-5">
          <button
            onClick={handleSkip}
            className="absolute right-3 top-3 rounded-full p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Passer le guide"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="mb-3">
            <span className="text-xs font-medium text-muted-foreground">
              Etape {stepLabel}
            </span>
          </div>

          <h3 className="text-base font-bold text-foreground">{step.title}</h3>

          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            {step.description}
          </p>

          <div className="mt-4 flex items-center justify-between">
            <button
              onClick={handleSkip}
              className="text-xs font-medium text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline"
            >
              Passer
            </button>

            <Button size="sm" onClick={handleNext} className="gap-1.5 rounded-lg px-4">
              {isLastStep ? (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  C&apos;est parti !
                </>
              ) : (
                <>
                  Suivant
                  <ChevronRight className="h-3.5 w-3.5" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
