import type { Metadata } from "next";
import { HeroBanner } from "@/components/sections/HeroBanner";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import Image from "next/image";
import { MapPin, Briefcase, Clock, ChevronDown, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Вакансии — работа в iFlat",
  description:
    "Актуальные вакансии провайдера iFlat. Монтажники, операторы службы поддержки, менеджеры по работе с клиентами. Официальное трудоустройство.",
};

interface Vacancy {
  id: number;
  title: string;
  location: string;
  experience: string;
  employment: string;
  schedule: string;
  salary: string;
  duties: string[];
  requirements: string[];
  conditions: string[];
  phone: string;
}

const vacancies: Vacancy[] = [
  {
    id: 1,
    title: "Оператор службы поддержки клиентов",
    location: "МО, рп Селятино (или удалённо)",
    experience: "Без опыта",
    employment: "Полная занятость",
    schedule: "2/2, с 09:00 до 21:00",
    salary: "50 000 — 70 000 ₽/мес",
    duties: [
      "Консультирование абонентов по услугам компании",
      "Помощь в решении технических вопросов",
      "Оформление заявок на выезд сервисных инженеров",
    ],
    requirements: [
      "Пользователь ПК",
      "Грамотная устная речь",
      "Коммуникабельность, стрессоустойчивость",
      "Знание базовых принципов работы интернета",
    ],
    conditions: [
      "Официальное трудоустройство согласно ТК РФ",
      "Доход в месяц 50 000 – 70 000 ₽ (оклад + премии и сделка)",
      "Работа на территории работодателя (МО, рп Селятино) или удалённо",
      "Бесплатный доступ к услугам компании (домашний интернет и цифровое ТВ)",
      "Дружный коллектив, опытные наставники и обучение",
    ],
    phone: "+7 903 513-52-33",
  },
  {
    id: 2,
    title: "Монтажник интернет-сетей",
    location: "Наро-Фоминский район",
    experience: "Без опыта",
    employment: "Полная занятость",
    schedule: "5/2, с 09:00 до 18:00 (плавающие выходные)",
    salary: "70 000 — 130 000 ₽/мес",
    duties: [
      "Подключение абонентов к услугам компании (интернет, ТВ, видеонаблюдение)",
      "Установка и настройка абонентского оборудования (GPON терминал, IPTV приставка, роутер)",
      "Производство аварийно-ремонтных работ, диагностика линий связи",
    ],
    requirements: [
      "Пользователь ПК",
      "Коммуникабельность, стрессоустойчивость",
      "Умение работать с монтажным инструментом",
      "Отсутствие противопоказаний к выполнению работ на высоте",
    ],
    conditions: [
      "Официальное трудоустройство согласно ТК РФ",
      "Доход в месяц 70 000 – 130 000 ₽ (оклад + премии и сделка)",
      "Работа на территории Наро-Фоминского района",
      "Компенсация мобильной связи",
      "Бесплатный доступ к услугам компании (интернет, ТВ)",
      "Дружный коллектив, опытные наставники и обучение",
    ],
    phone: "+7 965 221-38-33",
  },
  {
    id: 3,
    title: "Менеджер по работе с клиентами (B2B, B2O)",
    location: "МО, г. Наро-Фоминск, ул. Московская, д. 8",
    experience: "От 1 года",
    employment: "Полная занятость",
    schedule: "5/2, с 9:00 до 18:00",
    salary: "60 000 — 80 000 ₽/мес",
    duties: [
      "Продажа телекоммуникационных услуг (B2B, B2O)",
      "Сопровождение сделок в CRM-системе",
      "Участие в электронных аукционах",
    ],
    requirements: [
      "Пользователь ПК",
      "Грамотная устная речь",
      "Коммуникабельность, стрессоустойчивость",
      "Опыт работы в продажах приветствуется (от 1 года)",
    ],
    conditions: [
      "Официальное трудоустройство согласно ТК РФ",
      "Доход в месяц 60 000 – 80 000 ₽ (оклад + премии и сделка)",
      "Работа на территории работодателя (МО, г. Наро-Фоминск, ул. Московская, д. 8)",
      "Бесплатный доступ к услугам компании (домашний интернет и цифровое ТВ)",
      "Дружный коллектив, опытные наставники и обучение",
    ],
    phone: "+7 903 196-67-95",
  },
  {
    id: 4,
    title: "Менеджер по работе с клиентами в г. Наро-Фоминск",
    location: "МО, г. Наро-Фоминск, ул. Московская, д. 8",
    experience: "От 1 года",
    employment: "Полная занятость",
    schedule: "5/2, с 9:00 до 18:00",
    salary: "от 40 000 ₽/мес",
    duties: [
      "Консультирование абонентов по услугам компании",
      "Обработка заявок на подключение к услугам компании",
      "Приём платежей, ведение внутреннего документооборота",
    ],
    requirements: [
      "Пользователь ПК",
      "Грамотная устная речь",
      "Коммуникабельность, стрессоустойчивость",
    ],
    conditions: [
      "Официальное трудоустройство согласно ТК РФ",
      "Доход в месяц от 40 000 ₽ (оклад) + премия",
      "Работа на территории работодателя (МО, г. Наро-Фоминск, ул. Московская, д. 8)",
      "Бесплатный доступ к услугам компании (домашний интернет и цифровое ТВ)",
      "Дружный коллектив, опытные наставники и обучение",
    ],
    phone: "+7 968 934-47-27",
  },
  {
    id: 5,
    title: "Распространитель рекламных материалов",
    location: "Наро-Фоминский район",
    experience: "Без опыта",
    employment: "Полная / частичная занятость",
    schedule: "Гибкий",
    salary: "от 30 000 ₽/мес",
    duties: [
      "Распространение рекламных материалов (листовки, таблички, магниты)",
    ],
    requirements: [
      "Ответственность",
      "Исполнительность",
      "Коммуникабельность",
    ],
    conditions: [
      "Официальное трудоустройство согласно ТК РФ",
      "Доход в месяц от 30 000 ₽ (оклад) + премии",
      "Доставка к месту работы и обратно на корпоративном транспорте",
      "Бесплатный доступ к услугам компании (домашний интернет и цифровое ТВ)",
    ],
    phone: "+7 903 513-52-33",
  },
];

