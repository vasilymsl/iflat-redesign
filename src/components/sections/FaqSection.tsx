import { Accordion } from "@/components/ui/Accordion";
import { SectionTitle } from "@/components/ui/SectionTitle";

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

interface FaqSectionProps {
  items: FaqItem[];
  title?: string;
}

export function FaqSection({ items, title = "Часто задаваемые вопросы" }: FaqSectionProps) {
  return (
    <section className="py-16 lg:py-24 bg-brand-surface">
      <div className="container">
        <SectionTitle title={title} />
        <div className="max-w-3xl mx-auto">
          <Accordion items={items} />
        </div>
      </div>
    </section>
  );
}
