import { TariffPlan } from "@/types/tariff";

export const homeTariffs: TariffPlan[] = [
  {
    id: "ihome-150",
    name: "iHome 150",
    speed: 150,
    price: 1350,
    features: ["Безлимитный интернет 150 Мбит/с", "Оптоволокно до дома", "Wi-Fi роутер в аренду"],
    technology: "gpon",
  },
  {
    id: "ihome-300",
    name: "iHome 300",
    speed: 300,
    price: 1800,
    isHit: true,
    tvChannels: 201,
    features: ["Безлимитный интернет 300 Мбит/с", "201 канал ТВ", "Оптоволокно до дома", "Wi-Fi роутер в аренду", "ТВ-приставка в аренду"],
    technology: "gpon",
  },
  {
    id: "smart-home",
    name: "Умный дом",
    speed: 3,
    price: 450,
    features: ["Безлимитный интернет", "Для систем умного дома"],
  },
  {
    id: "ihome-500",
    name: "iHome 500+",
    speed: 500,
    price: 2400,
    tvChannels: 271,
    features: ["Безлимитный интернет 500 Мбит/с", "271 канал ТВ", "Оптоволокно до дома", "Wi-Fi роутер в аренду", "ТВ-приставка в аренду"],
    technology: "gpon",
  },
  {
    id: "gdrive-150",
    name: "G-Drive 150",
    speed: 150,
    price: 100,
    priceUnit: "руб/день",
    features: ["Интернет 150 Мбит/с", "Посуточная оплата"],
    technology: "gpon",
  },
];

export const glParkTariffs: TariffPlan[] = [
  {
    id: "glpark-1000",
    name: "GL-Park 1000",
    speed: 30,
    price: 1000,
    features: ["Безлимитный интернет"],
  },
  {
    id: "glpark-1500",
    name: "GL-Park 1500",
    speed: 50,
    price: 1500,
    features: ["Безлимитный интернет"],
  },
  {
    id: "glpark-2000",
    name: "GL-Park 2000",
    speed: 100,
    price: 2000,
    isHit: true,
    features: ["Безлимитный интернет"],
  },
  {
    id: "glpark-2500",
    name: "GL-Park 2500",
    speed: 200,
    price: 2500,
    features: ["Безлимитный интернет"],
  },
];
