"use client";

import { type ReactNode } from "react";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { Carousel } from "@/components/ui/Carousel";

interface CarouselSectionProps {
  title: string;
  subtitle?: string;
  children: ReactNode[];
  slidesPerView?: { base?: number; sm?: number; md?: number; lg?: number };
  gap?: number;
  className?: string;
  sectionClassName?: string;
}

export function CarouselSection({
  title,
  subtitle,
  children,
  slidesPerView = { base: 1, sm: 2, md: 2, lg: 4 },
  gap = 24,
  className,
  sectionClassName,
}: CarouselSectionProps) {
  return (
    <section className={sectionClassName ?? "py-16 lg:py-24"}>
      <div className="container">
        <SectionTitle title={title} subtitle={subtitle} />
        <Carousel
          slidesPerView={slidesPerView}
          gap={gap}
          dots={true}
          arrows={true}
          className={className}
        >
          {children}
        </Carousel>
      </div>
    </section>
  );
}
