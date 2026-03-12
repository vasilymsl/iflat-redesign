export const siteConfig = {
  name: "iFlat",
  legalName: 'ООО «Юнионтел»',
  domain: "iflat.ru",
  phone: "8 (495) 792-59-88",
  phoneHref: "tel:+74957925988",
  phoneFree: "8 (800) 100-59-88",
  phoneFreeHref: "tel:+78001005988",
  email: "info@iflat.ru",
  description: "Интернет и цифровое ТВ для квартиры, частного дома и офиса в Новой Москве и Московской области",
  foundedYear: 2009,
  stats: {
    subscribers: "40 000+",
    settlements: "40+",
    yearsOperation: "12+",
  },
  social: {
    vk: "https://vk.com/iflat_provider",
    ok: "https://ok.ru/group/70000003733044",
    telegram: "https://t.me/iflat",
    max: "https://max.ru/id7721344988_biz",
  },
  apps: {
    googlePlay: "https://play.google.com/store/apps/details?id=ru.iflat.mlk",
    appStore: "https://www.apple.com/ru/app-store/",
  },
  lk: "https://lk.iflat.ru/login",
  brand: {
    logoPath: "/images/logo.png",
  },
} as const;

export type SiteConfig = typeof siteConfig;
