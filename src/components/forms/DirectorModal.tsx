"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { CheckCircle, Loader2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const schema = z.object({
  name: z.string().min(2, "Введите ваше имя"),
  email: z.string().email("Введите корректный email"),
  phone: z.string().optional(),
  subject: z.string().optional(),
  message: z.string().min(10, "Сообщение должно содержать минимум 10 символов"),
});

type FormData = z.infer<typeof schema>;

interface DirectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DirectorModal({ isOpen, onClose }: DirectorModalProps) {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/director", {
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
      setError(
        e instanceof Error ? e.message : "Ошибка отправки. Попробуйте позже."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setIsSubmitted(false);
      setError(null);
      reset();
    }, 300);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 pb-0">
              <h2 className="text-xl font-bold text-text-primary">
                Письмо директору
              </h2>
              <button
                onClick={handleClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-text-secondary" />
              </button>
            </div>

            <div className="p-6">
              {isSubmitted ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-text-primary mb-1">
                    Письмо отправлено!
                  </h3>
                  <p className="text-text-secondary text-sm mb-6">
                    Спасибо за обращение. Мы рассмотрим ваше письмо в ближайшее
                    время.
                  </p>
                  <Button onClick={handleClose} variant="secondary">
                    Закрыть
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <Input
                    {...register("name")}
                    id="director-name"
                    label="Ваше имя *"
                    placeholder="Иван Иванов"
                    error={errors.name?.message}
                  />
                  <Input
                    {...register("email")}
                    id="director-email"
                    label="Email *"
                    placeholder="email@example.com"
                    type="email"
                    error={errors.email?.message}
                  />
                  <Input
                    {...register("phone")}
                    id="director-phone"
                    label="Телефон"
                    placeholder="+7 (___) ___-__-__"
                    type="tel"
                  />
                  <Input
                    {...register("subject")}
                    id="director-subject"
                    label="Тема"
                    placeholder="Тема обращения"
                  />
                  <div>
                    <label
                      htmlFor="director-message"
                      className="block text-sm font-medium text-text-primary mb-1.5"
                    >
                      Сообщение *
                    </label>
                    <textarea
                      {...register("message")}
                      id="director-message"
                      rows={4}
                      placeholder="Напишите ваше сообщение..."
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-colors resize-none"
                    />
                    {errors.message && (
                      <p className="text-xs text-red-600 mt-1">
                        {errors.message.message}
                      </p>
                    )}
                  </div>
                  {error && (
                    <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2">
                      {error}
                    </p>
                  )}
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading}
                  >
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
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
