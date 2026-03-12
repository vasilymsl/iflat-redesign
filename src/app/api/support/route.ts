import { NextResponse } from "next/server";
import { sendMail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { login, phone } = body;

    if (!login || !phone) {
      return NextResponse.json(
        { error: "Заполните обязательные поля: логин и телефон" },
        { status: 400 }
      );
    }

    await sendMail({
      subject: `Обращение в техподдержку — ${login}`,
      to: process.env.MAIL_SUPPORT || "support@iflat.ru",
      html: `
        <h2>Обращение в техническую поддержку</h2>
        <table style="border-collapse:collapse;width:100%;max-width:500px;">
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Логин / договор</td><td style="padding:8px;border:1px solid #ddd;">${escapeHtml(login)}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Телефон</td><td style="padding:8px;border:1px solid #ddd;"><a href="tel:${escapeHtml(phone)}">${escapeHtml(phone)}</a></td></tr>
        </table>
        <p style="color:#999;font-size:12px;margin-top:16px;">Отправлено с сайта iflat.ru</p>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API /support]", error);
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
