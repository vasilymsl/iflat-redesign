import type { Metadata } from "next";
import { HeroBanner } from "@/components/sections/HeroBanner";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { Card } from "@/components/ui/Card";
import { siteConfig } from "@/config/site";
import { Phone, Mail, MapPin, Clock, MessageCircle } from "lucide-react";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Контакты — офисы обслуживания, адреса и время работы",
  description: "Контакты провайдера iFlat. Адреса офисов, график работы, телефоны.",
};

const offices = [
  { city: "г. Наро-Фоминск", address: "МО, г. Наро-Фоминск, Кубинское шоссе, 5С", hours: "ПН–ПТ: 09:00–18:00 (перерыв 14:00–15:00)", weekend: "СБ–ВС: выходные" },
  { city: "п. Санаторий им. Герцена", address: "МО, Одинцовский р-н, п. Санаторий имени Герцена, д. 23", hours: "ВТ, ЧТ: 09:00–18:00 (перерыв 13:00–14:00)", weekend: "Остальные дни: выходные" },
  { city: "рп. Селятино", address: "МО, Наро-Фоминский го., рп. Селятино, Спортивная ул. 4", hours: "ПН–ПТ: 09:00–18:00 (перерыв 13:00–14:00)", weekend: "СБ–ВС: выходные" },
];

export default function ContactPage() {
  return (
    <>
      <HeroBanner
        title="Контакты"
        subtitle="Контактная информация, адреса и графики работы офисов"
        backgroundImage="/images/hero/contacts_1.webp"
        compact
      />

      <ScrollReveal>
        <section className="py-16 lg:py-24">
          <div className="container">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div>
                <h2 className="text-2xl font-bold mb-8">Для частных и корпоративных клиентов</h2>
                <div className="space-y-5">
                  <a href={siteConfig.phoneHref} className="flex items-center gap-4 text-xl font-semibold text-text-primary hover:text-brand-primary transition-colors">
                    <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-brand-primary-light text-brand-primary"><Phone className="w-6 h-6" /></div>
                    {siteConfig.phone}
                  </a>
                  <a href={siteConfig.phoneFreeHref} className="flex items-center gap-4 text-xl font-semibold text-text-primary hover:text-brand-primary transition-colors">
                    <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-brand-primary-light text-brand-primary"><Phone className="w-6 h-6" /></div>
                    <div>{siteConfig.phoneFree}<span className="block text-sm font-normal text-text-secondary">бесплатно по России</span></div>
                  </a>
                  <a href={`mailto:${siteConfig.email}`} className="flex items-center gap-4 text-lg text-text-primary hover:text-brand-primary transition-colors">
                    <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-brand-primary-light text-brand-primary"><Mail className="w-6 h-6" /></div>
                    <div>{siteConfig.email}<span className="block text-sm font-normal text-text-secondary">общие вопросы</span></div>
                  </a>
                  <a href="mailto:support@iflat.ru" className="flex items-center gap-4 text-lg text-text-primary hover:text-brand-primary transition-colors">
                    <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-brand-primary-light text-brand-primary"><Mail className="w-6 h-6" /></div>
                    <div>support@iflat.ru<span className="block text-sm font-normal text-text-secondary">техническая поддержка</span></div>
                  </a>
                  <a href={siteConfig.social.telegram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 text-lg text-text-primary hover:text-brand-primary transition-colors">
                    <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-brand-primary-light text-brand-primary"><MessageCircle className="w-6 h-6" /></div>
                    Telegram
                  </a>
                  <a href={siteConfig.social.vk} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 text-lg text-text-primary hover:text-brand-primary transition-colors">
                    <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-brand-primary-light text-brand-primary">
                      <Image src="/images/social/vk-footer.svg" alt="VK" width={24} height={24} />
                    </div>
                    <div>Мы ВКонтакте<span className="block text-sm font-normal text-text-secondary">{siteConfig.social.vk}</span></div>
                  </a>
                  <a href="https://yandex.ru/maps/-/CLhtR6ME" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 text-lg text-text-primary hover:text-brand-primary transition-colors">
                    <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-brand-primary-light text-brand-primary"><MapPin className="w-6 h-6" /></div>
                    <div>Яндекс.Отзывы<span className="block text-sm font-normal text-text-secondary">Оставьте отзыв о нашей работе</span></div>
                  </a>
                </div>

                <div className="mt-4 flex items-center gap-3">
                  {[
                    { name: "VK", href: siteConfig.social.vk, icon: "/images/social/vk-footer.svg" },
                    { name: "OK", href: siteConfig.social.ok, icon: "/images/social/ok-footer.svg" },
                    { name: "Telegram", href: siteConfig.social.telegram, icon: "/images/social/tg-footer.svg" },
                    { name: "Max", href: siteConfig.social.max, icon: "/images/social/max-footer.svg" },
                  ].map((s) => (
                    <a key={s.name} href={s.href} target="_blank" rel="noopener noreferrer" className="w-12 h-12 flex items-center justify-center rounded-xl bg-brand-secondary text-white hover:bg-brand-dark transition-colors" aria-label={s.name}>
                      <Image src={s.icon} alt={s.name} width={20} height={20} />
                    </a>
                  ))}
                </div>

                {/* Mobile app */}
                <div className="mt-10 p-6 rounded-2xl bg-brand-surface">
                  <h3 className="font-semibold mb-3">Мобильное приложение iFlat</h3>
                  <p className="text-text-secondary text-sm mb-4">Удобно пополнять баланс, управлять услугами, связаться с поддержкой 24/7</p>
                  <div className="flex gap-3">
                    <a href={siteConfig.apps.googlePlay} target="_blank" rel="noopener noreferrer">
                      <Image src="/images/app/google-play.png" alt="Google Play" width={135} height={40} />
                    </a>
                    <a href={siteConfig.apps.appStore} target="_blank" rel="noopener noreferrer">
                      <Image src="/images/app/app-store.png" alt="App Store" width={120} height={40} />
                    </a>
                  </div>
                </div>
              </div>

              <div className="bg-gray-200 rounded-2xl overflow-hidden min-h-[400px] flex items-center justify-center">
                <div className="text-center text-text-secondary">
                  <MapPin className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Яндекс.Карта</p>
                  <p className="text-sm mt-1">Здесь будет встроена интерактивная карта</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal delay={0.05}>
        <section className="py-16 lg:py-24 bg-brand-surface">
          <div className="container">
            <SectionTitle title="Офисы обслуживания" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {offices.map((office) => (
                <Card key={office.city} className="p-6 hover:shadow-md transition-shadow">
                  <h3 className="text-lg font-semibold mb-4">{office.city}</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-3 text-text-secondary">
                      <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-brand-primary" />
                      {office.address}
                    </div>
                    <div className="flex items-start gap-3 text-text-secondary">
                      <Clock className="w-4 h-4 mt-0.5 flex-shrink-0 text-brand-primary" />
                      <div><div>{office.hours}</div><div>{office.weekend}</div></div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </ScrollReveal>
    </>
  );
}
