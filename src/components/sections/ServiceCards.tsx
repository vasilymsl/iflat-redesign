"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { Carousel } from "@/components/ui/Carousel";

interface ServiceItem {
  title: string;
  description: string;
  image: string;
  href: string;
}

interface ServiceCardsProps {
  title: string;
  items: ServiceItem[];
}

export function ServiceCards({ title, items }: ServiceCardsProps) {
  return (
    <section className="py-16 lg:py-24 bg-brand-surface">
      <div className="container">
        <SectionTitle title={title} />
        <Carousel
          slidesPerView={{ base: 1, sm: 2, md: 2, lg: 4 }}
          gap={24}
          dots={true}
          arrows={true}
        >
          {items.map((item) => (
            <div
              key={item.title}
              className="bg-white rounded-2xl shadow hover:shadow-lg transition-shadow overflow-hidden flex flex-col h-full"
            >
              <div className="relative w-full aspect-[4/3] bg-gray-50">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-contain p-4"
                />
              </div>
              <div className="p-5 flex flex-col flex-1">
                <h3 className="text-base font-bold text-text-primary mb-1">
                  {item.title}
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed flex-1">
                  {item.description}
                </p>
                <Link
                  href={item.href}
                  className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-primary hover:text-brand-primary-hover transition-colors"
                >
                  Подробнее
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </Carousel>
      </div>
    </section>
  );
}
