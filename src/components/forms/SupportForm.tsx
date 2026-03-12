"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { CheckCircle, Loader2 } from "lucide-react";

export function SupportForm() {
  const [login, setLogin] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, phone }),
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
      <div className="text-center py-8 mt-8">
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-text-primary mb-1">Обращение отправлено!</h3>
        <p className="text-text-secondary text-sm">Мы свяжемся с вами в ближайшее время</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto mt-10 space-y-4">
      <h3 className="text-lg font-semibold text-center mb-2">Написать в техподдержку</h3>
      <Input
        id="support-login"
        label="Логин / номер договора"
        placeholder="Введите логин или номер договора"
        value={login}
        onChange={(e) => setLogin(e.target.value)}
        required
      />
      <Input
        id="support-phone"
        label="Телефон"
        placeholder="+7 (___) ___-__-__"
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        required
      />
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
          "Отправить"
        )}
      </Button>
    </form>
  );
}
