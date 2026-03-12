import type { Metadata } from "next";
import { HeroBanner } from "@/components/sections/HeroBanner";
import { NewsClient } from "./NewsClient";

export const metadata: Metadata = {
  title: "Новости провайдера iFlat",
  description: "Все новости и события интернет-провайдера iFlat: изменения тарифов, акции, технические работы и важные объявления.",
};

export default function NewsPage() {
  return (
    <>
      <HeroBanner
        title="Новости"
        subtitle="Актуальная информация об изменениях тарифов, акциях и событиях компании iFlat"
        backgroundImage="/images/hero/company-news_1.webp"
        compact
      />

      <section className="py-16 lg:py-24 bg-[#F7F8FA]">
        <div className="container">
          <NewsClient />
        </div>
      </section>
    </>
  );
}
