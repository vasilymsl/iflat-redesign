"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { CheckCircle, Loader2 } from "lucide-react";

const schema = z.object({
  name: z.string().min(2, "Введите ваше имя"),
  phone: z.string().min(10, "Введите корректный номер телефона"),
  address: z.string().min(5, "Введите адрес подключения"),
  promo: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function ConnectionForm() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Ошибка отправки");
      }
      setIsSubmitted(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка отправки. Попробуйте позже.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-text-primary mb-2">
          Заявка отправлена!
        </h3>
        <p className="text-text-secondary">
          Наш менеджер свяжется с вами в ближайшее время
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        {...register("name")}
        id="conn-name"
        label="Ваше имя"
        placeholder="Иван Иванов"
        error={errors.name?.message}
      />
      <Input
        {...register("phone")}
        id="conn-phone"
        label="Телефон"
        placeholder="+7 (___) ___-__-__"
        type="tel"
        error={errors.phone?.message}
      />
      <Input
        {...register("address")}
        id="conn-address"
        label="Адрес подключения"
        placeholder="Город, улица, дом, квартира"
        error={errors.address?.message}
      />
      <Input
        {...register("promo")}
        id="conn-promo"
        label="Промокод"
        placeholder="Введите промокод (если есть)"
      />
      <p className="text-xs text-text-secondary">
        Нажимая кнопку, вы даёте согласие на обработку персональных данных
      </p>
      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2">{error}</p>
      )}
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Отправка...
          </span>
        ) : (
          "Оставить заявку"
        )}
      </Button>
    </form>
  );
}
