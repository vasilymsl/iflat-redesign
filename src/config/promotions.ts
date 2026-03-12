export interface Promotion {
  id: string;
  title: string;
  description: string;
  href: string;
}

export const promotions: Promotion[] = [
  {
    id: "free-3-months",
    title: "3 месяца интернета и ТВ бесплатно",
    description: "Подключайтесь и пользуйтесь интернетом и цифровым ТВ 3 месяца бесплатно",
    href: "/action",
  },
  {
    id: "review-bonus",
    title: "Бонус за отзыв",
    description: "Поделитесь мнением о нашей работе и получите бонус на счёт",
    href: "/bonus_za_otziv",
  },
  {
    id: "switch-provider",
    title: "Переход от другого провайдера",
    description: "2 месяца бесплатного интернета при переходе к нам",
    href: "/perehod_ot_provaidera",
  },
  {
    id: "bring-neighbor",
    title: "Приведи соседа",
    description: "2 месяца бесплатно для вас и вашего соседа при подключении",
    href: "/privedi_soseda",
  },
  {
    id: "free-connect-home",
    title: "Бесплатное подключение в частный сектор",
    description: "Подключение интернета в частный дом бесплатно при заключении договора",
    href: "/internet/home",
  },
];
