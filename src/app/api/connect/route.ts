import { NextResponse } from "next/server";
import { sendMail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phone, address, promo } = body;

    if (!name || !phone || !address) {
      return NextResponse.json(
        { error: "Заполните обязательные поля: имя, телефон, адрес" },
        { status: 400 }
      );
    }

    await sendMail({
      subject: `Заявка на подключение от ${name}`,
      html: `
        <h2>Новая заявка на подключение</h2>
        <table style="border-collapse:collapse;width:100%;max-width:500px;">
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Имя</td><td style="padding:8px;border:1px solid #ddd;">${escapeHtml(name)}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Телефон</td><td style="padding:8px;border:1px solid #ddd;"><a href="tel:${escapeHtml(phone)}">${escapeHtml(phone)}</a></td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Адрес</td><td style="padding:8px;border:1px solid #ddd;">${escapeHtml(address)}</td></tr>
          ${promo ? `<tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Промокод</td><td style="padding:8px;border:1px solid #ddd;">${escapeHtml(promo)}</td></tr>` : ""}
        </table>
        <p style="color:#999;font-size:12px;margin-top:16px;">Отправлено с сайта iflat.ru</p>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API /connect]", error);
    return NextResponse.json(
      { error: "Ошибка отправки. Попробуйте позже." },
      { status: 500 }
    );
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
