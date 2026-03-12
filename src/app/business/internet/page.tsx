import type { Metadata } from "next";
import { HeroBanner } from "@/components/sections/HeroBanner";
import { ConnectionSection } from "@/components/sections/ConnectionSection";
import { CTABanner } from "@/components/sections/CTABanner";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { Card } from "@/components/ui/Card";
import { Accordion } from "@/components/ui/Accordion";
import { TariffCard } from "@/components/sections/TariffCard";
import { CarouselSection } from "@/components/sections/CarouselSection";
import { TariffPlan } from "@/types/tariff";
import {
  Wifi,
  Shield,
  Zap,
  Headphones,
  PauseCircle,
  Building2,
  Radio,
  HardHat,
  FileText,
  Check,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Интернет для бизнеса — iFlat",
  description:
    "Интернет для бизнеса от провайдера iFlat. Скорость до 100 Гбит/с, выделенный IP, организация локальных сетей. Подключение за 1–3 дня.",
};

const businessTariffs: TariffPlan[] = [
  {
    id: "biz-5",
    name: "БИЗНЕС 5",
    speed: 5,
    price: 1200,
    isHit: false,
    features: [
      "Выделенный канал связи",
      "Статический IP — 400 ₽/мес",
      "Стоимость подключения 5 000 ₽",
      "Зона: Можайский, Боровский, Наро-Фоминский р-н",
    ],
  },
  {
    id: "biz-10",
    name: "БИЗНЕС 10",
    speed: 10,
    price: 2300,
    isHit: true,
    features: [
      "Выделенный канал связи",
      "Статический IP — 400 ₽/мес",
      "Стоимость подключения 5 000 ₽",
      "Зона: Можайский, Боровский, Наро-Фоминский р-н",
    ],
  },
  {
    id: "biz-20",
    name: "БИЗНЕС 20",
    speed: 20,
    price: 4000,
    isHit: false,
    features: [
      "Выделенный канал связи",
      "Статический IP — 400 ₽/мес",
      "Стоимость подключения 5 000 ₽",
      "Зона: Можайский, Боровский, Наро-Фоминский р-н",
    ],
  },
  {
    id: "biz-30",
    name: "БИЗНЕС 30",
    speed: 30,
    price: 6400,
    isHit: false,
    features: [
      "Выделенный канал связи",
      "Статический IP — 400 ₽/мес",
      "Стоимость подключения 5 000 ₽",
      "Зона: Можайский, Боровский, Наро-Фоминский р-н",
    ],
  },
  {
    id: "biz-50",
    name: "БИЗНЕС 50",
    speed: 50,
    price: 9600,
    isHit: false,
    features: [
      "Выделенный канал связи",
      "Статический IP — 400 ₽/мес",
      "Стоимость подключения 5 000 ₽",
      "Зона: Можайский, Боровский, Наро-Фоминский р-н",
    ],
  },
  {
    id: "biz-100",
    name: "БИЗНЕС 100",
    speed: 100,
    price: 16700,
    isHit: false,
    features: [
      "Выделенный канал связи",
      "Статический IP — 400 ₽/мес",
      "Стоимость подключения 5 000 ₽",
      "Зона: Можайский, Боровский, Наро-Фоминский р-н",
    ],
  },
];

const whyUs = [
  {
    icon: Wifi,
    title: "Надёжный интернет",
    description:
      "Мониторим и тестируем сети, чтобы минимизировать сбои. Подключаем напрямую с узла связи, резервируем магистральные линии.",
  },
  {
    icon: Zap,
    title: "Гибкие тарифные планы",
    description:
      "Цена складывается из запросов клиента. Не навязываем ненужных услуг, формируем пакет под потребности каждого.",
  },
  {
    icon: Building2,
    title: "Быстрое подключение",
    description:
      "Подключим к интернету за 1–3 дня. При высокой нагрузке — до 5 дней.",
  },
  {
    icon: Headphones,
    title: "Техподдержка 24/7",
    description:
      "Техподдержка решает проблему удалённо. Если невозможно — инженеры приезжают в течение 2 часов.",
  },
  {
    icon: Shield,
    title: "Защита от DDos-атак",
    description:
      "Работаем над повышением безопасности офисных сетей. Совершенствуем систему защиты от перегрузок и DDos-атак.",
  },
  {
    icon: PauseCircle,
    title: "Приостановка без расторжения",
    description:
      "Можем приостановить подачу услуги, не расторгая договор — например, на время ремонта помещения.",
  },
];

