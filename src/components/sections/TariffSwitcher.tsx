"use client";

import { useState } from "react";
import { Building2, Home } from "lucide-react";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { Tabs } from "@/components/ui/Tabs";
import { TariffCard } from "./TariffCard";
import { Carousel } from "@/components/ui/Carousel";
import { RegionalTariffs, TariffPlan } from "@/types/tariff";
import { Region } from "@/config/regions";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface TariffSwitcherProps {
  regions: Region[];
  flatTariffs: RegionalTariffs[];
  homeTariffs: TariffPlan[];
}

export function TariffSwitcher({ regions, flatTariffs, homeTariffs }: TariffSwitcherProps) {
  const [mode, setMode] = useState<"flat" | "home">("flat");
  const [activeRegion, setActiveRegion] = useState(regions[0]?.id || "");

  const currentFlatTariffs = flatTariffs.find((t) => t.regionId === activeRegion);

  return (
    <section className="py-20 lg:py-28 bg-brand-surface">
      <div className="container">
        <SectionTitle
          title="Подключить интернет и цифровое ТВ"
          subtitle="Выберите ваш район для отображения актуальных тарифов"
        />

        {/* Переключатель Квартира/Дом */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-full bg-white border border-gray-200 p-1 shadow-sm">
            <button
              onClick={() => setMode("flat")}
              className={cn(
                "flex items-center gap-1.5 sm:gap-2 px-4 py-2.5 sm:px-6 sm:py-3 rounded-full text-sm font-semibold transition-all",
                mode === "flat"
                  ? "bg-brand-primary text-white shadow-md"
                  : "text-text-secondary hover:text-text-primary"
              )}
            >
              <Building2 className="w-4 h-4" />
              Квартира
            </button>
            <button
              onClick={() => setMode("home")}
              className={cn(
                "flex items-center gap-1.5 sm:gap-2 px-4 py-2.5 sm:px-6 sm:py-3 rounded-full text-sm font-semibold transition-all",
                mode === "home"
                  ? "bg-brand-primary text-white shadow-md"
                  : "text-text-secondary hover:text-text-primary"
              )}
            >
              <Home className="w-4 h-4" />
              Дом
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {mode === "flat" ? (
            <motion.div
              key="flat"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {regions.length > 1 && (
                <div className="mb-10">
                  <Tabs
                    tabs={regions.map((r) => ({ id: r.id, label: r.label }))}
                    activeTab={activeRegion}
                    onChange={setActiveRegion}
                  />
                </div>
              )}

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeRegion}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <Carousel
                    slidesPerView={{ base: 1, sm: 1, md: 2, lg: 3 }}
                    gap={24}
                    dots={true}
                    arrows={true}
                  >
                    {(currentFlatTariffs?.plans ?? []).map((plan) => (
                      <TariffCard key={plan.id} plan={plan} />
                    ))}
                  </Carousel>
                </motion.div>
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <Carousel
                slidesPerView={{ base: 1, sm: 2, md: 2, lg: 4 }}
                gap={24}
                dots={true}
                arrows={true}
              >
                {homeTariffs.map((plan) => (
                  <TariffCard key={plan.id} plan={plan} />
                ))}
              </Carousel>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
