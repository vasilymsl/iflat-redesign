import type { Metadata } from "next";
import { HeroBanner } from "@/components/sections/HeroBanner";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { Card } from "@/components/ui/Card";
import { StatsStrip } from "@/components/sections/StatsStrip";
import { siteConfig } from "@/config/site";
import { FileText, Download } from "lucide-react";
import Image from "next/image";
import { AppSection } from "@/components/sections/AppSection";

export const metadata: Metadata = {
  title: "О компании — провайдер iFlat",
  description: "Всё о провайдере iFlat — высокоскоростной интернет, цифровое ТВ, телефония в Московской области.",
};

const values = [
  { title: "Экономичность", description: "Максимально выгодные тарифные планы для каждого клиента", image: "/images/services/template27_images_1.webp" },
  { title: "Надёжность", description: "Сбалансированная пропускная способность и стабильное соединение", image: "/images/services/template27_images_2.webp" },
  { title: "Масштабность", description: "Несколько районов Москвы, Московской области и Боровского района", image: "/images/services/template27_images_3.webp" },
  { title: "Скорость", description: "Оптоволокно, свыше 300 Мбит/с для домашнего интернета", image: "/images/services/template27_images_4.webp" },
  { title: "Открытость", description: "Честность и прозрачность в отношениях с клиентами", image: "/images/services/template27_images_5.webp" },
  { title: "Профессионализм", description: "Ответственность и высокий уровень квалификации специалистов", image: "/images/services/template27_images_6.webp" },
];

const licenses = [
  "Лицензия №143647 — Телематические услуги связи",
  "Лицензия №168275 — Услуги связи для целей проводного радиовещания",
  "Лицензия №135847 — Передача данных для голосовой информации",
  "Лицензия №148238 — Услуги для кабельного вещания",
  "Лицензия №143648 — Предоставление каналов связи",
  "Лицензия №148237 — Местная телефонная связь",
  "Лицензия №143574 — Услуги связи по передаче данных",
];

const documents = [
  { title: "Сводная ведомость СОУТ", url: "https://iflat.ru/upload/Сводная_ведомость_СОУТ.pdf" },
  { title: "Перечень рекомендуемых мероприятий", url: "https://iflat.ru/upload/Перечень_рекомендуемых_мероприятий.pdf" },
  { title: "Публичная оферта на обработку персональных данных", url: "https://iflat.ru/upload/PUBLICHNAYA_OFERTA_NA_OBRAB_PD_IF_FL_23_1.pdf" },
  { title: "Правила оказания услуг связи физическим лицам", url: "https://iflat.ru/upload/pravila_okazaniya_uslug.pdf" },
  { title: "Реквизиты", url: "https://iflat.ru/upload/ooo_yuniontel.pdf" },
  { title: "Цены на технически сложный товар", url: "https://iflat.ru/upload/tceni_na_technicheski_slozhnii_tovar.pdf" },
  { title: "Договор оферта на аренду абонентского оборудования", url: "https://iflat.ru/upload/dogovor_arenda_oborudovaniya.pdf" },
  { title: "Политика обработки персональных данных", url: "https://iflat.ru/upload/obrabotka_pers_dannix.pdf" },
  { title: "Оферта повышения тарифов КТВ", url: "https://iflat.ru/upload/povishenie_tarifov_ktv_01-01-26.pdf" },
  { title: "Оферта новые тарифы интернет", url: "https://iflat.ru/upload/2026.01.19_Оферта_тарифы.pdf" },
  { title: "Публичная оферта о заключении дополнительного соглашения", url: "https://iflat.ru/upload/publicnaya_oferta_o_zakluchenii_dop_soglasheniya.pdf" },
];

export default function CompanyPage() {
  return (
    <>
      <HeroBanner
        title="О компании"
        subtitle={`Провайдер интернета ${siteConfig.name} — один из лидеров на рынке в Московской области и Новой Москве. Работаем более ${siteConfig.stats.yearsOperation} лет.`}
        backgroundImage="/images/hero/iflat-segodnya_1.webp"
        compact
        curveColor="bg-brand-secondary"
      />

      <StatsStrip />

      <ScrollReveal>
        <section className="py-16 lg:py-24">
          <div className="container">
            <SectionTitle
              title="Наши ценности"
              subtitle="Почему нас выбрали более 40 тыс. жителей Подмосковья"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {values.map((value) => (
                <Card key={value.title} className="overflow-hidden hover:shadow-md transition-shadow">
                  <div className="relative aspect-video w-full">
                    <Image src={value.image} alt={value.title} fill className="object-cover rounded-t-2xl" />
                  </div>
                  <div className="p-6 text-center">
                    <h3 className="text-lg font-semibold mb-2">{value.title}</h3>
                    <p className="text-text-secondary text-sm">{value.description}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal delay={0.05}>
        <section className="py-16 lg:py-24 bg-brand-surface">
          <div className="container">
            <SectionTitle
              title="Лицензии и документы"
              subtitle="iFlat имеет все необходимые лицензии для предоставления услуг связи"
            />
            <div className="max-w-2xl mx-auto">
              <Card className="p-8">
                <ul className="space-y-4">
                  {licenses.map((license) => (
                    <li key={license} className="flex items-start gap-3 text-text-secondary">
                      <FileText className="w-5 h-5 text-brand-primary flex-shrink-0 mt-0.5" />
                      {license}
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal delay={0.05}>
        <section className="py-16 lg:py-24">
          <div className="container">
            <SectionTitle
              title="Документы"
              subtitle="Нормативные документы, оферты и политики компании"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map((doc) => (
                <a
                  key={doc.url}
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-4 p-5 bg-white rounded-2xl border border-gray-100 hover:border-brand-primary hover:shadow-md transition-all duration-200"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[#FFF3DC] flex items-center justify-center group-hover:bg-brand-primary transition-colors duration-200">
                    <FileText className="w-5 h-5 text-brand-primary group-hover:text-white transition-colors duration-200" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary leading-snug mb-2">{doc.title}</p>
                    <span className="inline-flex items-center gap-1 text-xs text-brand-primary font-medium">
                      <Download className="w-3.5 h-3.5" />
                      Скачать PDF
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal delay={0.05}>
        <AppSection />
      </ScrollReveal>
    </>
  );
}
