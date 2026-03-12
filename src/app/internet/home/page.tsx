import type { Metadata } from "next";
import { HeroBanner } from "@/components/sections/HeroBanner";
import { FeatureCards } from "@/components/sections/FeatureCards";
import { ConnectionSection } from "@/components/sections/ConnectionSection";
import { CTABanner } from "@/components/sections/CTABanner";
import { FaqSection } from "@/components/sections/FaqSection";
import { TariffCard } from "@/components/sections/TariffCard";
import { CarouselSection } from "@/components/sections/CarouselSection";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { homeTariffs, glParkTariffs } from "@/config/tariffs/home";
import { homeFaq } from "@/config/faq/flat";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Интернет в частный дом — Московская область и Новая Москва",
  description: "Интернет в частный дом в Московской области и Новой Москве. Высокая скорость, технология GPON.",
};

const features = [
  { image: "/images/services/home_feature_1.png", title: "Быстро и качественно", description: "Высокое качество сигнала на скорости до 500 Мбит/с" },
  { image: "/images/services/home_feature_2.png", title: "Современные технологии", description: "Проводной интернет в частный дом по технологии GPON" },
  { image: "/images/services/home_feature_3.png", title: "Помощь 24/7", description: "Круглосуточная техническая поддержка, быстрое решение проблем" },
];

const tvPackages = [
  { name: "Стандарт", description: "Стандартный набор необходимых каналов", price: 199, image: "/images/services/cinema_standart.png", href: "/tv" },
  { name: "Кинотеатр START", description: "Эксклюзивные премьеры фильмов, сериалов и мультфильмов", price: 499, image: "/images/services/cinema_start.png", href: "/tv" },
  { name: "Кинотеатр AMEDIATEKA", description: "Лучшие сериалы планеты по версии IMDb", price: 299, image: "/images/services/cinema_amediateka.png", href: "/tv" },
];

const additionalServices = [
  { title: "Цифровое ТВ", description: "Более 300 каналов ТВ в цифровом качестве, в том числе в HD и FHD", href: "/tv", image: "/images/services/template48_images_dop1.png" },
  { title: "Акции", description: "Пользуйтесь выгодными предложениями и получайте приятные бонусы", href: "/action", image: "/images/services/template48_images_dop3.png" },
  { title: "Абонемент", description: "Экономь на оплате: −15% при оплате на 6 месяцев, −20% при оплате на 12 месяцев", href: "/abonement", image: "/images/services/template50_images_dop5.png" },
];

export default function InternetHomePage() {
  return (
    <>
      <HeroBanner
        title="Интернет в частный дом"
        subtitle="Домашний интернет для дома и дачи в Новой Москве, Московской области, Боровском и Можайском районе."
        backgroundImage="/images/hero/privedisosed_1.webp"
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
        <CarouselSection
          title="Тарифные планы"
          slidesPerView={{ base: 1, sm: 1, md: 2, lg: 3 }}
          sectionClassName="py-16 lg:py-24 bg-brand-surface"
        >
          {homeTariffs.map((plan) => (
            <TariffCard key={plan.id} plan={plan} />
          ))}
        </CarouselSection>
      </ScrollReveal>

      <ScrollReveal delay={0.05}>
        <CarouselSection
          title="Тарифы для КП Глаголево Парк"
          subtitle="Специальные тарифные планы для жителей коттеджного посёлка"
          slidesPerView={{ base: 1, sm: 2, md: 2, lg: 4 }}
        >
          {glParkTariffs.map((plan) => (
            <TariffCard key={plan.id} plan={plan} />
          ))}
        </CarouselSection>
      </ScrollReveal>

      <ScrollReveal delay={0.05}>
        <CarouselSection
          title="Цифровое ТВ и Онлайн-кинотеатр"
          slidesPerView={{ base: 1, sm: 2, md: 2, lg: 3 }}
          sectionClassName="py-16 lg:py-24 bg-brand-surface"
        >
          {tvPackages.map((pkg) => (
            <Link key={pkg.name} href={pkg.href}>
              <Card hover className="h-full overflow-hidden flex flex-col">
                <div className="p-4 bg-white flex items-center justify-center overflow-hidden">
                  <Image src={pkg.image} alt={pkg.name} width={300} height={164} className="object-contain w-full h-auto" />
                </div>
                <div className="p-6 text-center flex-1 flex flex-col">
                  <h3 className="text-xl font-bold mb-2">{pkg.name}</h3>
                  <p className="text-text-secondary text-sm flex-1">{pkg.description}</p>
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <span className="text-3xl font-black">{formatPrice(pkg.price)}</span>
                    <span className="text-text-secondary ml-1">руб/мес</span>
                  </div>
                  <Button className="mt-4 w-full" size="sm">Подключить</Button>
                </div>
              </Card>
            </Link>
          ))}
        </CarouselSection>
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
                  <Image src={service.image} alt={service.title} width={400} height={219} className="object-cover w-full h-full" />
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
        <section className="py-16 lg:py-24">
          <div className="container">
            <div className="flex flex-col md:flex-row items-center gap-10 max-w-4xl mx-auto">
              <div className="flex-shrink-0 w-full md:w-2/5">
                <Image
                  src="/images/app/app-bg.png"
                  alt="Мобильное приложение iFlat"
                  width={400}
                  height={300}
                  className="w-full h-64 object-cover rounded-2xl"
                />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-4">Мобильное приложение «iFlat»</h2>
                <ul className="space-y-2 text-text-secondary mb-6">
                  <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-brand-primary flex-shrink-0" />Удобно пополнять баланс</li>
                  <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-brand-primary flex-shrink-0" />Подключайте и отключайте услуги</li>
                  <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-brand-primary flex-shrink-0" />Круглосуточная техническая поддержка</li>
                </ul>
                <div className="flex flex-wrap gap-4">
                  <a href="https://play.google.com/store/apps/details?id=ru.iflat.mlk" target="_blank" rel="noopener noreferrer">
                    <Image src="/images/services/template50_images_google.png" alt="Google Play" width={140} height={44} className="h-11 w-auto" />
                  </a>
                  <a href="https://www.apple.com/ru/app-store/" target="_blank" rel="noopener noreferrer">
                    <Image src="/images/services/template50_images_apple.png" alt="App Store" width={140} height={44} className="h-11 w-auto" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal delay={0.05}>
        <ConnectionSection />
      </ScrollReveal>

      <ScrollReveal delay={0.05}>
        <CTABanner />
      </ScrollReveal>

      <ScrollReveal delay={0.05}>
        <FaqSection items={homeFaq} />
      </ScrollReveal>
    </>
  );
}
