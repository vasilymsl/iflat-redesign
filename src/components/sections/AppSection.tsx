import Image from "next/image";
import { Check } from "lucide-react";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { siteConfig } from "@/config/site";

const FEATURES = [
  "Удобно пополнять баланс",
  "Подключайте и отключайте услуги",
  "Круглосуточная техническая поддержка",
];

export function AppSection() {
  return (
    <section className="py-16 lg:py-24 bg-brand-surface overflow-hidden">
      <div className="container">
        <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="hidden lg:block relative h-80">
            <Image
              src="/images/app/app-bg.png"
              alt=""
              fill
              className="object-contain object-left"
            />
          </div>

          <div>
            <SectionTitle
              title={`Мобильное приложение «${siteConfig.name}»`}
              centered={false}
              className="mb-8"
            />

            <ul className="space-y-4 mb-10">
              {FEATURES.map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-success/10 flex items-center justify-center mt-0.5">
                    <Check className="w-4 h-4 text-success" />
                  </span>
                  <span className="text-text-primary">{feature}</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap gap-4">
              <a
                href={siteConfig.apps.appStore}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block"
              >
                <Image
                  src="/images/app/app-store.png"
                  alt="Скачать в App Store"
                  width={160}
                  height={48}
                  className="h-12 w-auto"
                />
              </a>
              <a
                href={siteConfig.apps.googlePlay}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block"
              >
                <Image
                  src="/images/app/google-play.png"
                  alt="Скачать в Google Play"
                  width={160}
                  height={48}
                  className="h-12 w-auto"
                />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
