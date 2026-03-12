import type { Metadata } from "next";
import { HeroBanner } from "@/components/sections/HeroBanner";
import { FeatureCards } from "@/components/sections/FeatureCards";
import { ConnectionSection } from "@/components/sections/ConnectionSection";
import { CTABanner } from "@/components/sections/CTABanner";
import { FaqSection } from "@/components/sections/FaqSection";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { Button } from "@/components/ui/Button";
import Image from "next/image";
import { AppSection } from "@/components/sections/AppSection";
import { Check, Star } from "lucide-react";

export const metadata: Metadata = {
  title: "Облачное видеонаблюдение",
  description: "Облачное видеонаблюдение для дома и офиса от провайдера iFlat. Услуга под ключ — выбор камеры, монтаж, подключение, настройка. Техподдержка 24/7.",
};

const features = [
  { image: "/images/services/video_feature_1.svg", title: "Комплексный подход", description: "Отвечаем не только за настройки сервиса, но и за стабильное интернет-соединение" },
  { image: "/images/services/video_feature_2.svg", title: "Хранение записей", description: "Хранение файлов в облаке безопасно и менее затратно" },
  { image: "/images/services/video_feature_3.svg", title: "Российские серверы", description: "Мы вас не отключим — все данные хранятся в России" },
  { image: "/images/services/video_feature_4.svg", title: "Защита данных", description: "Видеоархив закодирован, никто кроме вас не имеет доступа к нему" },
  { image: "/images/services/video_feature_5.svg", title: "Удаленный контроль", description: "Просматривайте видео с камеры в реальном времени и в записи из любой точки мира" },
  { image: "/images/services/video_feature_6.svg", title: "Удобный поиск событий", description: "Вы можете быстро найти нужную запись по дате и времени события" },
];

const capabilities = [
  "Удаленный просмотр видео с камер в реальном времени и из архива",
  "Хранение записей на облаке до 30 дней",
  "Защита ваших данных в облаке iFlat",
  "Пакетное решение: оборудование + подключение + монтаж + настройка",
  "Личный кабинет абонента",
  "Круглосуточная техническая поддержка",
];

const trustPoints = [
  {
    title: "Услуга под ключ",
    desc: "Оказываем услугу под ключ: от выбора камеры до монтажа и настройки оборудования. Это залог надежности системы облачного видеонаблюдения",
  },
  {
    title: "Гарантия",
    desc: "Даем гарантию на работу и оборудование, приобретенное у нас",
  },
  {
    title: "Лицензированное оборудование",
    desc: "Все наше оборудование проходит проверку и сертификацию в России. Это позволяет избежать дефектов и обеспечить высокий уровень защиты данных",
  },
  {
    title: "Сертифицированные сотрудники",
    desc: "Все наши сотрудники прошли специальную подготовку и имеют квалификацию инженеров по видеонаблюдению",
  },
];

const tariffs = [
  {
    name: "Тариф 5 дней",
    days: 5,
    price: 450,
    features: ["Круглосуточная запись", "Архив 5 дней", "Неограниченный битрейт"],
    popular: false,
  },
  {
    name: "Тариф 15 дней",
    days: 15,
    price: 600,
    features: ["Круглосуточная запись", "Архив 15 дней", "Неограниченный битрейт"],
    popular: true,
  },
  {
    name: "Тариф 30 дней",
    days: 30,
    price: 800,
    features: ["Круглосуточная запись", "Архив 30 дней", "Неограниченный битрейт"],
    popular: false,
  },
];

