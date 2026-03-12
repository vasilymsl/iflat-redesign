"use client";

import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";
import Link from "next/link";
import { Phone } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

interface Slide {
  title: string;
  subtitle: string;
  ctaText: string;
  ctaHref: string;
  backgroundImage?: string;
}

interface HeroCarouselProps {
  slides: Slide[];
}

export function HeroCarousel({ slides }: HeroCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 5000, stopOnInteraction: false }),
  ]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  const scrollTo = useCallback(
    (index: number) => {
      if (!emblaApi) return;
      emblaApi.scrollTo(index);
    },
    [emblaApi]
  );

  return (
    <section className="relative overflow-hidden min-h-[50vh] flex items-center">
      <div ref={emblaRef} className="absolute inset-0 overflow-hidden">
        <div className="flex h-full">
          {slides.map((slide, index) => (
            <div
              key={index}
              className="relative flex-[0_0_100%] min-h-[50vh]"
            >
              {slide.backgroundImage && (
                <Image
                  src={slide.backgroundImage}
                  alt=""
                  fill
                  className="object-cover"
                  priority={index === 0}
                />
              )}

              <div className="absolute inset-0 bg-gradient-to-r from-brand-dark/60 via-brand-dark/30 to-transparent" />

              <div className="container relative z-10 py-10 lg:py-14 h-full flex items-center">
                <div className="max-w-xl">
                  <h1 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-white leading-tight drop-shadow-lg">
                    {slide.title}
                  </h1>

                  <p className="mt-3 text-base text-white/90 leading-relaxed max-w-lg drop-shadow">
                    {slide.subtitle}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link
                      href={slide.ctaHref}
                      className="px-6 py-3 bg-brand-primary text-white text-sm font-bold rounded-full hover:bg-brand-primary-hover transition-all hover:scale-105 shadow-lg shadow-brand-primary/30"
                    >
                      {slide.ctaText}
                    </Link>
                    <a
                      href={siteConfig.phoneHref}
                      className="px-6 py-3 border-2 border-white/30 text-white text-sm font-semibold rounded-full hover:bg-white/10 transition-colors flex items-center gap-2 backdrop-blur-sm"
                    >
                      <Phone className="w-4 h-4" />
                      Позвонить
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-12 left-0 right-0 z-20 flex justify-center gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => scrollTo(index)}
            className={cn(
              "h-2 rounded-full transition-all duration-300",
              index === selectedIndex
                ? "bg-brand-primary w-6"
                : "bg-white/40 w-2 hover:bg-white/70"
            )}
            aria-label={`Перейти к слайду ${index + 1}`}
          />
        ))}
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 h-10 bg-white z-10"
        style={{ borderRadius: "50% 50% 0 0 / 100% 100% 0 0" }}
      />
    </section>
  );
}
