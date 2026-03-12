import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Оплатить услуги iFlat — интернет, телефония, телевидение",
  description:
    "Быстрая и безопасная оплата услуг iFlat любым удобным способом: Т-Банк, Сбербанк Онлайн, банковская карта, офисы продаж",
};

export default function PaymentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
