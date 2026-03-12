"use client";

import { useState } from "react";
import { HeroBanner } from "@/components/sections/HeroBanner";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { ChevronDown, ChevronUp, Shield, Lock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const paymentTabs = [
  { id: "contract", label: "По номеру договора" },
  { id: "phone", label: "По номеру телефона" },
];

interface PaymentMethod {
  id: string;
  image: string;
  title: string;
  shortDesc: string;
  steps?: string[];
  details?: string;
  link?: { href: string; label: string };
  badges?: string[];
}

const paymentMethods: PaymentMethod[] = [
  {
    id: "tbank",
    image: "/images/services/payment_tbank.png",
    title: "Платежная система Т-Банк",
    shortDesc: "Удобная оплата услуг на сайте и в мобильном приложении",
    steps: [
      "Откройте приложение Т‑Банк или веб‑версию сервиса",
      "Перейдите в раздел «Платежи»",
      "В строке поиска наберите «iFlat»",
      "Укажите номер своего лицевого счёта",
      "Введите сумму платежа и подтвердите операцию",
    ],
  },
  {
    id: "sber",
    image: "/images/services/payment_sber.png",
    title: "Платежная система Сбербанк Онлайн",
    shortDesc: "Оплачивайте услуги на сайте и в мобильном приложении",
    steps: [
      "Войдите в приложение или на сайт Сбербанка, в раздел ПЛАТЕЖИ",
      "В строке поиска введите «iFlat» и нажмите «Поиск»",
      "Кликните на иконку с нашим логотипом и введите номер лицевого счёта (номер договора)",
      "Введите сумму, выберите карту для списания средств и нажмите ПРОДОЛЖИТЬ",
      "При необходимости подтвердите операцию кодом, пришедшим в виде СМС",
    ],
  },
  {
    id: "uniteller",
    image: "/images/services/payment_uniteller.png",
    title: "Платежная система Uniteller",
    shortDesc: "Пополняйте счёт банковской картой в личном кабинете или на сайте",
    details:
      "Безопасность платёжного сервиса Uniteller подтверждена сертификатом стандарта безопасности данных индустрии платёжных карт PCI DSS. Надёжность сервиса обеспечивается интеллектуальной системой мониторинга мошеннических операций, применением 3D Secure — современной технологии обеспечения безопасности интернет-платежей.",
    badges: ["PCI DSS", "3D Secure"],
  },
  {
    id: "office",
    image: "/images/services/payment_office.png",
    title: "Оплата в офисах продаж",
    shortDesc: "Оплачивайте услуги без комиссии в ближайшем офисе продаж",
    details:
      "Мы всегда рады видеть вас в наших офисах продаж. В любом из них вы можете оставить заявку на подключение, узнать о действующих акциях и специальных предложениях, приобрести дополнительное оборудование, вызвать специалиста и подключить дополнительные услуги.",
    link: { href: "/contact", label: "Узнать адреса и режим работы" },
  },
  {
    id: "requisites",
    image: "/images/services/payment_requisites.png",
    title: "Оплата по реквизитам",
    shortDesc: "Способ оплаты для юридических лиц через Сбербанк Онлайн",
    details:
      "Оплата по банковским реквизитам доступна для юридических лиц. Реквизиты для оплаты указаны в вашем договоре. Платёж можно осуществить через интернет-банк, в отделении банка или через бухгалтерскую систему.",
  },
];

function PaymentMethodCard({ method }: { method: PaymentMethod }) {
  const [open, setOpen] = useState(false);

  return (
    <Card className="overflow-hidden flex flex-col">
      <div className="relative aspect-video bg-gray-50">
        <Image
          src={method.image}
          alt={method.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
      </div>
      <div className="p-6 flex flex-col flex-1">
        <h3 className="text-lg font-semibold mb-2">{method.title}</h3>
        <p className="text-text-secondary text-sm mb-4 flex-1">{method.shortDesc}</p>

        {method.badges && (
          <div className="flex gap-2 mb-4 flex-wrap">
            {method.badges.map((badge) => (
              <span
                key={badge}
                className="inline-flex items-center gap-1 text-xs font-medium bg-green-50 text-green-700 border border-green-200 rounded-full px-2.5 py-0.5"
              >
                <Shield className="w-3 h-3" />
                {badge}
              </span>
            ))}
          </div>
        )}

        {(method.steps || method.details) && (
          <>
            <button
              onClick={() => setOpen((v) => !v)}
              className="flex items-center gap-1 text-sm font-medium text-brand-primary hover:text-[#E08800] transition-colors mt-auto"
              aria-expanded={open}
            >
              {open ? "Скрыть" : "Подробнее"}
              {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {open && (
              <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                {method.steps && (
                  <ol className="space-y-2">
                    {method.steps.map((step, i) => (
                      <li key={i} className="flex gap-3 text-sm text-text-secondary">
                        <span className="shrink-0 w-6 h-6 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-semibold flex items-center justify-center mt-0.5">
                          {i + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                )}
                {method.details && (
                  <p className="text-sm text-text-secondary">{method.details}</p>
                )}
                {method.link && (
                  <Link
                    href={method.link.href}
                    className="inline-flex items-center gap-1 text-sm font-medium text-brand-primary hover:text-[#E08800] transition-colors"
                  >
                    {method.link.label} →
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  );
}

export default function PaymentPage() {
  const [activeTab, setActiveTab] = useState("contract");

  return (
    <>
      <HeroBanner
        title="Оплата услуг онлайн"
        subtitle="Быстрая и безопасная оплата услуг любым удобным способом"
        backgroundImage="/images/hero/udobnayaoplata_1.webp"
        compact
      />

      <ScrollReveal>
        <section className="py-16 lg:py-24">
          <div className="container">
            <SectionTitle
              title="Оплата услуг онлайн"
              subtitle="Онлайн оплата услуг интернет, телевидения и телефонии на нашем сайте без комиссии"
            />
            <div className="max-w-lg mx-auto">
              <div className="mb-4 flex justify-center">
                <Tabs tabs={paymentTabs} activeTab={activeTab} onChange={setActiveTab} />
              </div>

              <div className="flex items-center justify-center gap-2 mb-8 text-xs text-text-secondary">
                <Lock className="w-3.5 h-3.5 text-green-600" />
                <span>Безопасное соединение · PCI DSS · 3D Secure</span>
              </div>

              <Card className="p-8">
                {activeTab === "contract" ? (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Оплата банковской картой по номеру договора</h3>
                    <p className="text-sm text-text-secondary">Быстрый и удобный способ оплаты, без комиссии</p>
                    <Input placeholder="Номер договора" id="contract-number" />
                    <Input placeholder="Сумма" type="number" id="contract-sum" />
                    <Input placeholder="Email" type="email" id="contract-email" />
                    <Button className="w-full">Далее</Button>
                    <Image
                      src="/images/services/payment_badges.png"
                      alt="СБП, Visa, Mastercard, МИР, JCB, UnionPay"
                      width={400}
                      height={245}
                      className="w-full mt-2 opacity-70"
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Оплата банковской картой по номеру телефона</h3>
                    <p className="text-sm text-text-secondary">Быстрый и удобный способ оплаты, без комиссии</p>
                    <Input placeholder="+7 (___) ___-__-__" type="tel" id="payment-phone" />
                    <Input placeholder="Сумма" type="number" id="phone-sum" />
                    <Input placeholder="Email" type="email" id="phone-email" />
                    <Button className="w-full">Далее</Button>
                    <Image
                      src="/images/services/payment_badges.png"
                      alt="СБП, Visa, Mastercard, МИР, JCB, UnionPay"
                      width={400}
                      height={245}
                      className="w-full mt-2 opacity-70"
                    />
                  </div>
                )}
              </Card>
            </div>
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal delay={0.05}>
        <section className="py-16 lg:py-24 bg-brand-surface">
          <div className="container">
            <SectionTitle title="Другие способы оплаты" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paymentMethods.map((method) => (
                <PaymentMethodCard key={method.id} method={method} />
              ))}
            </div>
          </div>
        </section>
      </ScrollReveal>
    </>
  );
}
