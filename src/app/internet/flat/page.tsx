import type { Metadata } from "next";
import { HeroBanner } from "@/components/sections/HeroBanner";
import { FeatureCards } from "@/components/sections/FeatureCards";
import { TariffGrid } from "@/components/sections/TariffGrid";
import { ConnectionSection } from "@/components/sections/ConnectionSection";
import { CTABanner } from "@/components/sections/CTABanner";
import { FaqSection } from "@/components/sections/FaqSection";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { flatTariffs } from "@/config/tariffs/flat";
import { regions } from "@/config/regions";
import { flatFaq } from "@/config/faq/flat";
import { AppSection } from "@/components/sections/AppSection";
import { CarouselSection } from "@/components/sections/CarouselSection";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Интернет в квартиру — Московская область и Новая Москва",
  description: "Подключаем интернет в квартиру в Московской области и Новой Москве. Выгодные тарифы Интернет и ТВ.",
};

const features = [
  { image: "/images/services/feature_speed.png", title: "Высокая скорость", description: "До 300 Мбит/с по оптоволокну" },
  { image: "/images/services/feature_support.png", title: "Быстрое подключение", description: "Через 2-3 дня после заявки" },
  { image: "/images/services/feature_payment.png", title: "Удобная оплата", description: "Одним счётом, не выходя из дома" },
];

const additionalServices = [
  { title: "Цифровое ТВ", description: "Более 300 каналов ТВ в цифровом качестве, в том числе в HD и FHD", href: "/tv", image: "/images/services/template50_images_dop1.png" },
  { title: "Доверительный платёж", description: "Пользуйтесь услугами если нет возможности пополнить счёт", href: "/doveritelnyi_platezh", image: "/images/services/template50_images_dop6.png" },
  { title: "Абонемент", description: "Экономь на оплате: −15% при оплате на 6 месяцев, −20% при оплате на 12 месяцев", href: "/abonement", image: "/images/services/template50_images_dop5.png" },
];

export default function InternetFlatPage() {
  return (
    <>
      <HeroBanner
        title="Интернет в квартиру"
        subtitle="Домашний интернет по выгодным тарифам в Московской области и Новой Москве. Широкий выбор пакетных предложений Интернет + ТВ."
        backgroundImage="/images/hero/bezlimitnii-internet-i-tv-v-kvartiru_1.webp"
        compact
      />

      <ScrollReveal>
        <section className="py-20 lg:py-28">
          <div className="container">
            <SectionTitle title="Преимущества" badge="ПРЕИМУЩЕСТВА" />
            <FeatureCards features={features} />
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal delay={0.05}>
        <TariffGrid
          title="Тарифные планы"
          subtitle="Ethernet | GPON — выберите ваш район"
          regions={regions}
          tariffsByRegion={flatTariffs}
        />
      </ScrollReveal>

      <ScrollReveal delay={0.05}>
        <CarouselSection
          title="Дополнительные услуги"
          slidesPerView={{ base: 1, sm: 2, md: 2, lg: 3 }}
        >
          {additionalServices.map((service) => (
            <Link key={service.href} href={service.href}>
              <Card hover className="h-full overflow-hidden flex flex-col">
                <div className="aspect-video w-full overflow-hidden bg-gray-50">
                  <Image src={service.image} alt={service.title} width={400} height={225} className="object-cover w-full h-full" />
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-lg font-semibold mb-1">{service.title}</h3>
                  <p className="text-text-secondary text-sm">{service.description}</p>
                </div>
              </Card>
            </Link>
          ))}
        </CarouselSection>
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
        <FaqSection items={flatFaq} />
      </ScrollReveal>
    </>
  );
}
