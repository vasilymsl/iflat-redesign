import type { Metadata } from "next";
import { HeroBanner } from "@/components/sections/HeroBanner";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { Card } from "@/components/ui/Card";
import { HelpFaqSection } from "@/components/sections/HelpFaqSection";
import { ConnectionSection } from "@/components/sections/ConnectionSection";
import { AppSection } from "@/components/sections/AppSection";
import { siteConfig } from "@/config/site";
import { instructionGroups } from "@/config/faq/help";
import { SupportForm } from "@/components/forms/SupportForm";
import { Phone, MessageCircle, Mail, FileText, Globe, Tv2, CreditCard, DoorOpen } from "lucide-react";

export const metadata: Metadata = {
  title: "Помощь и техническая поддержка",
  description: "Техническая поддержка провайдера iFlat. Ответы на частые вопросы, инструкции по настройке интернета, телевидения, домофонии и видеонаблюдения.",
};

const categoryIcons: Record<string, React.ReactNode> = {
  "Интернет": <Globe className="w-6 h-6" />,
  "Телевидение": <Tv2 className="w-6 h-6" />,
  "Сервисы и оплата": <CreditCard className="w-6 h-6" />,
  "Дополнительные услуги": <DoorOpen className="w-6 h-6" />,
};

export default function HelpPage() {
  return (
    <>
      <HeroBanner
        title="Помощь и поддержка"
        subtitle="Круглосуточная техническая поддержка. Мы всегда на связи!"
        backgroundImage="/images/hero/help-tehpod_1.webp"
        compact
      />

      {/* Контакты поддержки */}
      <ScrollReveal>
        <section className="py-16 lg:py-24">
          <div className="container">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
              <Card className="p-6 text-center hover:shadow-md transition-shadow">
                <div className="w-14 h-14 mx-auto mb-4 flex items-center justify-center rounded-full bg-brand-primary-light text-brand-primary">
                  <Phone className="w-7 h-7" />
                </div>
                <h3 className="font-semibold mb-2">По телефону</h3>
                <a href={siteConfig.phoneHref} className="text-brand-primary font-semibold text-lg">{siteConfig.phone}</a>
                <p className="text-text-secondary text-sm mt-1">Круглосуточно</p>
              </Card>
              <Card className="p-6 text-center hover:shadow-md transition-shadow">
                <div className="w-14 h-14 mx-auto mb-4 flex items-center justify-center rounded-full bg-brand-primary-light text-brand-primary">
                  <MessageCircle className="w-7 h-7" />
                </div>
                <h3 className="font-semibold mb-2">В Telegram</h3>
                <a href={siteConfig.social.telegram} target="_blank" rel="noopener noreferrer" className="text-brand-primary font-semibold">@iflat</a>
                <p className="text-text-secondary text-sm mt-1">Быстрые ответы</p>
              </Card>
              <Card className="p-6 text-center hover:shadow-md transition-shadow">
                <div className="w-14 h-14 mx-auto mb-4 flex items-center justify-center rounded-full bg-brand-primary-light text-brand-primary">
                  <Mail className="w-7 h-7" />
                </div>
                <h3 className="font-semibold mb-2">По email</h3>
                <a href={`mailto:${siteConfig.email}`} className="text-brand-primary font-semibold">{siteConfig.email}</a>
                <p className="text-text-secondary text-sm mt-1">Ответ в течение 24 часов</p>
              </Card>
            </div>

            {/* Инструкции */}
            <SectionTitle
              title="Инструкции"
              subtitle="Пошаговые руководства по настройке услуг и оборудования"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
              {instructionGroups.map((group) => (
                <Card key={group.category} className="p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-brand-primary-light text-brand-primary flex-shrink-0">
                      {categoryIcons[group.category] ?? <FileText className="w-5 h-5" />}
                    </div>
                    <h3 className="font-semibold text-text-primary">{group.category}</h3>
                  </div>
                  <ul className="space-y-2.5">
                    {group.items.map((item) => (
                      <li key={item.href}>
                        <a
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-start gap-2 text-sm text-text-secondary hover:text-brand-primary transition-colors group"
                        >
                          <FileText className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400 group-hover:text-brand-primary transition-colors" />
                          <span>{item.title}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </Card>
              ))}
            </div>

            {/* FAQ */}
            <SectionTitle
              title="Часто задаваемые вопросы"
              subtitle="Ответы на популярные вопросы по услугам и сервисам iFlat"
            />
            <HelpFaqSection />
          </div>
        </section>
      </ScrollReveal>

      {/* Написать в техподдержку */}
      <ScrollReveal delay={0.05}>
        <section className="py-16 lg:py-24 bg-brand-surface">
          <div className="container">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-2xl lg:text-3xl font-bold mb-4">Написать в техническую поддержку</h2>
              <p className="text-text-secondary mb-8">
                Если вы не нашли ответ на свой вопрос, свяжитесь с нами любым удобным способом
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a
                  href={`mailto:support@iflat.ru`}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-brand-primary text-white font-semibold rounded-xl hover:bg-brand-primary-hover transition-colors"
                >
                  <Mail className="w-5 h-5" />
                  support@iflat.ru
                </a>
                <a
                  href={siteConfig.social.telegram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 border border-gray-200 text-text-primary font-semibold rounded-xl hover:border-brand-primary hover:text-brand-primary transition-colors"
                >
                  <MessageCircle className="w-5 h-5" />
                  Telegram
                </a>
                <a
                  href={siteConfig.phoneHref}
                  className="inline-flex items-center gap-2 px-6 py-3 border border-gray-200 text-text-primary font-semibold rounded-xl hover:border-brand-primary hover:text-brand-primary transition-colors"
                >
                  <Phone className="w-5 h-5" />
                  {siteConfig.phone}
                </a>
              </div>
            </div>

            {/* Форма обращения в техподдержку */}
            <SupportForm />
          </div>
        </section>
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
