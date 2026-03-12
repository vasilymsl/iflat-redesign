"use client";

import * as icons from "lucide-react";
import { motion } from "framer-motion";
import { SectionTitle } from "@/components/ui/SectionTitle";

type IconName = keyof typeof icons;

interface Advantage {
  title: string;
  description: string;
  icon: string;
}

interface AdvantagesSectionProps {
  items: Advantage[];
}

export function AdvantagesSection({ items }: AdvantagesSectionProps) {
  return (
    <section className="py-16 lg:py-24 bg-white">
      <div className="container">
        <SectionTitle title="Ваши преимущества с iFlat" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item, i) => {
            const Icon = icons[item.icon as IconName] as icons.LucideIcon;
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="flex gap-4 p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="shrink-0 w-12 h-12 flex items-center justify-center rounded-full bg-brand-primary-light text-brand-primary">
                  {Icon && <Icon className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-text-primary mb-1">
                    {item.title}
                  </h3>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
