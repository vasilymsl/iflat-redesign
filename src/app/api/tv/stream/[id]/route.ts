import { NextResponse } from "next/server";
import { getStreamUrl } from "@/lib/tv-token";

/**
 * GET /api/tv/stream/[id]
 *
 * Возвращает HLS stream URL для канала по internal id.
 * Токен 24h.tv получается и кешируется на сервере (см. lib/tv-token.ts).
 * Клиент получает только streamUrl — токен никогда не попадает в браузер.
 *
 * Response 200: { streamUrl: string }
 * Response 404: { error: string } — канал не найден или стрим недоступен
 * Response 500: { error: string } — неожиданная ошибка сервера
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const streamUrl = await getStreamUrl(id);

    if (!streamUrl) {
      return NextResponse.json(
        { error: "Channel not found or stream unavailable" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { streamUrl },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("[API /tv/stream]", error);
    return NextResponse.json(
      { error: "Failed to fetch stream URL" },
      { status: 500 }
    );
  }
}