const benefits = [
  {
    image: "/images/services/vacancy_feature_1.svg",
    title: "Прозрачные условия",
    description: "Официальное трудоустройство, оплата больничных и отпусков",
  },
  {
    image: "/images/services/vacancy_feature_2.svg",
    title: "Лёгкий старт",
    description: "Отзывчивый коллектив и обучение от опытного наставника",
  },
  {
    image: "/images/services/vacancy_feature_3.svg",
    title: "Корпоративные бонусы",
    description: "Бесплатный интернет, цифровое ТВ и скидки на оборудование",
  },
];

export default function VacancyPage() {
  return (
    <>
      <HeroBanner
        title="Вакансии"
        subtitle="Мы уверены, что достижение любой цели начинается с правильного подбора людей. Наши двери открыты для специалистов, которые хотят двигаться вперёд вместе с нами."
        backgroundImage="/images/hero/nashi-vakansii_1.webp"
        compact
      />

      {/* Benefits */}
      <ScrollReveal>
        <section className="py-16 lg:py-20 bg-brand-surface">
          <div className="container">
            <SectionTitle title="Развивайся вместе с iFlat" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
              {benefits.map(({ image, title, description }) => (
                <div key={title} className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-brand-primary-light flex items-center justify-center mx-auto mb-4">
                    <Image src={image} alt="" width={40} height={40} className="w-10 h-10 object-contain" />
                  </div>
                  <h3 className="font-semibold mb-2">{title}</h3>
                  <p className="text-sm text-text-secondary">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* Vacancies */}
      <ScrollReveal delay={0.05}>
        <section className="py-16 lg:py-24">
          <div className="container">
            <SectionTitle title="Доступные вакансии" />
            <div className="max-w-3xl mx-auto space-y-4">
              {vacancies.map((vacancy) => (
                <details
                  key={vacancy.id}
                  className="group border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm"
                >
                  <summary className="flex items-center justify-between p-6 cursor-pointer hover:bg-gray-50 transition-colors list-none">
                    <div className="flex-1 min-w-0 pr-4">
                      <h2 className="text-lg font-semibold text-text-primary mb-2">
                        {vacancy.title}
                      </h2>
                      <div className="flex flex-wrap gap-3 text-sm text-text-secondary">
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 flex-shrink-0" />
                          {vacancy.location}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <UserCheck className="w-4 h-4 flex-shrink-0" />
                          {vacancy.experience}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Briefcase className="w-4 h-4 flex-shrink-0" />
                          {vacancy.employment}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4 flex-shrink-0" />
                          {vacancy.schedule}
                        </span>
                      </div>
                      <p className="mt-2 text-brand-primary font-semibold text-sm">
                        {vacancy.salary}
                      </p>
                    </div>
                    <ChevronDown className="w-5 h-5 text-text-secondary flex-shrink-0 transition-transform duration-200 group-open:rotate-180" />
                  </summary>

                  <div className="px-6 pb-6 border-t border-gray-100 pt-5">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                      <div>
                        <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wide mb-2">
                          Обязанности
                        </h3>
                        <ul className="space-y-1">
                          {vacancy.duties.map((d) => (
                            <li key={d} className="text-sm text-text-secondary flex items-start gap-2">
                              <span className="text-brand-primary mt-1">•</span>
                              {d}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wide mb-2">
                          Требования
                        </h3>
                        <ul className="space-y-1">
                          {vacancy.requirements.map((r) => (
                            <li key={r} className="text-sm text-text-secondary flex items-start gap-2">
                              <span className="text-brand-primary mt-1">•</span>
                              {r}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wide mb-2">
                          Условия
                        </h3>
                        <ul className="space-y-1">
                          {vacancy.conditions.map((c) => (
                            <li key={c} className="text-sm text-text-secondary flex items-start gap-2">
                              <span className="text-brand-primary mt-1">•</span>
                              {c}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <a
                        href="mailto:hr@iflat.ru"
                        className={cn(
                          "inline-flex items-center justify-center font-semibold rounded-xl transition-colors",
                          "bg-brand-primary text-white hover:bg-brand-primary-hover",
                          "px-4 py-2 text-sm"
                        )}
                      >
                        Отправить анкету
                      </a>
                      <a
                        href={`tel:${vacancy.phone.replace(/[\s-]/g, "")}`}
                        className="text-sm text-text-secondary hover:text-brand-primary transition-colors"
                      >
                        Моб. телефон (пн–пт, 10:00–18:00):{" "}
                        <span className="font-medium">{vacancy.phone}</span>
                      </a>
                    </div>
                  </div>
                </details>
              ))}
            </div>

            <p className="text-center text-text-secondary mt-10 text-sm">
              Не нашли подходящую вакансию? Отправьте резюме на{" "}
              <a
                href="mailto:hr@iflat.ru"
                className="text-brand-primary hover:underline font-medium"
              >
                hr@iflat.ru
              </a>
            </p>
          </div>
        </section>
      </ScrollReveal>

      {/* Промо-блок */}
      <ScrollReveal delay={0.05}>
        <section className="py-0 bg-[#EBEBEB]">
          <div className="container">
            <div className="flex flex-col md:flex-row items-stretch overflow-hidden max-w-4xl mx-auto">
              <div className="relative w-full md:w-5/12 aspect-[4/3] md:aspect-auto">
                <Image
                  src="/images/services/vacancy_promo.png"
                  alt="Менеджер по продажам"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 40vw"
                />
              </div>
              <div className="flex-1 flex flex-col justify-center p-8 md:p-10">
                <h2 className="text-2xl font-bold text-text-primary mb-4">
                  Менеджер по продажам (B2B, B2O, B2G)
                </h2>
                <ul className="space-y-2 mb-6">
                  <li className="text-text-secondary flex items-start gap-2">
                    <span className="text-brand-primary mt-0.5">•</span>
                    Продажа телекоммуникационных услуг
                  </li>
                  <li className="text-text-secondary flex items-start gap-2">
                    <span className="text-brand-primary mt-0.5">•</span>
                    Проведение встреч и переговоров
                  </li>
                  <li className="text-text-secondary flex items-start gap-2">
                    <span className="text-brand-primary mt-0.5">•</span>
                    Сопровождение сделок в CRM-системе
                  </li>
                </ul>
                <a
                  href="mailto:hr@iflat.ru?subject=Менеджер по продажам (B2B, B2O, B2G)"
                  className={cn(
                    "inline-flex items-center justify-center font-semibold rounded-xl transition-colors w-fit",
                    "bg-brand-primary text-white hover:bg-brand-primary-hover",
                    "px-6 py-2.5 text-sm"
                  )}
                >
                  Откликнуться
                </a>
              </div>
            </div>
          </div>
        </section>
      </ScrollReveal>
    </>
  );
}
