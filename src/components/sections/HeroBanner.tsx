"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { siteConfig } from "@/config/site";
import { Phone } from "lucide-react";

interface HeroStat {
  value: string;
  unit?: string;
  label: string;
}

interface HeroBannerProps {
  title: string;
  subtitle: string;
  ctaText?: string;
  ctaHref?: string;
  backgroundImage?: string;
  stats?: HeroStat[];
  className?: string;
  compact?: boolean;
  curveColor?: string;
}

export function HeroBanner({
  title,
  subtitle,
  ctaText,
  ctaHref,
  backgroundImage,
  stats,
  className,
  curveColor = "bg-white",
}: HeroBannerProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden min-h-[50vh] flex items-center",
        className
      )}
    >
      {/* Background image */}
      {backgroundImage && (
        <Image
          src={backgroundImage}
          alt=""
          fill
          className="object-cover"
          priority
        />
      )}

      {/* Subtle gradient overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-brand-dark/60 via-brand-dark/30 to-transparent" />

      <div className="container relative z-10 py-10 lg:py-14">
        <div className="max-w-xl">
          <h1 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-white leading-tight drop-shadow-lg">
            {title}
          </h1>

          <p className="mt-3 text-base text-white/90 leading-relaxed max-w-lg drop-shadow">
            {subtitle}
          </p>

          {/* Dual CTA */}
          {ctaText && ctaHref && (
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href={ctaHref}
                className="px-6 py-3 bg-brand-primary text-white text-sm font-bold rounded-full hover:bg-brand-primary-hover transition-all hover:scale-105 shadow-lg shadow-brand-primary/30"
              >
                {ctaText}
              </Link>
              <a
                href={siteConfig.phoneHref}
                className="px-6 py-3 border-2 border-white/30 text-white text-sm font-semibold rounded-full hover:bg-white/10 transition-colors flex items-center gap-2 backdrop-blur-sm"
              >
                <Phone className="w-4 h-4" />
                Позвонить
              </a>
            </div>
          )}

          {/* Stats row */}
          {stats && stats.length > 0 && (
            <div className="mt-10 flex flex-wrap gap-8">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <div className="text-3xl font-bold text-white">
                    {stat.value}
                    {stat.unit && (
                      <span className="text-brand-primary ml-1 text-xl">{stat.unit}</span>
                    )}
                  </div>
                  <div className="text-sm text-white/50 mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Organic curve at bottom */}
      <div
        className={cn("absolute bottom-0 left-0 right-0 h-10", curveColor)}
        style={{ borderRadius: '50% 50% 0 0 / 100% 100% 0 0' }}
      />
    </section>
  );
}