const trustedReasons = [
  {
    title: "Персональный менеджер",
    description:
      "У вас будет персональный менеджер, который глубоко вникает в ваши задачи и помогает быстро решать все вопросы.",
  },
  {
    title: "Гарантия",
    description:
      "Даём гарантию на работу и оборудование, приобретённое у нас.",
  },
  {
    title: "Лицензированное оборудование",
    description:
      "Всё оборудование проходит проверку и сертификацию в России. Это позволяет избежать дефектов и обеспечить высокий уровень работы.",
  },
  {
    title: "Сертифицированные сотрудники",
    description:
      "Все наши сотрудники прошли специальную подготовку и имеют квалификацию инженеров.",
  },
];

const services = [
  {
    icon: Building2,
    title: "Корпоративным клиентам",
    description: "Быстрый бесперебойный доступ к онлайн-ресурсам в вашем офисе",
  },
  {
    icon: Radio,
    title: "Операторам связи",
    description: 'Надёжная инфраструктура для "умных" решений и защиты дома',
  },
  {
    icon: HardHat,
    title: "Застройщикам и УК",
    description:
      "Непрерывная работа сети и оперативная помощь в технических вопросах",
  },
];

const docs = [
  {
    title: "Презентация",
    href: "/upload/prezentaciya_Uniontel.pdf",
    icon: FileText,
  },
  {
    title: "Заявление о заключении договора",
    href: "/upload/zayavleniye_o_zakliuchenii_dogovora.doc",
    icon: FileText,
  },
];

const faqItems = [
  {
    id: "biz-faq1",
    question: "Как подключиться к интернету?",
    answer:
      "Заполните форму заявки на нашем сайте или позвоните по телефону 8 (495) 792-59-88. Менеджер уточнит ваши потребности, и мы проверим техническую возможность подключения интернета iFlat в вашем районе. Если техническая возможность есть — менеджер подготовит коммерческое предложение, инженеры установят необходимое оборудование и подключат ваш офис к услуге. Если технической возможности нет — подготовим предложение на проектирование и строительство кабельной сети.",
  },
  {
    id: "biz-faq2",
    question: "Как определить требуемую скорость интернета?",
    answer:
      "Выбрать скорость интернета поможет менеджер, который примет вашу заявку. Он уточнит необходимые параметры: сколько сотрудников в офисе, пользуетесь ли видеоконтентом, проводите ли видеоконференции, работаете ли с CRM/ERM-системами, какие дополнительные услуги будете подключать, планируете ли увеличивать штат. На основании этих данных специалист подскажет оптимальную скорость интернета.",
  },
  {
    id: "biz-faq3",
    question: "Мы проводим много видеоконференций и хотим быть уверены в качестве трансляций.",
    answer:
      "Наш интернет работает стабильно, без сбоев и задержек сигнала. Мы резервируем каналы связи на случай внезапных неисправностей.",
  },
  {
    id: "biz-faq4",
    question: "У нас несколько офисов. Можно ли объединить их в корпоративную сеть?",
    answer: "Да, такая возможность есть.",
  },
];

