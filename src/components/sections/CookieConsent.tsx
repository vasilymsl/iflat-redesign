"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof window === "undefined") return false;
    return !localStorage.getItem("cookies_accepted");
  });

  const handleAccept = () => {
    localStorage.setItem("cookies_accepted", "true");
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-20 lg:bottom-4 left-4 right-4 sm:left-4 sm:right-auto sm:max-w-md z-50 bg-white rounded-xl shadow-2xl p-5 border border-gray-100"
        >
          <p className="text-sm text-text-secondary mb-4">
            Продолжая использовать наш сайт, вы даете согласие на обработку файлов Cookies и других пользовательских данных, в соответствии с{" "}
            <a href="/upload/pdf/privacy-policy.pdf" target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline">
              Политикой обработки персональных данных
            </a>
          </p>
          <button
            onClick={handleAccept}
            className="px-6 py-2 bg-brand-primary text-white text-sm font-semibold rounded-lg hover:bg-brand-primary-hover transition-colors"
          >
            Принимаю
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
