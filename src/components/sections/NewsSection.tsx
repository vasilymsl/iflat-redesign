"use client";

import Image from "next/image";
import Link from "next/link";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { Carousel } from "@/components/ui/Carousel";

interface NewsItem {
  title: string;
  date: string;
  image: string;
  href: string;
}

interface NewsSectionProps {
  items: NewsItem[];
}

export function NewsSection({ items }: NewsSectionProps) {
  return (
    <section className="py-16 lg:py-24 bg-white">
      <div className="container">
        <SectionTitle title="Новости компании" />

        <Carousel
          slidesPerView={{ base: 1, sm: 2, md: 2, lg: 3 }}
          gap={24}
          dots={true}
          arrows={true}
        >
          {items.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="group block rounded-2xl overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow h-full"
            >
              <div className="relative aspect-video overflow-hidden">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-5">
                <p className="text-sm text-text-secondary mb-2">{item.date}</p>
                <h3 className="font-semibold text-text-primary leading-snug group-hover:text-brand-primary transition-colors">
                  {item.title}
                </h3>
              </div>
            </Link>
          ))}
        </Carousel>

        <div className="mt-10 text-center">
          <Link
            href="/news"
            className="inline-flex items-center gap-2 px-8 py-3 border-2 border-brand-primary text-brand-primary font-semibold rounded-full hover:bg-brand-primary hover:text-white transition-colors"
          >
            Смотреть ещё
          </Link>
        </div>
      </div>
    </section>
  );
}
