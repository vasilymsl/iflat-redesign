"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { primaryNav } from "@/config/navigation";
import { siteConfig } from "@/config/site";
import { Menu, X, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

interface MainNavProps {
  isMenuOpen: boolean;
  onToggleMenu: () => void;
}

export function MainNav({ isMenuOpen, onToggleMenu }: MainNavProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <div
      className={cn(
        "sticky top-0 z-50 bg-white border-b border-gray-100 transition-shadow duration-300",
        scrolled && "shadow-sm"
      )}
    >
      <div className="container flex items-center justify-between h-16 lg:h-20">
        <Link href="/" className="flex-shrink-0">
          <Image
            src={siteConfig.brand.logoPath}
            alt={siteConfig.name}
            width={120}
            height={40}
            priority
          />
        </Link>

        <nav className="hidden lg:flex items-center gap-4 xl:gap-8">
          {primaryNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="font-medium text-sm xl:text-base whitespace-nowrap text-text-primary hover:text-brand-primary transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {/* Phone — mobile */}
          <a
            href={siteConfig.phoneHref}
            className="lg:hidden flex items-center text-brand-primary"
          >
            <Phone className="w-5 h-5" />
          </a>
          {/* Phone — desktop: icon on lg, full number on xl */}
          <a
            href={siteConfig.phoneHref}
            className="hidden lg:flex items-center gap-1.5 font-medium text-text-primary hover:text-brand-primary transition-colors"
          >
            <Phone className="w-4 h-4" />
            <span className="hidden xl:inline">{siteConfig.phone}</span>
          </a>
          <Link
            href="/internet/flat"
            className="hidden lg:inline-flex px-5 py-2 text-sm xl:px-6 xl:py-2.5 xl:text-base font-semibold rounded-xl bg-brand-primary text-white hover:bg-brand-primary-hover transition-all"
          >
            Подключить
          </Link>
          <button
            onClick={onToggleMenu}
            className="lg:hidden p-2 text-text-primary"
            aria-label={isMenuOpen ? "Закрыть меню" : "Открыть меню"}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>
    </div>
  );
}
