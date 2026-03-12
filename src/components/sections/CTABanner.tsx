"use client";

import { Phone } from "lucide-react";
import { siteConfig } from "@/config/site";

export function CTABanner() {
  return (
    <section className="bg-brand-primary py-12 lg:py-16 relative overflow-hidden">
      <style>{`
        @keyframes pulse-ring {
          0% { transform: scale(0.8); opacity: 0.5; }
          100% { transform: scale(2); opacity: 0; }
        }
        .pulse-ring {
          position: absolute;
          inset: 0;
          border-radius: 9999px;
          border: 2px solid rgba(255,255,255,0.5);
          animation: pulse-ring 2s ease-out infinite;
        }
        .pulse-ring-delayed {
          animation-delay: 1s;
        }
      `}</style>

      {/* Dot-grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.12] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
          backgroundSize: "18px 18px",
        }}
      />

      <div className="container relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left column: heading + CTA */}
          <div className="text-white text-center lg:text-left">
            <h2 className="text-2xl lg:text-3xl font-bold">
              Готовы подключиться? Звоните бесплатно
            </h2>
            <a
              href={siteConfig.phoneFreeHref}
              className="mt-4 inline-block text-4xl lg:text-5xl font-black hover:opacity-90 transition-opacity"
            >
              {siteConfig.phoneFree}
            </a>
            <p className="mt-2 text-white/70 text-sm">Звонок бесплатный, 24/7</p>
          </div>

          {/* Right column: pulsing phone icon */}
          <div className="hidden lg:flex items-center justify-center">
            <div className="relative w-32 h-32 flex items-center justify-center">
              {/* Pulse rings */}
              <div className="pulse-ring" />
              <div className="pulse-ring pulse-ring-delayed" />
              {/* Icon circle */}
              <div className="relative w-24 h-24 bg-white/20 rounded-full flex items-center justify-center">
                <Phone className="w-10 h-10 text-white" strokeWidth={1.5} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
