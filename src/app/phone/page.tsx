import type { Metadata } from "next";
import { HeroBanner } from "@/components/sections/HeroBanner";
import { FeatureCards } from "@/components/sections/FeatureCards";
import { ConnectionSection } from "@/components/sections/ConnectionSection";
import { CTABanner } from "@/components/sections/CTABanner";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { AppSection } from "@/components/sections/AppSection";
import { Button } from "@/components/ui/Button";
import { Check, Download } from "lucide-react";

export const metadata: Metadata = {
  title: "Телефония — городской телефон",
  description: "Подключение городского телефона от провайдера iFlat. Номера 499-, 495-, 496-. Стабильная связь вне погодных условий.",
};

const features = [
  { image: "/images/services/phone_feature_1.svg", title: "Стабильная связь", description: "Связь не зависит от погодных условий и других факторов" },
  { image: "/images/services/phone_feature_2.svg", title: "Номера в коде", description: "Мы готовы подобрать для вас красивые номера в коде -495, -496, -499" },
  { image: "/images/services/phone_feature_3.svg", title: "Быстрая настройка", description: "Вы сразу же можете пользоваться услугой на своем телефонном аппарате" },
];

const tariffs = [
  {
    name: "Комбинированный-1",
    minutes: 0,
    price: 250,
    minuteNote: "Стоимость превышения минут местной связи 0,6 руб",
  },
  {
    name: "Комбинированный-2",
    minutes: 600,
    price: 400,
    minuteNote: "Стоимость превышения минут местной связи 0,6 руб",
    popular: false,
  },
  {
    name: "Безлимитный",
    minutes: 1200,
    price: 650,
    minuteNote: "Стоимость превышения минут местной связи 0,6 руб",
  },
];

const tariffDetails = [
  "Подключение телефонного номера 0 руб",
  "Подключение дополнительной линии 0 руб",
  "Мобильные вызовы московского региона (внутризоновая связь) 2,0 руб/мин",
];

export default function PhonePage() {
  return (
    <>
      <HeroBanner
        title="Надежная телефонная связь!"
        subtitle="Подключите качественную телефонию в квартире или частном доме. Высокое качество связи, выгодные тарифы на местные, междугородние и международные разговоры"
        backgroundImage="/images/hero/phone_1.webp"
        compact
      />

      <ScrollReveal>
        <section className="py-20 lg:py-28">
          <div className="container">
            <SectionTitle
              title="Домашняя телефония"
              subtitle="Высокое качество связи, выгодные тарифы на местные, междугородние и международные разговоры"
              badge="ПРЕИМУЩЕСТВА"
            />
            <FeatureCards features={features} />
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal delay={0.05}>
        <section className="py-16 lg:py-24 bg-brand-surface">
          <div className="container">
            <SectionTitle title="Тарифные планы" badge="ТАРИФЫ" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-10">
              {tariffs.map((tariff) => (
                <div
                  key={tariff.name}
                  className="bg-white rounded-2xl shadow-md flex flex-col justify-between overflow-hidden"
                >
                  <div className="p-6 text-center flex-1">
                    <h3 className="text-xl font-semibold text-text-primary mb-4">{tariff.name}</h3>
                    <p className="text-sm text-text-secondary mb-1">Звонки на местные номера</p>
                    <p className="text-4xl font-bold text-text-primary mb-1">
                      {tariff.minutes === 0 ? "0" : tariff.minutes.toLocaleString("ru-RU")}
                    </p>
                    <p className="text-text-secondary text-sm mb-4">мин/мес</p>
                    <p className="text-xs text-text-secondary mb-6">{tariff.minuteNote}</p>
                    <div className="border-t border-gray-100 pt-4">
                      <p className="text-3xl font-bold text-brand-primary">{tariff.price} <span className="text-base font-normal text-text-secondary">руб/мес</span></p>
                    </div>
                  </div>
                  <div className="p-4 border-t border-gray-100 text-center">
                    <Button size="sm" className="w-full">Подключить</Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="max-w-2xl mx-auto">
              <div className="bg-white rounded-xl p-5 shadow-sm">
                <a
                  href="/upload/pdf/ur_tel.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-brand-primary font-medium hover:underline mb-3"
                >
                  <Download size={16} />
                  Подробная информация о тарифных планах
                </a>
                <ul className="space-y-2">
                  {tariffDetails.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-text-secondary">
                      <Check size={14} className="text-brand-primary mt-0.5 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal delay={0.05}>
        <AppSection />
      </ScrollReveal>

      <ScrollReveal delay={0.05}>
        <section className="py-16 lg:py-24">
          <div className="container">
            <SectionTitle
              title="Зона предоставления услуг"
              subtitle="iFlat обслуживает более 30 000 абонентов, проживающих в частном секторе. Это города, посёлки, деревни, сельские поселения, садовые товарищества и коттеджные посёлки на территории Наро-Фоминского городского округа."
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 mt-8">
              {[
                "г. Наро-Фоминск", "г. Кубинка", "г. Верея", "д. Атепцево", "д. Волченки",
                "д. Таширово", "п. Совхоз Архангельский", "д. Каменка", "д. Васильчиново",
                "д. Мельниково", "д. Назарьево", "д. Ястребово", "КП Николины Сады",
                "КП Николины Озера", "п. Новый Городок", "СНТ Скорость", "СНТ Заречье",
                "д. Алексеевка", "СНТ Лесное МИД", "д. Порядино", "д. Терновка",
                "ПГТ Киевский", "д. Шеломово", "д. Бекасово", "п. Санатория имени Герцена",
                "д. Клово", "д. Афанасовка", "д. Загряжское", "КП Луговое", "д. Акулово",
                "с. Каменское", "д. Чичково", "д. Самород", "д. Крюково", "д. Слизнево",
                "п. Пионерский", "СНТ Вешняки", "д. Любаново", "д. Скугорово", "д. Головково",
                "СНТ Елочка", "д. Александровка",
              ].map((place) => (
                <div
                  key={place}
                  className="px-3 py-2 bg-brand-surface rounded-lg text-sm text-text-secondary text-center"
                >
                  {place}
                </div>
              ))}
            </div>
            <p className="mt-8 text-sm text-text-secondary text-center">
              Не нашли свой населённый пункт?{" "}
              <a href="tel:84957925988" className="text-brand-primary font-medium hover:underline">
                Позвоните нам
              </a>{" "}
              — менеджер проконсультирует вас.
            </p>
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
