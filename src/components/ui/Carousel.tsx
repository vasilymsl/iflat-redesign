"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CarouselProps {
  children: ReactNode[];
  /** Number of slides visible at each breakpoint */
  slidesPerView?: { base?: number; sm?: number; md?: number; lg?: number };
  /** Gap between slides in px */
  gap?: number;
  /** Show navigation arrows */
  arrows?: boolean;
  /** Show dot indicators */
  dots?: boolean;
  /** Enable loop */
  loop?: boolean;
  /** Additional class for the container */
  className?: string;
}

export function Carousel({
  children,
  slidesPerView = { base: 1, sm: 2, md: 2, lg: 4 },
  gap = 24,
  arrows = true,
  dots = true,
  loop = false,
  className,
}: CarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop,
    align: "start",
    slidesToScroll: 1,
    containScroll: "trimSnaps",
  });
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setScrollSnaps(emblaApi.scrollSnapList());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const handler = () => onSelect();
    emblaApi.on("select", handler);
    emblaApi.on("reInit", handler);
    handler();
    return () => {
      emblaApi.off("select", handler);
      emblaApi.off("reInit", handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emblaApi]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo = useCallback(
    (i: number) => emblaApi?.scrollTo(i),
    [emblaApi]
  );

  // Build responsive flex-basis CSS custom properties
  const slideStyle = {
    "--slides-base": slidesPerView.base ?? 1,
    "--slides-sm": slidesPerView.sm ?? 2,
    "--slides-md": slidesPerView.md ?? 2,
    "--slides-lg": slidesPerView.lg ?? 4,
    "--gap": `${gap}px`,
  } as React.CSSProperties;

  return (
    <div className={cn("relative", className)}>
      {/* Arrows */}
      {arrows && (
        <>
          <button
            onClick={scrollPrev}
            disabled={!loop && !canScrollPrev}
            className={cn(
              "absolute -left-3 lg:-left-5 top-1/2 -translate-y-1/2 z-10",
              "w-10 h-10 rounded-full bg-white shadow-lg border border-gray-100",
              "flex items-center justify-center",
              "hover:bg-gray-50 transition-all",
              "disabled:opacity-0 disabled:pointer-events-none",
              "hidden sm:flex"
            )}
            aria-label="Назад"
          >
            <ChevronLeft className="w-5 h-5 text-text-primary" />
          </button>
          <button
            onClick={scrollNext}
            disabled={!loop && !canScrollNext}
            className={cn(
              "absolute -right-3 lg:-right-5 top-1/2 -translate-y-1/2 z-10",
              "w-10 h-10 rounded-full bg-white shadow-lg border border-gray-100",
              "flex items-center justify-center",
              "hover:bg-gray-50 transition-all",
              "disabled:opacity-0 disabled:pointer-events-none",
              "hidden sm:flex"
            )}
            aria-label="Вперёд"
          >
            <ChevronRight className="w-5 h-5 text-text-primary" />
          </button>
        </>
      )}

      {/* Viewport — py/my компенсируют overflow-hidden, чтобы hover-эффекты не обрезались */}
      <div ref={emblaRef} className="overflow-hidden -my-4 py-4" style={slideStyle}>
        <div className="flex" style={{ gap: `${gap}px` }}>
          {children.map((child, i) => (
            <div
              key={i}
              className="carousel-slide min-w-0 shrink-0"
              style={{
                flex: `0 0 calc((100% - var(--gap) * (var(--slides-base) - 1)) / var(--slides-base))`,
              }}
            >
              {child}
            </div>
          ))}
        </div>
      </div>

      {/* Dots */}
      {dots && scrollSnaps.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-6">
          {scrollSnaps.map((_, i) => (
            <button
              key={i}
              onClick={() => scrollTo(i)}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                i === selectedIndex
                  ? "bg-brand-primary w-6"
                  : "bg-gray-300 w-2 hover:bg-gray-400"
              )}
              aria-label={`Перейти к слайду ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
