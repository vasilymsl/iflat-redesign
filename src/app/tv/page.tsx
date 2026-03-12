import type { Metadata } from "next";
import { HeroBanner } from "@/components/sections/HeroBanner";
import { ConnectionSection } from "@/components/sections/ConnectionSection";
import { CTABanner } from "@/components/sections/CTABanner";
import { FaqSection } from "@/components/sections/FaqSection";
import { CarouselSection } from "@/components/sections/CarouselSection";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EquipmentCard } from "@/components/sections/EquipmentCard";
import { tvFaq } from "@/config/faq/flat";
import { formatPrice } from "@/lib/utils";
import { AppSection } from "@/components/sections/AppSection";
import { TvChannelShelf } from "@/components/sections/TvChannelShelf";
import { ContentShelf } from "@/components/sections/ContentShelf";
import { TvSearchBar } from "@/components/sections/TvSearchBar";
import { freeChannels, newReleases } from "@/config/tv-shelves";
import { getChannels, getNovinki } from "@/lib/tv-token";
import Link from "next/link";
import Image from "next/image";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Цифровое и кабельное телевидение",
  description: "Подключить цифровое и кабельное телевидение в Наро-Фоминском районе и Новой Москве. Более 380 каналов.",
};

const tvTypes = [
  {
    icon: "/images/services/tv_type_interactive.svg",
    title: "Интерактивное ТВ",
    description: "Более 380 каналов в том числе в HD качестве на любой вкус и дополнительные пакеты ТВ",
  },
  {
    icon: "/images/services/tv_type_cinema.svg",
    title: "Онлайн-кинотеатры",
    description: "Не нужно искать фильмы и стоять за билетами — всё самое интересное в твоём кармане",
  },
  {
    icon: "/images/services/tv_type_cable.svg",
    title: "Кабельное ТВ",
    description: "Высокое качество изображения и доступ к большому выбору каналов, подключение к любому телевизору",
  },
];

const tvServices = [
  {
    title: "24ТВ",
    description: "Развлекательный сервис будущего. Идеально для больших диагоналей. До 5 устройств на 1 аккаунте.",
    href: "/24tv",
    image: "/images/services/tv_service_24tv.png",
  },
  {
    title: "Кабельное ТВ",
    description: "Каналы в аналоговом и цифровом качестве, в том числе в формате HD. Без дополнительного оборудования.",
    href: "/cabel-tv",
    image: "/images/services/tv_service_cable.png",
  },
];

const cinemas = [
  {
    name: "START",
    description: "Эксклюзивные премьеры фильмов, сериалов и мультфильмов",
    price: 499,
    image: "/images/services/cinema_real_start.png",
  },
  {
    name: "Premier",
    description: "Премьеры сериалов до выхода на ТВ, фильмы сразу после проката",
    price: 299,
    image: "/images/services/cinema_real_premier.png",
  },
  {
    name: "Amediateka",
    description: "Лучшие сериалы планеты по версии IMDb",
    price: 349,
    image: "/images/services/cinema_real_amediateka.png",
  },
];

const equipment = [
  {
    name: "Приставка TV Pro100tv A2",
    description: "Приставка Smart TV напрямую подключается к телевизору и предоставляет внушительный набор функциональных возможностей.",
    specs: ["Android 11", "Внутренняя память: 8GB", "Оперативная память: 2GB", "4K 60fps", "Wi-Fi 2.4+5GHz", "2 порта USB"],
    image: "/images/equipment/pristavka.png",
    characteristics: [
      { label: "Система", value: "Android 11" },
      { label: "Процессор", value: "Amlogic S905w2, 4 ядра" },
      { label: "Внутренняя память", value: "8GB" },
      { label: "Оперативная память", value: "2GB DDR3" },
      { label: "Частота 4K", value: "4K на 60 fps" },
      { label: "Сеть", value: "LAN 100Mb, Wi-Fi 2.4+5GHz" },
      { label: "Порты", value: "2 порта USB" },
      { label: "Размеры", value: "105 × 105 × 20 мм" },
    ],
  },
  {
    name: "Кабель HDMI",
    description: "Живая и объёмная картинка благодаря технологии Static HDR.",
    specs: ["Позолоченные контакты", "HDMI версия 2", "4K: до 60Hz", "2K: до 120Hz", "Full HD: до 240Hz"],
    image: "/images/equipment/cabel.png",
    characteristics: [
      { label: "Цвет", value: "Чёрный" },
      { label: "Особенности", value: "Позолоченные контакты" },
      { label: "Материал", value: "Медь" },
      { label: "Версия HDMI", value: "2" },
      { label: "Пропускная способность", value: "48 Гбит/с" },
      { label: "4K", value: "До 60Hz" },
      { label: "2K", value: "До 120Hz" },
      { label: "Full HD", value: "До 240Hz" },
      { label: "Поддержка", value: "ARC, ALLM, DTS-HD, Dolby TrueHD, eARC" },
    ],
  },
];

