"use client";

import { SectionTitle } from "@/components/ui/SectionTitle";
import { EquipmentCard } from "@/components/sections/EquipmentCard";
import { Carousel } from "@/components/ui/Carousel";

interface Characteristic {
  label: string;
  value: string;
}

interface EquipmentItem {
  name: string;
  description: string;
  specs: string[];
  price: number;
  image: string;
  instructionUrl?: string;
  characteristics?: Characteristic[];
}

interface EquipmentSectionProps {
  items: EquipmentItem[];
}

export function EquipmentSection({ items }: EquipmentSectionProps) {
  return (
    <section className="py-16 lg:py-24 bg-white">
      <div className="container">
        <SectionTitle title="Популярное оборудование" />
        <Carousel
          slidesPerView={{ base: 1, sm: 2, md: 2, lg: 3 }}
          gap={24}
          dots={true}
          arrows={true}
        >
          {items.map((item) => (
            <EquipmentCard
              key={item.name}
              name={item.name}
              description={item.description}
              specs={item.specs}
              price={item.price}
              image={item.image}
              instructionUrl={item.instructionUrl}
              characteristics={item.characteristics}
              animationDelay={0}
            />
          ))}
        </Carousel>
      </div>
    </section>
  );
}
