"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export interface ContentItem {
  id: string;
  title: string;
  subtitle?: string;
  poster: string;
  href?: string;
  rating?: number;
}

interface ContentShelfProps {
  title: string;
  items: ContentItem[];
  showAllHref?: string;
}

export function ContentShelf({ title, items, showAllHref }: ContentShelfProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollPrev(el.scrollLeft > 5);
    setCanScrollNext(el.scrollLeft < el.scrollWidth - el.clientWidth - 5);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [checkScroll]);

  const scroll = useCallback((direction: "prev" | "next") => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.querySelector(".content-card")?.clientWidth ?? 220;
    const scrollAmount = cardWidth * 3;
    el.scrollBy({
      left: direction === "next" ? scrollAmount : -scrollAmount,
      behavior: "smooth",
    });
  }, []);

  return (
    <div className="tv-shelf">
      {/* Header */}
      <div className="tv-shelf__header">
        <h2 className="tv-shelf__title">{title}</h2>
      </div>

      {/* Slider */}
      <div className="tv-shelf__slider group/shelf">
        {/* Prev arrow */}
        <button
          onClick={() => scroll("prev")}
          className={cn(
            "tv-shelf__arrow tv-shelf__arrow--prev tv-shelf__arrow--visible",
            !canScrollPrev && "tv-shelf__arrow--hidden"
          )}
          aria-label="Назад"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Scroll container */}
        <div ref={scrollRef} className="tv-shelf__scroll">
          {items.map((item) => {
            const Wrapper = item.href ? "a" : "div";
            const wrapperProps = item.href ? { href: item.href } : {};
            return (
              <Wrapper
                key={item.id}
                {...wrapperProps}
                className="content-card"
              >
                {/* Poster 2:3 */}
                <div className="content-card__poster">
                  <Image
                    src={item.poster}
                    alt={item.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 45vw, (max-width: 1024px) 25vw, 18vw"
                    unoptimized
                  />

                  {/* Rating badge */}
                  {item.rating != null && item.rating > 0 && (
                    <div className={cn(
                      "content-card__rating",
                      item.rating >= 7 ? "bg-green-600" : item.rating >= 5 ? "bg-yellow-600" : "bg-red-600"
                    )}>
                      {item.rating.toFixed(1)}
                    </div>
                  )}

                  {/* Hover glow */}
                  <div className="content-card__glow" />
                </div>

                {/* Title */}
                <div className="content-card__info">
                  <p className="content-card__title">{item.title}</p>
                  {item.subtitle && (
                    <span className="content-card__subtitle">{item.subtitle}</span>
                  )}
                </div>
              </Wrapper>
            );
          })}

          {/* "Смотреть все" card */}
          {showAllHref && (
            <a
              href={showAllHref}
              target="_blank"
              rel="noopener noreferrer"
              className="content-card tv-shelf__show-all-card"
            >
              <div className="content-card__poster tv-shelf__show-all-preview">
                <ArrowRight className="w-8 h-8 text-brand-primary" />
                <span className="tv-shelf__show-all-text">Смотреть все</span>
              </div>
            </a>
          )}
        </div>

        {/* Next arrow */}
        <button
          onClick={() => scroll("next")}
          className={cn(
            "tv-shelf__arrow tv-shelf__arrow--next tv-shelf__arrow--visible",
            !canScrollNext && "tv-shelf__arrow--hidden"
          )}
          aria-label="Вперёд"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
