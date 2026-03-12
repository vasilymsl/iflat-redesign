import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "hit" | "promo" | "default";
  className?: string;
}

const variants = {
  hit: "bg-brand-accent text-white",
  promo: "bg-brand-primary text-white",
  default: "bg-gray-100 text-text-primary",
};

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-3 py-1 text-xs font-bold uppercase rounded-full tracking-wide",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
