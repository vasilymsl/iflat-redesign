"use client";

import { cn } from "@/lib/utils";

interface Tab {
  id: string;
  label: string;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
}

export function Tabs({ tabs, activeTab, onChange }: TabsProps) {
  return (
    <div className="relative">
      {/* Fade hint for overflow */}
      <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none lg:hidden" />

      <div
        className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 pr-12 lg:pr-0 lg:justify-center"
        role="tablist"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "flex-shrink-0 px-5 py-2.5 text-sm font-semibold rounded-full transition-all duration-200 whitespace-nowrap border-2",
              activeTab === tab.id
                ? "bg-brand-primary text-white border-brand-primary shadow-md shadow-brand-primary/20"
                : "text-text-secondary border-gray-200 hover:border-brand-primary hover:text-brand-primary"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
