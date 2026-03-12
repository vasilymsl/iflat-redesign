"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, FileText } from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface Characteristic {
  label: string;
  value: string;
}

interface EquipmentCardProps {
  name: string;
  description: string;
  specs: string[];
  price?: number;
  image: string;
  instructionUrl?: string;
  characteristics?: Characteristic[];
  animationDelay?: number;
}

export function EquipmentCard({
  name,
  description,
  specs,
  price,
  image,
  instructionUrl,
  characteristics,
  animationDelay = 0,
}: EquipmentCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4, delay: animationDelay }}
      className="bg-white rounded-2xl border border-gray-100 shadow hover:shadow-lg transition-shadow overflow-hidden flex flex-col"
    >
      <div className="relative w-full aspect-[4/3] bg-gray-50">
        <Image
          src={image}
          alt={name}
          fill
          className="object-contain p-4"
        />
      </div>

      <div className="p-5 flex flex-col flex-1">
        <h3 className="text-base font-bold text-text-primary mb-1">{name}</h3>
        <p className="text-sm text-text-secondary mb-3">{description}</p>

        <ul className="space-y-1 mb-4 flex-1">
          {specs.map((spec) => (
            <li
              key={spec}
              className="text-xs text-text-secondary before:content-['•'] before:mr-1.5 before:text-brand-primary"
            >
              {spec}
            </li>
          ))}
        </ul>

        <AnimatePresence initial={false}>
          {expanded && characteristics && characteristics.length > 0 && (
            <motion.div
              key="details"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="pt-1 pb-3 border-t border-gray-100 mb-3">
                <table className="w-full text-xs">
                  <tbody>
                    {characteristics.map((char) => (
                      <tr key={char.label} className="border-b border-gray-50 last:border-0">
                        <td className="py-1.5 pr-2 text-text-secondary whitespace-nowrap">{char.label}</td>
                        <td className="py-1.5 text-text-primary font-medium text-right">{char.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {instructionUrl && (
                  <a
                    href={instructionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 flex items-center gap-1.5 text-xs text-brand-primary hover:underline"
                  >
                    <FileText size={13} />
                    Инструкция
                  </a>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-wrap items-center justify-between gap-2 mt-auto pt-3 border-t border-gray-100">
          {price !== undefined ? (
            <span className="text-lg font-bold text-text-primary whitespace-nowrap">{formatPrice(price)} ₽</span>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2 flex-shrink-0">
            {characteristics && characteristics.length > 0 && (
              <button
                onClick={() => setExpanded((prev) => !prev)}
                className="flex items-center gap-1 px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium text-text-secondary hover:border-brand-primary hover:text-brand-primary transition-colors"
                aria-expanded={expanded}
              >
                Подробнее
                <motion.span
                  animate={{ rotate: expanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center"
                >
                  <ChevronDown size={14} />
                </motion.span>
              </button>
            )}
            <button className="px-4 py-2 rounded-xl bg-brand-primary text-white text-sm font-semibold hover:bg-brand-primary-hover transition-colors">
              Купить
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
