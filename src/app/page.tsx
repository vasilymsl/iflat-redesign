import { HeroCarousel } from "@/components/sections/HeroCarousel";
import { TariffSwitcher } from "@/components/sections/TariffSwitcher";
import { AdvantagesSection } from "@/components/sections/AdvantagesSection";
import { ServiceCards } from "@/components/sections/ServiceCards";
import { EquipmentSection } from "@/components/sections/EquipmentSection";
import { NewsSection } from "@/components/sections/NewsSection";
import { AppSection } from "@/components/sections/AppSection";
import { CoverageSection } from "@/components/sections/CoverageSection";
import { ConnectionSection } from "@/components/sections/ConnectionSection";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { TvChannelShelf } from "@/components/sections/TvChannelShelf";
import { ContentShelf } from "@/components/sections/ContentShelf";
import { TvSearchBar } from "@/components/sections/TvSearchBar";
import { freeChannels, newReleases } from "@/config/tv-shelves";
import { getChannels, getNovinki } from "@/lib/tv-token";
import { flatTariffs } from "@/config/tariffs/flat";
import { homeTariffs } from "@/config/tariffs/home";
import { regions } from "@/config/regions";
import {
  heroSlides,
  advantages,
  additionalServices,
  usefulServices,
  equipment,
  latestNews,
  coverageLocations,
} from "@/config/homepage";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let channels = freeChannels;
  let novinki = newReleases;

  try {
    const [ch, nv] = await Promise.all([getChannels(), getNovinki()]);
    if (ch.length > 0) channels = ch;
    if (nv.length > 0) novinki = nv;
  } catch (e) {
    console.error("[home] Failed to fetch TV data, using static fallback:", e);
  }

  return (
    <>
      <HeroCarousel slides={heroSlides} />

      {/* Шлейфы ТВ-контента (24ТВ) */}
      <ScrollReveal>
        <section className="tv-section" aria-label="Контент 24ТВ">
          <div className="tv-section__header">
            <div className="tv-section__headline">
              <h2 className="tv-section__title">Более 470 каналов уже включены во все тарифы</h2>
              <a
                href="https://24h.tv/instructions"
                target="_blank"
                rel="noopener noreferrer"
                className="tv-section__devices-link"
              >
                Установите приложение на другие устройства →
              </a>
            </div>
            <TvSearchBar />
          </div>

          <TvChannelShelf
            title="Бесплатные ТВ-каналы"
            channels={channels}
            showAllHref="https://24h.tv/row/freechannels"
          />
          <ContentShelf
            title="Новинки"
            items={novinki}
            showAllHref="https://24h.tv/row/novinki-641048475342005896"
          />
        </section>
      </ScrollReveal>

      <ScrollReveal>
        <TariffSwitcher
          regions={regions}
          flatTariffs={flatTariffs}
          homeTariffs={homeTariffs}
        />
      </ScrollReveal>

      <ScrollReveal delay={0.05}>
        <AdvantagesSection items={advantages} />
      </ScrollReveal>

      <ScrollReveal delay={0.05}>
        <ServiceCards title="Дополнительные услуги" items={additionalServices} />
      </ScrollReveal>

      <ScrollReveal delay={0.05}>
        <ServiceCards title="Полезные сервисы" items={usefulServices} />
      </ScrollReveal>

      <ScrollReveal delay={0.05}>
        <EquipmentSection items={equipment} />
      </ScrollReveal>

      <ScrollReveal delay={0.05}>
        <NewsSection items={latestNews} />
      </ScrollReveal>

      <ScrollReveal delay={0.05}>
        <AppSection />
      </ScrollReveal>

      <ScrollReveal delay={0.05}>
        <CoverageSection locations={coverageLocations} />
      </ScrollReveal>

      <ScrollReveal delay={0.05}>
        <ConnectionSection />
      </ScrollReveal>
    </>
  );
}
