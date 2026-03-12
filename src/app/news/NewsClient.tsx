"use client";

import { useState } from "react";
import { Calendar } from "lucide-react";
import { Tabs } from "@/components/ui/Tabs";
import { newsItems } from "@/config/news";

const YEARS = ["2026", "2025", "2024", "2023", "2022", "2021", "2020", "2019", "2018", "2017"];

const yearTabs = YEARS.map((y) => ({ id: y, label: y }));

export function NewsClient() {
  const [activeYear, setActiveYear] = useState("2026");

  const filtered = newsItems.filter((item) => item.date.endsWith(activeYear));

  return (
    <div>
      <div className="mb-8">
        <Tabs tabs={yearTabs} activeTab={activeYear} onChange={setActiveYear} />
      </div>

      <p className="text-center text-sm text-text-secondary mb-8">
        {filtered.length} {getNewsWord(filtered.length)} за {activeYear} год
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((item) => (
          <article
            key={item.id}
            className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md hover:border-brand-primary/20 transition-all duration-200 flex flex-col gap-3"
          >
            <div className="flex items-center gap-2 text-brand-primary text-sm font-medium">
              <Calendar className="w-4 h-4" />
              <time dateTime={isoDate(item.date)}>{item.date}</time>
            </div>
            <h2 className="font-semibold text-text-primary leading-snug text-base">
              {item.title}
            </h2>
            {item.text && (
              <p className="text-sm text-text-secondary leading-relaxed line-clamp-3">
                {item.text}
              </p>
            )}
          </article>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-text-secondary">
          Нет новостей за {activeYear} год
        </div>
      )}
    </div>
  );
}

function getNewsWord(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod100 >= 11 && mod100 <= 19) return "новостей";
  if (mod10 === 1) return "новость";
  if (mod10 >= 2 && mod10 <= 4) return "новости";
  return "новостей";
}

function isoDate(date: string): string {
  const [d, m, y] = date.split(".");
  return `${y}-${m}-${d}`;
}
