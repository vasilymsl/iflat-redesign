"use client";

import { useState } from "react";
import Link from "next/link";
import { secondaryNav } from "@/config/navigation";
import { siteConfig } from "@/config/site";
import { Phone, MessageSquare, User } from "lucide-react";
import Image from "next/image";
import { DirectorModal } from "@/components/forms/DirectorModal";

export function TopBar() {
  const [isDirectorOpen, setIsDirectorOpen] = useState(false);

  return (
    <div className="bg-brand-dark text-white text-sm hidden lg:block">
      <div className="container flex items-center justify-between h-10">
        <nav className="flex items-center gap-3 xl:gap-5">
          {secondaryNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              target={item.external ? "_blank" : undefined}
              className="whitespace-nowrap hover:text-brand-accent transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3 xl:gap-5">
          <a
            href={siteConfig.lk}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 whitespace-nowrap hover:text-brand-accent transition-colors"
          >
            <User className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Личный кабинет</span>
          </a>
          <button
            onClick={() => setIsDirectorOpen(true)}
            className="flex items-center gap-1.5 whitespace-nowrap hover:text-brand-accent transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Письмо директору</span>
          </button>
          <DirectorModal
            isOpen={isDirectorOpen}
            onClose={() => setIsDirectorOpen(false)}
          />
          <a
            href={siteConfig.phoneHref}
            className="flex items-center gap-1.5 font-semibold whitespace-nowrap hover:text-brand-accent transition-colors"
          >
            <Phone className="w-3.5 h-3.5" />
            {siteConfig.phone}
          </a>
          <div className="hidden xl:flex items-center gap-2 ml-1 border-l border-white/20 pl-3">
            <a href={siteConfig.social.vk} target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
              <Image src="/images/social/vk-footer.svg" alt="VK" width={18} height={18} />
            </a>
            <a href={siteConfig.social.telegram} target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
              <Image src="/images/social/tg-footer.svg" alt="Telegram" width={18} height={18} />
            </a>
            <a href={siteConfig.social.ok} target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
              <Image src="/images/social/ok-footer.svg" alt="OK" width={18} height={18} />
            </a>
            <a href={siteConfig.social.max} target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
              <Image src="/images/social/max-footer.svg" alt="MAX" width={18} height={18} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
