"use client";

import { motion } from "framer-motion";

interface Stat {
  value: string;
  unit?: string;
  label: string;
}

interface StatsStripProps {
  stats?: Stat[];
}

const defaultStats: Stat[] = [
  { value: "40 000+", label: "абонентов" },
  { value: "300", unit: "Мбит/с", label: "скорость" },
  { value: "99.9%", label: "uptime" },
  { value: "12+", unit: "лет", label: "на рынке" },
];

export function StatsStrip({ stats = defaultStats }: StatsStripProps) {
  return (
    <section className="py-12 bg-brand-secondary">
      <div className="container">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center text-white">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
            >
              <div className="text-4xl lg:text-5xl font-black text-brand-primary">
                {stat.value}
                {stat.unit && <span className="text-2xl ml-1">{stat.unit}</span>}
              </div>
              <div className="text-white/70 font-medium mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