export default function BusinessInternetPage() {
  return (
    <>
      <HeroBanner
        title="Интернет для бизнеса"
        subtitle="Бесперебойное соединение со скоростью до 100 Гбит/с. Корпоративные тарифы, выделенные каналы связи, телефония."
        backgroundImage="/images/hero/econom-na-usluge-internet-i-tv_1.webp"
        compact
      />

      {/* Services list */}
      <ScrollReveal>
        <section className="py-16 lg:py-20 bg-brand-surface">
          <div className="container">
            <SectionTitle
              title="Услуги для бизнеса"
              subtitle="Комплексные телекоммуникационные решения для вашего предприятия"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-3 max-w-3xl mx-auto">
              {[
                "Безлимитный интернет для офиса",
                "Облачное видеонаблюдение",
                "Интерактивное телевидение для бизнеса",
                "Проектирование / строительство и обслуживание кабельных сетей",
                "Телефония в коде 499, 498, 496, 495",
                "Публичный Wi-Fi",
                "Выделенный IP-адрес",
                "Выдача технических условий (интернет, телевидение, безопасный регион, телефония)",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 py-2">
                  <div className="w-5 h-5 rounded-full bg-brand-primary-light flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-brand-primary" />
                  </div>
                  <span className="text-text-secondary">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* Why choose us */}
      <ScrollReveal delay={0.05}>
        <section className="py-16 lg:py-24">
          <div className="container">
            <SectionTitle title="Почему клиенты выбирают нас" badge="ПРЕИМУЩЕСТВА" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {whyUs.map(({ icon: Icon, title, description }) => (
                <Card key={title} className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-brand-primary-light flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-brand-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{title}</h3>
                  <p className="text-text-secondary text-sm">{description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* Why trusted */}
      <ScrollReveal delay={0.05}>
        <section className="py-16 lg:py-24 bg-brand-surface">
          <div className="container">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
              <div>
                <SectionTitle title="Почему нам доверяют" centered={false} />
                <div className="space-y-6">
                  {trustedReasons.map(({ title, description }) => (
                    <div key={title}>
                      <h3 className="font-semibold text-text-primary mb-1">
                        {title}
                      </h3>
                      <p className="text-text-secondary text-sm">{description}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {services.map(({ icon: Icon, title, description }) => (
                  <Card key={title} hover className="p-5 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-brand-primary-light flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-brand-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{title}</h3>
                      <p className="text-text-secondary text-sm">{description}</p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* Tariffs */}
      <ScrollReveal delay={0.05}>
        <CarouselSection
          title="Базовые тарифы"
          subtitle="Окончательная цена будет зависеть от оборудования, условий подключения и индивидуальных настроек"
          slidesPerView={{ base: 1, sm: 2, md: 2, lg: 3 }}
        >
          {businessTariffs.map((plan) => (
            <TariffCard key={plan.id} plan={plan} />
          ))}
        </CarouselSection>
      </ScrollReveal>
      <div className="container">
        <p className="text-center text-sm text-text-secondary -mt-12 mb-16">
          Стоимость подключения: 5 000 ₽. Выделенный IP-адрес: 400 ₽/мес.
          Тарифы действуют в Можайском, Боровском и Наро-Фоминском районах.
        </p>
      </div>

      {/* Documents */}
      <ScrollReveal delay={0.05}>
        <section className="py-12 bg-brand-surface">
          <div className="container">
            <SectionTitle title="Документы" />
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {docs.map(({ title, href, icon: Icon }) => (
                <a
                  key={title}
                  href={href}
                  download
                  className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 shadow-sm px-6 py-4 hover:shadow-md transition-shadow group"
                >
                  <div className="w-10 h-10 rounded-lg bg-brand-primary-light flex items-center justify-center">
                    <Icon className="w-5 h-5 text-brand-primary" />
                  </div>
                  <span className="font-medium text-text-primary group-hover:text-brand-primary transition-colors">
                    {title}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* FAQ */}
      <ScrollReveal delay={0.05}>
        <section className="py-16 lg:py-24 bg-brand-surface">
          <div className="container">
            <SectionTitle
              title="Часто задаваемые вопросы"
              subtitle="Остались вопросы? Найдите ответы здесь"
            />
            <div className="max-w-3xl mx-auto">
              <Accordion items={faqItems} />
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
    </>
  );
}