const faqItems = [
  {
    id: "faq1",
    question: "Как работает облачное видеонаблюдение?",
    answer: "Подключенная к интернету домашняя, офисная или уличная камера ведет запись и передает видео в облачное хранилище. Все данные с камер защищены и хранятся в зашифрованном виде — доступ есть только у вас. Данные видеоархива нельзя уничтожить, украсть или потерять. Вы в любой момент можете подключиться к облачному хранилищу и посмотреть трансляцию в режиме реального времени или найти в архиве нужную запись с камеры.",
  },
  {
    id: "faq2",
    question: "Как подключить облачное видеонаблюдение?",
    answer: "Подключить услугу просто. Оставьте заявку на нашем сайте. С вами в течение часа свяжется менеджер и поможет подобрать видеокамеру и тариф. После утверждения проекта наши инженеры установят и подключат оборудование, протестируют и настроят, как вам необходимо.",
  },
  {
    id: "faq3",
    question: "Как настроить облачное видеонаблюдение?",
    answer: "Настроить услугу облачного видеонаблюдения можно самостоятельно с помощью подробной инструкции или с помощью квалифицированных специалистов компании iFlat.",
  },
  {
    id: "faq4",
    question: "Каковы этапы нашего взаимодействия?",
    answer: "1. Вы звоните по телефону +7 (495) 792-59-88 или оставляете заявку на подключение через форму. 2. Наш менеджер в течение часа связывается с вами, выясняет ваши потребности, консультирует и оформляет заявку. 3. При стандартном подключении (1 камера в помещении) в согласованный день приезжает бригада инженеров: монтирует и подключает в этот же день. При нестандартном подключении (от 2 камер/на улице/коммерческий объект) вначале выезжает специалист для замеров и составления сметы. 4. Договор-оферту заключаете на сайте в личном кабинете абонента.",
  },
  {
    id: "faq5",
    question: "Нужно ли подключать интернет iFlat, чтобы пользоваться облачным видеонаблюдением?",
    answer: "Да, услуга предоставляется только абонентам iFlat. Дело в том, что облачное видеонаблюдение привязано к оператору: мы отвечаем в комплексе за связь и облако. Кроме того, нужен стабильный скоростной интернет, но мы не сможем гарантировать качество интернет-соединения стороннего провайдера.",
  },
  {
    id: "faq6",
    question: "Можно ли использовать свои камеры видеонаблюдения?",
    answer: "Стандартно услуга доступна, если абонент приобретает наши камеры с нашей собственной прошивкой — это гарантирует их бесперебойную работу и защиту от взлома. Мы даем гарантию только на наше оборудование. Если вы приобретаете камеру на стороннем ресурсе, мы не отвечаем за ее работоспособность.",
  },
  {
    id: "faq7",
    question: "Что такое PoE?",
    answer: "Технология PoE позволяет установить камеру по UTP кабелю на расстояние до 100 метров от розетки 220V. Это сокращает денежные затраты на прокладку электрического кабеля до места установки вашей видеокамеры.",
  },
  {
    id: "faq8",
    question: "Как посмотреть архив и события видеокамеры?",
    answer: "Просматривать видеозаписи вы можете через web-интерфейс в своем браузере на ПК или через мобильное приложение. Для этого необходимо подключиться к интернету.",
  },
  {
    id: "faq9",
    question: "Как получить семейный доступ к видеонаблюдению?",
    answer: "Вы можете сами настроить семейный доступ и поделиться трансляцией в личном кабинете абонента.",
  },
];

