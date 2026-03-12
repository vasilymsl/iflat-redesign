"use client";

import * as icons from "lucide-react";
import Image from "next/image";
import { ScrollReveal, ScrollRevealItem } from "@/components/ui/ScrollReveal";

type IconName = keyof typeof icons;

interface Feature {
  icon?: IconName;
  image?: string;
  title: string;
  description: string;
}

interface FeatureCardsProps {
  features: Feature[];
  columns?: 2 | 3;
}

export function FeatureCards({ features, columns = 3 }: FeatureCardsProps) {
  return (
    <ScrollReveal
      stagger
      staggerDelay={0.1}
      className={`grid grid-cols-1 gap-6 lg:gap-8 ${columns === 2 ? "md:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3"}`}
    >
      {features.map((feature) => (
        <ScrollRevealItem key={feature.title}>
          <div className="text-center p-8 rounded-2xl bg-brand-surface border-0 shadow-none h-full">
            <div className="w-16 h-16 mx-auto mb-5 flex items-center justify-center rounded-2xl bg-brand-primary-light text-brand-primary">
              {feature.image ? (
                <Image src={feature.image} alt="" width={40} height={40} className="w-10 h-10 object-contain" />
              ) : feature.icon ? (
                (() => {
                  const Icon = icons[feature.icon] as icons.LucideIcon;
                  return <Icon className="w-8 h-8" />;
                })()
              ) : null}
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              {feature.title}
            </h3>
            <p className="text-text-secondary">{feature.description}</p>
          </div>
        </ScrollRevealItem>
      ))}
    </ScrollReveal>
  );
}
