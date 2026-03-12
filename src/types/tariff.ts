export interface TariffPlan {
  id: string;
  name: string;
  speed?: number; // Mbit/s
  price: number;
  priceUnit?: string;
  isHit?: boolean;
  tvChannels?: number;
  features: string[];
  technology?: "ethernet" | "gpon";
}

export interface RegionalTariffs {
  regionId: string;
  plans: TariffPlan[];
}
