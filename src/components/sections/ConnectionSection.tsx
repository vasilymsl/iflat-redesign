import { Users, Shield, Headphones, Clock } from "lucide-react";
import { ConnectionForm } from "@/components/forms/ConnectionForm";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { siteConfig } from "@/config/site";

const trustBullets = [
  {
    icon: Users,
    title: `${siteConfig.stats.subscribers} абонентов`,
    description: "Нам доверяют тысячи семей и бизнесов",
  },
  {
    icon: Shield,
    title: "Бесплатное подключение",
    description: "Никаких скрытых платежей при подключении",
  },
  {
    icon: Headphones,
    title: "Поддержка 24/7",
    description: "Служба поддержки всегда на связи",
  },
  {
    icon: Clock,
    title: `${siteConfig.stats.yearsOperation} лет работы`,
    description: "Опыт и надёжность, проверенные временем",
  },
];

export function ConnectionSection() {
  return (
    <section id="connection" className="py-20 lg:py-28">
      <div className="container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* Left column: trust bullets */}
          <div>
            <SectionTitle
              title="Оставьте заявку на подключение"
              subtitle="Заполните форму, и наш менеджер свяжется с вами в ближайшее время"
              badge="ПОДКЛЮЧЕНИЕ"
              centered={false}
            />
            <div className="space-y-5 mt-8">
              {trustBullets.map((bullet) => {
                const Icon = bullet.icon;
                return (
                  <div key={bullet.title} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{bullet.title}</p>
                      <p className="text-sm text-gray-500 mt-0.5">{bullet.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right column: form card */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5 sm:p-8">
            <ConnectionForm />
          </div>
        </div>
      </div>
    </section>
  );
}
