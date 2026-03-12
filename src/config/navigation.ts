export interface NavItem {
  label: string;
  href: string;
  external?: boolean;
}

export const primaryNav: NavItem[] = [
  { label: "Интернет в квартиру", href: "/internet/flat" },
  { label: "Интернет в дом", href: "/internet/home" },
  { label: "Телевидение", href: "/tv" },
  { label: "Акции", href: "/action" },
  { label: "Оплата", href: "/payment" },
];

export const secondaryNav: NavItem[] = [
  { label: "Для бизнеса", href: "/business/internet" },
  { label: "О компании", href: "/company" },
  { label: "Контакты", href: "/contact" },
  { label: "Помощь", href: "/help" },
  { label: "Блог", href: "https://blog.iflat.ru", external: true },
];

export interface FooterColumn {
  title: string;
  links: NavItem[];
}

export const footerColumns: FooterColumn[] = [
  {
    title: "Продукты",
    links: [
      { label: "Интернет в квартиру", href: "/internet/flat" },
      { label: "Интернет в дом", href: "/internet/home" },
      { label: "Интерактивное ТВ", href: "/tv" },
      { label: "Телефония", href: "/phone" },
    ],
  },
  {
    title: "Услуги",
    links: [
      { label: "Облачное видеонаблюдение", href: "/videonablyudenie" },
      { label: "Акции", href: "/action" },
      { label: "Оплата", href: "/payment" },
    ],
  },
  {
    title: "iFlat",
    links: [
      { label: "О компании", href: "/company" },
      { label: "Новости", href: "/news" },
      { label: "Контакты", href: "/contact" },
      { label: "Вакансии", href: "/vacancy" },
    ],
  },
];
