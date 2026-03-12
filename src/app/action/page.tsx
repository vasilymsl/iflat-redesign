import type { Metadata } from "next";
import { HeroBanner } from "@/components/sections/HeroBanner";
import { CarouselSection } from "@/components/sections/CarouselSection";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { AppSection } from "@/components/sections/AppSection";
import { ConnectionSection } from "@/components/sections/ConnectionSection";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Акции на подключение интернета и телевидения",
  description: "Акции и бонусы для действующих и новых абонентов провайдера iFlat.",
};

const promos = [
  {
    title: "Акция «3 месяца интернета и ТВ бесплатно»",
    description: "Подключайтесь и пользуйтесь интернетом и цифровым ТВ 3 месяца бесплатно",
    href: "/action",
    image: "/images/hero/bezlimitnii-internet-i-tv-v-kvartiru_1.webp",
  },
  {
    title: "Акция «Бонус за отзыв»",
    description: "Поделитесь своим мнением о нашей работе и получите бонус!",
    href: "/bonus_za_otziv",
    image: "/images/promo/action_bonus_review.png",
  },
  {
    title: "Акция «Переход от другого провайдера»",
    description: "Получите 2 месяца бесплатного интернета",
    href: "/perehod_ot_provaidera",
    image: "/images/promo/action_perehod.png",
  },
  {
    title: "Акция «Приведи соседа»",
    description: "Два месяца бесплатного интернета для вас и вашего соседа",
    href: "/privedi_soseda",
    image: "/images/promo/action_privedi_soseda.png",
  },
  {
    title: "Бесплатное подключение в частный сектор",
    description: "Подключение интернета в частный дом бесплатно при заключении договора",
    href: "/internet/home",
    image: "/images/hero/privedisosed_1.webp",
  },
];

const additionalServices = [
  {
    title: "Цифровое ТВ",
    description: "Более 300 каналов ТВ в цифровом качестве, в том числе в HD и FHD",
    href: "/tv",
    image: "/images/services/action_dop_tv.png",
  },
  {
    title: "Видеонаблюдение",
    description: "Будьте в курсе того, что происходит в квартире, на даче и в офисе",
    href: "/videonablyudenie",
    image: "/images/services/action_dop_video.png",
  },
  {
    title: "Умный домофон",
    description: "Контроль доступа в ваш подъезд",
    href: "/ipdomofon",
    image: "/images/services/action_dop_domofon.png",
  },
  {
    title: "Телефония",
    description: "Городской телефон с кодом 499-, 495-, 496-",
    href: "/phone",
    image: "/images/services/action_dop_phone.png",
  },
];

const usefulServices = [
  {
    title: "Автоплатёж",
    description: "Своевременное пополнение лицевого счёта",
    href: "/avtoplatezh",
    image: "/images/services/action_useful_autoplatezh.png",
  },
  {
    title: "Доверительный платёж",
    description: "Пользуйтесь услугами, если нет возможности пополнить счёт",
    href: "/doveritelnyi_platezh",
    image: "/images/services/action_useful_doveritelny.png",
  },
  {
    title: "Абонемент",
    description: "Экономьте на оплате: -15% при оплате на 6 мес., -20% при оплате на 12 мес.",
    href: "/abonement",
    image: "/images/services/action_useful_abonement.png",
  },
  {
    title: "Акции и скидки",
    description: "Принимай участие в выгодных акциях компании",
    href: "/action",
    image: "/images/services/action_useful_akcii.png",
  },
];

export default function ActionPage() {
  return (
    <>
      <HeroBanner
        title="Акции и скидки"
        subtitle="Приводите соседей, оставляйте отзывы, участвуйте в акциях и получайте бонусы от iFlat"
        backgroundImage="/images/hero/neskromno_1.webp"
        compact
      />

      {/* Текущие акции */}
      <ScrollReveal>
        <CarouselSection
          title="Текущие акции"
          slidesPerView={{ base: 1, sm: 2, md: 2, lg: 3 }}
        >
          {promos.map((promo) => (
            <Link key={promo.title} href={promo.href}>
              <Card hover className="h-full overflow-hidden">
                <div className="relative aspect-[366/201] overflow-hidden">
                  <Image
                    src={promo.image}
                    alt={promo.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
                <div className="p-6 text-center">
                  <h3 className="text-lg font-semibold mb-2">{promo.title}</h3>
                  <p className="text-text-secondary text-sm">{promo.description}</p>
                  <Button variant="outline" size="sm" className="mt-4">
                    Подробнее
                  </Button>
                </div>
              </Card>
            </Link>
          ))}
        </CarouselSection>
      </ScrollReveal>

      {/* Дополнительные услуги */}
      <ScrollReveal delay={0.05}>
        <CarouselSection
          title="Дополнительные услуги"
          slidesPerView={{ base: 1, sm: 2, md: 2, lg: 4 }}
          sectionClassName="py-16 lg:py-24 bg-brand-surface"
        >
          {additionalServices.map((service) => (
            <Link key={service.title} href={service.href}>
              <Card hover className="h-full overflow-hidden">
                <div className="relative aspect-video overflow-hidden bg-gray-50">
                  <Image
                    src={service.image}
                    alt={service.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-1">{service.title}</h3>
                  <p className="text-text-secondary text-sm">{service.description}</p>
                </div>
              </Card>
            </Link>
          ))}
        </CarouselSection>
      </ScrollReveal>

      {/* Полезные сервисы */}
      <ScrollReveal delay={0.05}>
        <CarouselSection
          title="Полезные сервисы"
          slidesPerView={{ base: 1, sm: 2, md: 2, lg: 4 }}
        >
          {usefulServices.map((service) => (
            <Link key={service.title} href={service.href}>
              <Card hover className="h-full overflow-hidden">
                <div className="relative aspect-video overflow-hidden bg-gray-50">
                  <Image
                    src={service.image}
                    alt={service.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-1">{service.title}</h3>
                  <p className="text-text-secondary text-sm">{service.description}</p>
                </div>
              </Card>
            </Link>
          ))}
        </CarouselSection>
      </ScrollReveal>

      <ScrollReveal delay={0.05}>
        <ConnectionSection />
      </ScrollReveal>

      <ScrollReveal delay={0.05}>
        <AppSection />
      </ScrollReveal>
    </>
  );
}