export default function VideoNablyudeniePage() {
  return (
    <>
      <HeroBanner
        title="Облачное видеонаблюдение"
        subtitle="Контролируйте квартиру, дачу или офис из любой точки мира через мобильное приложение"
        backgroundImage="/images/hero/cctv_1.webp"
        compact
      />

      <ScrollReveal>
        <section className="py-16 lg:py-24">
          <div className="container">
            <SectionTitle
              title="Возможности сервиса облачного наблюдения iFlat"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-3xl mx-auto">
              {capabilities.map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <Check size={18} className="text-brand-primary mt-0.5 flex-shrink-0" />
                  <span className="text-text-secondary">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal delay={0.05}>
        <section className="py-16 lg:py-24 bg-brand-surface">
          <div className="container">
            <SectionTitle title="Преимущества облачного видеонаблюдения" badge="ПРЕИМУЩЕСТВА" />
            <FeatureCards features={features} />
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal delay={0.05}>
        <section className="py-16 lg:py-24 bg-[#EBEBEB]">
          <div className="container">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl lg:text-4xl font-bold text-text-primary mb-8">Почему нам доверяют</h2>
              <ul className="space-y-6">
                {trustPoints.map((point) => (
                  <li key={point.title} className="flex items-start gap-3">
                    <Check size={20} className="text-brand-primary mt-1 flex-shrink-0" />
                    <div>
                      <span className="font-semibold text-brand-primary">{point.title}</span>
                      <br />
                      <span className="text-text-secondary">{point.desc}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal delay={0.05}>
        <section className="py-16 lg:py-24">
          <div className="container">
            <SectionTitle title="Тарифные планы облачного видеонаблюдения iFlat" badge="ТАРИФЫ" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-10">
              {tariffs.map((tariff) => (
                <div
                  key={tariff.name}
                  className={`rounded-2xl shadow-md flex flex-col justify-between overflow-hidden relative ${tariff.popular ? "ring-2 ring-brand-primary" : "bg-white"}`}
                >
                  {tariff.popular && (
                    <div className="bg-brand-primary text-white text-xs font-semibold text-center py-1.5 uppercase tracking-wide flex items-center justify-center gap-1">
                      <Star size={12} />
                      Хит продаж
                    </div>
                  )}
                  <div className="bg-white p-6 text-center flex-1">
                    <h3 className="text-xl font-semibold text-text-primary mb-4">{tariff.name}</h3>
                    <p className="text-6xl font-black text-text-primary mb-1">{tariff.days}</p>
                    <p className="text-text-secondary text-sm mb-4">дней хранения</p>
                    <ul className="text-left space-y-2 mb-6">
                      {tariff.features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-sm text-text-secondary">
                          <Check size={14} className="text-brand-primary flex-shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <div className="border-t border-gray-100 pt-4">
                      <p className="text-3xl font-bold text-brand-primary">{tariff.price} <span className="text-base font-normal text-text-secondary">руб/мес</span></p>
                    </div>
                  </div>
                  <div className="bg-white p-4 border-t border-gray-100 text-center">
                    <Button size="sm" className="w-full">Подключить</Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="max-w-2xl mx-auto">
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between p-5 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-brand-primary"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
                    </div>
                    <span className="font-medium text-text-primary">Личный кабинет для оплаты и смены тарифа</span>
                  </div>
                  <a href="https://video.iflat.ru/" target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline">Перейти</Button>
                  </a>
                </div>
                <div className="flex items-center justify-between p-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-brand-primary"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    </div>
                    <span className="font-medium text-text-primary">Договор оферты «Видеонаблюдение»</span>
                  </div>
                  <a href="/upload/oferta_video.pdf" target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline">Скачать</Button>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal delay={0.05}>
        <section className="py-16 lg:py-24 bg-brand-surface">
          <div className="container">
            <SectionTitle title="Выберите камеру для видеонаблюдения" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <Card className="overflow-hidden">
                <div className="h-56 bg-white flex items-center justify-center p-6">
                  <Image src="/images/services/template56_images_cam1.png" alt="OMNY miniDome" width={200} height={160} className="object-contain" />
                </div>
                <div className="p-6">
                  <h3 className="font-semibold text-lg mb-2">OMNY miniDome 2E-WDS-SDL 28</h3>
                  <p className="text-text-secondary text-sm mb-3">Камера сетевая купольная 2Мп с двойной подсветкой и микрофоном</p>
                  <ul className="text-xs text-text-secondary space-y-1 mb-4">
                    <li>Режим &ldquo;День/ночь&rdquo;: механический ИК фильтр</li>
                    <li>Фокусное расстояние объектива: 2.8мм</li>
                    <li>Горизонтальный угол обзора: 100°</li>
                    <li>Интерфейс: RJ-45 (10/100Base-T)</li>
                    <li>Wi-Fi: нет (подключение по кабелю)</li>
                  </ul>
                  <div className="border-t border-gray-100 pt-4">
                    <p className="text-2xl font-bold text-brand-primary">7 440 <span className="text-sm font-normal text-text-secondary">руб.</span></p>
                  </div>
                </div>
              </Card>
              <Card className="overflow-hidden">
                <div className="h-56 bg-white flex items-center justify-center p-6">
                  <Image src="/images/services/template56_images_cam2.png" alt="OMNY BASE miniBullet" width={200} height={160} className="object-contain" />
                </div>
                <div className="p-6">
                  <h3 className="font-semibold text-lg mb-2">OMNY BASE miniBullet 2E-WDS-SDL-C 36</h3>
                  <p className="text-text-secondary text-sm mb-3">Камера сетевая с двойной подсветкой и микрофоном</p>
                  <ul className="text-xs text-text-secondary space-y-1 mb-4">
                    <li>Матрица: SC200AI, Процессор: SSC335</li>
                    <li>ИК-подсветка до: 30м</li>
                    <li>Одновременных подключений: 10</li>
                    <li>Битрейт: 256-8000 Кбит/с</li>
                    <li>Аудио: Встроенный микрофон</li>
                  </ul>
                  <div className="border-t border-gray-100 pt-4">
                    <p className="text-2xl font-bold text-brand-primary">7 875 <span className="text-sm font-normal text-text-secondary">руб.</span></p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal delay={0.05}>
        <AppSection />
      </ScrollReveal>

      {/* Полезная информация */}
      <ScrollReveal delay={0.05}>
        <section className="py-16 lg:py-24 bg-brand-surface">
          <div className="container">
            <SectionTitle title="Полезная информация для абонента" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {[
                {
                  title: "Подключение видеокамеры",
                  desc: "Как подключить и настроить облачное видеонаблюдение",
                  href: "/videonablyudenie/591/",
                  image: "/images/services/video_info1.png",
                },
                {
                  title: "Плюсы облачного видеонаблюдения",
                  desc: "Чем полезна данная услуга для вас и ваших близких",
                  href: "/videonablyudenie/592/",
                  image: "/images/services/video_info2.png",
                },
                {
                  title: "Где применяется услуга",
                  desc: "Где лучше использовать облачное видеонаблюдение",
                  href: "/videonablyudenie/593/",
                  image: "/images/services/video_info3.png",
                },
              ].map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="group block bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                >
                  <div className="relative aspect-video overflow-hidden rounded-t-2xl">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  </div>
                  <div className="p-6 flex flex-col">
                    <h3 className="font-semibold text-text-primary mb-2 group-hover:text-brand-primary transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-text-secondary text-sm flex-1">{item.desc}</p>
                    <div className="mt-4 text-brand-primary text-sm font-medium">
                      Подробнее →
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal delay={0.05}>
        <FaqSection items={faqItems} />
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
