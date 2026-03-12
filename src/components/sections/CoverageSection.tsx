import { SectionTitle } from "@/components/ui/SectionTitle";

interface CoverageSectionProps {
  locations: string;
}

export function CoverageSection({ locations }: CoverageSectionProps) {
  return (
    <section className="py-16 lg:py-24 bg-white">
      <div className="container">
        <SectionTitle
          title="География покрытия"
          subtitle="Подключаем интернет и цифровое ТВ в следующих населенных пунктах:"
        />

        <div className="max-w-4xl mx-auto text-center">
          <p className="text-text-primary text-lg leading-relaxed">
            {locations}
          </p>
        </div>
      </div>
    </section>
  );
}
