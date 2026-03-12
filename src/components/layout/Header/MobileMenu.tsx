"use client";

import Link from "next/link";
import { primaryNav, secondaryNav } from "@/config/navigation";
import { siteConfig } from "@/config/site";
import { Phone, Mail, ExternalLink, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.3 }}
            className="fixed top-0 right-0 bottom-0 w-80 max-w-[85vw] bg-white z-50 lg:hidden overflow-y-auto"
          >
            {/* Кнопка закрытия */}
            <button
              onClick={onClose}
              className="absolute top-5 right-5 w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Закрыть меню"
            >
              <X className="w-6 h-6 text-text-primary" />
            </button>

            <div className="p-6 pt-18">
              <nav className="space-y-1">
                {primaryNav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className="block px-4 py-3 text-lg font-medium text-text-primary hover:bg-brand-surface rounded-lg transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>

              <hr className="my-4 border-gray-200" />

              <nav className="space-y-1">
                {secondaryNav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    target={item.external ? "_blank" : undefined}
                    onClick={onClose}
                    className="flex items-center gap-2 px-4 py-3 text-text-secondary hover:bg-brand-surface rounded-lg transition-colors"
                  >
                    {item.label}
                    {item.external && <ExternalLink className="w-3.5 h-3.5" />}
                  </Link>
                ))}
              </nav>

              <hr className="my-4 border-gray-200" />

              <div className="px-4 space-y-3">
                <a
                  href={siteConfig.phoneHref}
                  className="flex items-center gap-3 text-lg font-semibold text-brand-primary"
                >
                  <Phone className="w-5 h-5" />
                  {siteConfig.phone}
                </a>
                <a
                  href={`mailto:${siteConfig.email}`}
                  className="flex items-center gap-3 text-text-secondary"
                >
                  <Mail className="w-5 h-5" />
                  {siteConfig.email}
                </a>
              </div>

              <div className="mt-6 px-4">
                <a
                  href={siteConfig.lk}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center px-6 py-3 bg-brand-primary text-white font-semibold rounded-lg hover:bg-brand-primary-hover transition-colors"
                >
                  Личный кабинет
                </a>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
