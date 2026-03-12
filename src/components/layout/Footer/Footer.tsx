import Link from "next/link";
import Image from "next/image";
import { footerColumns } from "@/config/navigation";
import { siteConfig } from "@/config/site";
import { Phone, Mail } from "lucide-react";

function SocialLinks() {
  const socials = [
    { name: "ВКонтакте", href: siteConfig.social.vk, icon: "/images/social/vk-footer.svg" },
    { name: "Одноклассники", href: siteConfig.social.ok, icon: "/images/social/ok-footer.svg" },
    { name: "Telegram", href: siteConfig.social.telegram, icon: "/images/social/tg-footer.svg" },
    { name: "Max", href: siteConfig.social.max, icon: "/images/social/max-footer.svg" },
  ];

  return (
    <div className="flex items-center gap-3">
      {socials.map((s) => (
        <a
          key={s.name}
          href={s.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={s.name}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        >
          <Image src={s.icon} alt={s.name} width={20} height={20} />
        </a>
      ))}
    </div>
  );
}

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-brand-secondary text-white">
      <div className="container py-12 lg:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 lg:gap-12">
          {footerColumns.map((col) => (
            <div key={col.title}>
              <h3 className="font-semibold text-lg mb-4">{col.title}</h3>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-gray-300 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h3 className="font-semibold text-lg mb-4">Контакты</h3>
            <div className="space-y-3">
              <a
                href={siteConfig.phoneHref}
                className="flex items-center gap-2 text-lg font-semibold hover:text-brand-accent transition-colors"
              >
                <Phone className="w-4 h-4" />
                {siteConfig.phone}
              </a>
              <a
                href={`mailto:${siteConfig.email}`}
                className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
              >
                <Mail className="w-4 h-4" />
                {siteConfig.email}
              </a>
            </div>
            <div className="mt-6">
              <SocialLinks />
            </div>
            <div className="mt-6">
              <p className="text-sm text-gray-400 mb-3">Скачать приложение</p>
              <div className="flex items-center gap-3">
                <a
                  href={siteConfig.apps.googlePlay}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Скачать в Google Play"
                  className="inline-block hover:opacity-80 transition-opacity"
                >
                  <Image src="/images/badges/google-play.svg" alt="Google Play" width={130} height={40} />
                </a>
                <a
                  href={siteConfig.apps.appStore}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Скачать в App Store"
                  className="inline-block hover:opacity-80 transition-opacity"
                >
                  <Image src="/images/badges/app-store.svg" alt="App Store" width={130} height={40} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <p>&copy; {siteConfig.legalName} {siteConfig.foundedYear}&ndash;{currentYear}</p>
          <p>
            Продолжая использовать сайт, вы даёте согласие на обработку{" "}
            <a href="/upload/pdf/privacy-policy.pdf" className="underline hover:text-white">
              персональных данных
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