export default async function TvPage() {
  // Загружаем данные с 24h.tv (кеш 15 мин), fallback на статику
  let channels = freeChannels;
  let novinki = newReleases;

  try {
    const [ch, nv] = await Promise.all([getChannels(), getNovinki()]);
    if (ch.length > 0) channels = ch;
    if (nv.length > 0) novinki = nv;
  } catch (e) {
    console.error("[tv] Failed to fetch dynamic data, using static fallback:", e);
  }

  return (
    <>
      <HeroBanner
        title="Интерактивное и кабельное ТВ"
        subtitle="Подключите свой домашний телевизор к интерактивному цифровому телевидению высокой четкости и онлайн-кинотеатрам, или просматривайте кабельное телевидение через привычную домашнюю антенну"
        backgroundImage="/images/hero/sovremennoe_tv_1.webp"
        compact
      />

      {/* Шлейфы ТВ-контента (стиль 24ТВ) */}
      <ScrollReveal>
        <section className="tv-section" aria-label="Контент 24ТВ">
          {/* Header: заголовок + поиск */}
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

      {/* Типы ТВ */}
      <ScrollReveal delay={0.05}>
        <section className="py-16 lg:py-24">
          <div className="container">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {tvTypes.map((item) => (
                <div key={item.title} className="text-center p-8 rounded-2xl bg-brand-surface">
                  <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Image src={item.icon} alt="" width={48} height={48} className="w-12 h-12" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                  <p className="text-text-secondary text-sm">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* ТВ-сервисы */}
      <ScrollReveal delay={0.05}>
        <CarouselSection
          title="Наши ТВ-сервисы"
          slidesPerView={{ base: 1, sm: 2, md: 2, lg: 2 }}
          sectionClassName="py-16 lg:py-24 bg-brand-surface"
        >
          {tvServices.map((service) => (
            <Link key={service.title} href={service.href}>
              <Card hover className="h-full overflow-hidden">
                <div className="relative aspect-video overflow-hidden">
                  <Image
                    src={service.image}
                    alt={service.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <h3 className="text-lg font-semibold mb-2">{service.title}</h3>
                  <p className="text-text-secondary text-sm flex-1">{service.description}</p>
                  <Button variant="outline" size="sm" className="mt-4 w-full">
                    Подробнее
                  </Button>
                </div>
              </Card>
            </Link>
          ))}
        </CarouselSection>
      </ScrollReveal>

      {/* Онлайн-кинотеатры */}
      <ScrollReveal delay={0.05}>
        <CarouselSection
          title="Онлайн-кинотеатры"
          slidesPerView={{ base: 1, sm: 2, md: 2, lg: 3 }}
        >
          {cinemas.map((cinema) => (
            <Card key={cinema.name} hover className="flex flex-col overflow-hidden h-full">
              <div className="relative aspect-video overflow-hidden bg-gray-50">
                <Image
                  src={cinema.image}
                  alt={cinema.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
              <div className="p-6 flex flex-col flex-1">
                <h3 className="text-xl font-bold mb-2">{cinema.name}</h3>
                <p className="text-text-secondary text-sm flex-1">{cinema.description}</p>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <span className="text-3xl font-black">{formatPrice(cinema.price)}</span>
                  <span className="text-text-secondary ml-1">₽/мес</span>
                </div>
                <Button className="mt-4 w-full" size="sm">Подключить</Button>
              </div>
            </Card>
          ))}
        </CarouselSection>
      </ScrollReveal>

      {/* Оборудование */}
      <ScrollReveal delay={0.05}>
        <section className="py-16 lg:py-24 bg-brand-surface">
          <div className="container">
            <SectionTitle title="Полезное оборудование" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              {equipment.map((item) => (
                <EquipmentCard
                  key={item.name}
                  name={item.name}
                  description={item.description}
                  specs={item.specs}
                  image={item.image}
                  characteristics={item.characteristics}
                />
              ))}
            </div>
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal delay={0.05}>
        <AppSection />
      </ScrollReveal>

      <ScrollReveal delay={0.05}>
        <ConnectionSection />
      </ScrollReveal>

      <ScrollReveal delay={0.05}>
        <CTABanner />
      </ScrollReveal>

      <ScrollReveal delay={0.05}>
        <FaqSection items={tvFaq} />
      </ScrollReveal>
    </>
  );
}
