"use client";

import { TariffPlan } from "@/types/tariff";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatPrice, cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { motion } from "framer-motion";

interface TariffCardProps {
  plan: TariffPlan;
  onConnect?: (plan: TariffPlan) => void;
}

export function TariffCard({ plan, onConnect }: TariffCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4 }} className="h-full"
      transition={{ duration: 0.2 }}
    >
      <Card hover className="flex flex-col relative group h-full">
        {/* Hit badge */}
        {plan.isHit && (
          <div className="bg-brand-primary text-white text-xs font-bold uppercase tracking-wider text-center py-2.5">
            Хит продаж
          </div>
        )}

        {/* Card header */}
        <div
          className={cn(
            "px-6 pt-6 pb-8",
            plan.isHit
              ? "bg-gradient-to-br from-brand-secondary to-brand-dark"
              : "bg-white"
          )}
        >
          <span
            className={cn(
              "text-xs font-bold uppercase tracking-widest",
              plan.isHit ? "text-brand-primary" : "text-text-secondary"
            )}
          >
            {plan.name}
          </span>

          {/* Speed — dominant element */}
          {plan.speed && (
            <div className="mt-2 flex items-end gap-2">
              <span
                className={cn(
                  "text-6xl font-black leading-none",
                  plan.isHit ? "text-white" : "text-text-primary"
                )}
              >
                {plan.speed}
              </span>
              <span
                className={cn(
                  "text-lg font-medium pb-1",
                  plan.isHit ? "text-white/60" : "text-text-secondary"
                )}
              >
                Мбит/с
              </span>
            </div>
          )}
          {plan.tvChannels && (
            <p className={cn("text-sm mt-2", plan.isHit ? "text-white/60" : "text-text-secondary")}>
              + {plan.tvChannels} каналов ТВ
            </p>
          )}
        </div>

        {/* Features */}
        <div className="px-6 py-5 flex-1 space-y-3">
          {plan.features.map((f) => (
            <div key={f} className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-brand-primary-light flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="w-3 h-3 text-brand-primary" />
              </div>
              <span className="text-sm text-text-secondary">{f}</span>
            </div>
          ))}
        </div>

        {/* Price + CTA */}
        <div className="px-6 pb-6">
          <div className="flex items-end gap-1 mb-4">
            <span className="text-4xl font-black text-text-primary">
              {formatPrice(plan.price)}
            </span>
            <span className="text-text-secondary mb-1">
              {plan.priceUnit || "₽/мес"}
            </span>
          </div>
          <Button
            className="w-full group-hover:shadow-md group-hover:shadow-brand-primary/20 transition-shadow"
            onClick={() => {
              if (onConnect) {
                onConnect(plan);
              } else {
                document
                  .getElementById("connection")
                  ?.scrollIntoView({ behavior: "smooth" });
              }
            }}
          >
            Подключить
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}
