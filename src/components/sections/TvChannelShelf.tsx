"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChannelCard, type ChannelData } from "./ChannelCard";

interface TvChannelShelfProps {
  title: string;
  channels: ChannelData[];
  showAllHref?: string;
}

export function TvChannelShelf({ title, channels, showAllHref }: TvChannelShelfProps) {
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
    const cardWidth = el.querySelector(".channel-card")?.clientWidth ?? 300;
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
        <div
          ref={scrollRef}
          className={cn(
            "tv-shelf__scroll",
            canScrollPrev && "tv-shelf__scroll--fade-left",
            canScrollNext && "tv-shelf__scroll--fade-right"
          )}
        >
          {channels.map((channel) => (
            <ChannelCard key={channel.id} channel={channel} />
          ))}

          {/* «Смотреть все» — отдельная CTA-карточка на всю высоту ряда */}
          {showAllHref && (
            <a
              href={showAllHref}
              target="_blank"
              rel="noopener noreferrer"
              className="channel-card tv-shelf__show-all-card"
              aria-label="Смотреть все каналы на 24h.tv"
            >
              <span className="tv-shelf__show-all-box tv-shelf__show-all-box--channel">
                <span className="tv-shelf__show-all-content">
                  <span className="tv-shelf__show-all-icon" aria-hidden="true">
                    <ArrowRight className="w-5 h-5" />
                  </span>
                  <span className="tv-shelf__show-all-text">Смотреть все</span>
                </span>
              </span>
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
