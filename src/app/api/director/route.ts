import { NextResponse } from "next/server";
import { sendMail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, subject, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Заполните обязательные поля: имя, email, сообщение" },
        { status: 400 }
      );
    }

    await sendMail({
      subject: `Письмо директору: ${subject || "Без темы"} — от ${name}`,
      html: `
        <h2>Письмо директору</h2>
        <table style="border-collapse:collapse;width:100%;max-width:500px;">
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Имя</td><td style="padding:8px;border:1px solid #ddd;">${escapeHtml(name)}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Email</td><td style="padding:8px;border:1px solid #ddd;"><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td></tr>
          ${phone ? `<tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Телефон</td><td style="padding:8px;border:1px solid #ddd;"><a href="tel:${escapeHtml(phone)}">${escapeHtml(phone)}</a></td></tr>` : ""}
          ${subject ? `<tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Тема</td><td style="padding:8px;border:1px solid #ddd;">${escapeHtml(subject)}</td></tr>` : ""}
        </table>
        <h3 style="margin-top:20px;">Сообщение:</h3>
        <div style="padding:12px;background:#f9f9f9;border-radius:8px;white-space:pre-wrap;">${escapeHtml(message)}</div>
        <p style="color:#999;font-size:12px;margin-top:16px;">Отправлено с сайта iflat.ru</p>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API /director]", error);
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
