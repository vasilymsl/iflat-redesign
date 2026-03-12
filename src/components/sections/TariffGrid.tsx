"use client";

import { useState } from "react";
import { Tabs } from "@/components/ui/Tabs";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { TariffCard } from "./TariffCard";
import { Carousel } from "@/components/ui/Carousel";
import { RegionalTariffs } from "@/types/tariff";
import { Region } from "@/config/regions";
import { motion, AnimatePresence } from "framer-motion";

interface TariffGridProps {
  title: string;
  subtitle?: string;
  regions: Region[];
  tariffsByRegion: RegionalTariffs[];
}

export function TariffGrid({ title, subtitle, regions, tariffsByRegion }: TariffGridProps) {
  const [activeRegion, setActiveRegion] = useState(regions[0]?.id || "");

  const currentTariffs = tariffsByRegion.find(
    (t) => t.regionId === activeRegion
  );

  return (
    <section className="py-20 lg:py-28 bg-brand-surface">
      <div className="container">
        <SectionTitle title={title} subtitle={subtitle} />

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
              {(currentTariffs?.plans ?? []).map((plan) => (
                <TariffCard key={plan.id} plan={plan} />
              ))}
            </Carousel>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
