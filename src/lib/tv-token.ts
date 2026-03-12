/**
 * TokenManager singleton для работы с API 24h.tv.
 *
 * Все запросы выполняются через fetch (работает и локально, и на Vercel).
 * Локально QRATOR может блокировать — при ошибке fallback на curl.
 *
 * Токен хранится только на сервере. Клиент вызывает /api/tv/stream/[id].
 */

import { createHash, randomUUID } from "crypto";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const TV_API_BASE =
  process.env.TV_API_BASE_URL ?? "https://api.24h.tv";

const PROVIDER_POSTFIX = process.env.TV_PROVIDER_POSTFIX ?? "";

/** Маппинг internal id → числовой id бесплатного канала в API 24h.tv */
export const CHANNEL_ID_MAP: Record<string, number> = {
  perviy:    3929,
  russia1:   5515,
  match:     3948,
  ntv:       10004,
  pyatiy:    4833,
  russia24:  10049,
  otr:       10199,
  tvc:       10003,
  karusel:   10040,
  spas:      10060,
  ren:       10007,
  sts:       4835,
  tv3:       3947,
  pyatnica:  3570,
  domashniy: 10115,
};

const REVERSE_CHANNEL_MAP: Record<number, string> = Object.fromEntries(
  Object.entries(CHANNEL_ID_MAP).map(([k, v]) => [v, k])
);

const CHANNEL_ORDER = Object.values(CHANNEL_ID_MAP);

// ── Кеш данных каналов и новинок ─────────────────────────────

interface DataCache<T> {
  data: T | null;
  expiresAt: number;
  inflightPromise: Promise<T> | null;
}

declare global {
  var __tvChannelsCache: DataCache<ChannelApiItem[]> | undefined;
  var __tvNovinkiCache: DataCache<ContentApiItem[]> | undefined;
}

interface ChannelApiCover {
  bg?: string;
  color_bg?: string;
  light_bg?: string;
  dark_bg?: string;
  full?: string;
}

interface ChannelApiItem {
  id: number;
  name: string;
  slug: string;
  icon: string;
  cover: ChannelApiCover;
  is_hd?: boolean;
}

interface ScheduleEntry {
  timestamp: number;
  duration: number;
  img?: { src?: string };
  program?: { title?: string };
}

interface CurrentProgramInfo {
  title: string;
  img: string;
}

declare global {
  var __tvScheduleCache: {
    data: Map<number, CurrentProgramInfo>;
    expiresAt: number;
  } | undefined;
}

interface ContentApiCover {
  src_2x3?: string;
  src_16x9?: string;
}

interface ContentApiRating {
  type: string;
  rating: string;
  name: string;
}

interface ContentApiGenre {
  name: string;
}

interface ContentApiItem {
  id: string;
  title: string;
  slug: string;
  content_type: string;
  cover: ContentApiCover;
  ratings?: ContentApiRating[];
  year?: string;
  genres?: ContentApiGenre[];
  age?: number;
}

const DATA_CACHE_TTL = 15 * 60 * 1000;

function ensureHttps(url: string | undefined): string {
  if (!url) return "";
  return url.replace(/^http:\/\//, "https://");
}

// ── Network check ────────────────────────────────────────────

interface NetworkData {
  is_guest_allowed?: boolean;
  provider?: {
    is_have_purchases?: boolean;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

declare global {
  var __tvNetworkData: { data: NetworkData | null; expiresAt: number } | undefined;
}

if (!globalThis.__tvNetworkData) {
  globalThis.__tvNetworkData = { data: null, expiresAt: 0 };
}

const networkCache = globalThis.__tvNetworkData;
const NETWORK_CACHE_TTL = 30 * 60 * 1000;

/**
 * Async HTTP JSON request. Использует fetch, при ошибке на localhost — fallback на curl.
 */
async function apiJson(method: string, url: string, body?: unknown): Promise<unknown> {
  try {
    const resp = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(15_000),
    });
    const text = await resp.text();
    return JSON.parse(text);
  } catch (fetchErr) {
    // Fallback на curl для локальной разработки (QRATOR блокирует fetch)
    if (process.env.VERCEL) throw fetchErr;

    try {
      const { execSync } = await import("child_process");
      const args = [
        "curl", "-s", "-m", "15",
        "-X", method,
        "-H", "Content-Type: application/json",
        "-H", "Accept: application/json",
      ];
      if (body) args.push("-d", JSON.stringify(body));
      args.push(url);
      const cmd = args.map(a => `'${a.replace(/'/g, "'\\''")}'`).join(" ");
      const stdout = execSync(cmd, {
        encoding: "utf-8",
        timeout: 20_000,
        stdio: ["pipe", "pipe", "pipe"],
      });
      return JSON.parse(stdout);
    } catch (curlErr) {
      console.error("[tv-token] Both fetch and curl failed for", url);
      throw fetchErr;
    }
  }
}

async function fetchNetworkData(): Promise<NetworkData> {
  const data = await apiJson("GET", `${TV_API_BASE}/v2/users/self/network`) as NetworkData;
  networkCache.data = data;
  networkCache.expiresAt = Date.now() + NETWORK_CACHE_TTL;
  return data;
}

async function getNetworkData(): Promise<NetworkData> {
  if (networkCache.data && Date.now() < networkCache.expiresAt) {
    return networkCache.data;
  }
  return fetchNetworkData();
}

// ── Token cache ──────────────────────────────────────────────

interface TvTokenCache {
  token: string | null;
  expiresAt: number;
  serial: string | null;
  username: string | null;
  password: string | null;
  inflightPromise: Promise<string> | null;
}

declare global {
  var __tvTokenCache: TvTokenCache | undefined;
}

const TOKEN_CACHE_FILE = join(process.cwd(), ".tv-token-cache.json");

interface PersistentTokenData {
  token: string | null;
  expiresAt: number;
  serial: string | null;
  username: string | null;
  password: string | null;
}

function loadPersistentCache(): Partial<PersistentTokenData> {
  try {
    const raw = readFileSync(TOKEN_CACHE_FILE, "utf-8");
    return JSON.parse(raw) as PersistentTokenData;
  } catch {
    return {};
  }
}

function savePersistentCache() {
  try {
    const data: PersistentTokenData = {
      token: cache.token,
      expiresAt: cache.expiresAt,
      serial: cache.serial,
      username: cache.username,
      password: cache.password,
    };
    writeFileSync(TOKEN_CACHE_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch {
    // На Vercel файловая система read-only — игнорируем
  }
}

if (!globalThis.__tvTokenCache) {
  const persisted = loadPersistentCache();
  globalThis.__tvTokenCache = {
    token: persisted.token ?? null,
    expiresAt: persisted.expiresAt ?? 0,
    serial: persisted.serial ?? null,
    username: persisted.username ?? null,
    password: persisted.password ?? null,
    inflightPromise: null,
  };
}

const cache = globalThis.__tvTokenCache;

function sha1Trunc(input: string): string {
  return createHash("sha1").update(input).digest("hex").slice(0, 32);
}

/**
 * 5-шаговая гостевая аутентификация.
 */
async function fetchNewGuestToken(): Promise<string> {
  const networkData = await getNetworkData();

  if (networkData.is_guest_allowed === false) {
    throw new Error("[tv-token] Guest creation not allowed");
  }

  const serial = cache.serial ?? randomUUID();
  cache.serial = serial;

  const username = randomUUID();
  const password = sha1Trunc(username + serial);

  const createBody: Record<string, unknown> = {
    username, password, is_guest: true,
  };

  if (networkData.provider?.is_have_purchases) {
    createBody.app_version = "v30";
  }

  const postfix = PROVIDER_POSTFIX ? `?provider=${PROVIDER_POSTFIX}` : "";

  const createData = await apiJson("POST", `${TV_API_BASE}/v2/users${postfix}`, createBody) as { id?: number };

  if (!createData.id) {
    throw new Error(`[tv-token] Create guest failed: ${JSON.stringify(createData)}`);
  }

  const loginBody: Record<string, unknown> = { login: username, password };
  if (networkData.provider?.is_have_purchases) {
    loginBody.app_version = "v30";
  }

  const loginData = await apiJson("POST", `${TV_API_BASE}/v2/auth/login`, loginBody) as { access_token?: string };

  if (!loginData.access_token) {
    throw new Error(`[tv-token] Login failed: ${JSON.stringify(loginData)}`);
  }

  const interimToken = loginData.access_token;
  cache.username = username;
  cache.password = password;

  const deviceData = await apiJson(
    "POST",
    `${TV_API_BASE}/v2/users/self/devices?access_token=${interimToken}`,
    {
      device_type: "pc",
      vendor: "PC",
      model: "Chrome",
      version: "199",
      os_name: "Linux",
      os_version: "6.1",
      application_type: "web",
      serial,
    }
  ) as { id?: string };

  if (!deviceData.id) {
    throw new Error(`[tv-token] Device registration failed: ${JSON.stringify(deviceData)}`);
  }

  const authData = await apiJson(
    "POST",
    `${TV_API_BASE}/v2/auth/device?access_token=${interimToken}`,
    { device_id: deviceData.id }
  ) as { access_token?: string; expired?: number };

  if (!authData.access_token) {
    throw new Error(`[tv-token] Device auth failed: ${JSON.stringify(authData)}`);
  }

  const token = authData.access_token;
  const ttlMs = authData.expired
    ? authData.expired * 1000 - Date.now() - 60_000
    : 90 * 60 * 1000;

  cache.token = token;
  cache.expiresAt = Date.now() + Math.max(ttlMs, 60_000);
  savePersistentCache();

  return token;
}

async function reloginWithCachedCredentials(): Promise<string> {
  if (!cache.username || !cache.password || !cache.serial) {
    return fetchNewGuestToken();
  }

  try {
    const loginData = await apiJson("POST", `${TV_API_BASE}/v2/auth/login`, {
      login: cache.username, password: cache.password,
    }) as { access_token?: string };

    if (!loginData.access_token) {
      return fetchNewGuestToken();
    }

    const interimToken = loginData.access_token;

    const authData = await apiJson(
      "POST",
      `${TV_API_BASE}/v2/auth/device?access_token=${interimToken}`,
      { device_id: cache.serial }
    ) as { access_token?: string; expired?: number };

    if (!authData.access_token) {
      return fetchNewGuestToken();
    }

    const token = authData.access_token;
    const ttlMs = authData.expired
      ? authData.expired * 1000 - Date.now() - 60_000
      : 90 * 60 * 1000;

    cache.token = token;
    cache.expiresAt = Date.now() + Math.max(ttlMs, 60_000);
    savePersistentCache();
    return token;
  } catch {
    return fetchNewGuestToken();
  }
}

export async function getGuestToken(): Promise<string> {
  if (cache.token && Date.now() < cache.expiresAt) {
    return cache.token;
  }

  if (cache.inflightPromise) {
    return cache.inflightPromise;
  }

  const authFn = cache.username ? reloginWithCachedCredentials : fetchNewGuestToken;

  cache.inflightPromise = authFn().finally(() => {
    cache.inflightPromise = null;
  });

  return cache.inflightPromise;
}

function invalidateToken() {
  cache.token = null;
  cache.expiresAt = 0;
}

export async function getStreamUrl(internalId: string): Promise<string | null> {
  const apiId = CHANNEL_ID_MAP[internalId];

  if (!apiId) {
    console.warn(`[tv-token] No API id mapping for channel: ${internalId}`);
    return null;
  }

  try {
    const token = await getGuestToken();

    const data = await apiJson(
      "GET",
      `${TV_API_BASE}/v2/channels/${apiId}/stream?access_token=${token}&force_https=true`
    ) as { hls?: string; hls_mbr?: string; status_code?: number; error_code?: string };

    if (data.status_code === 401) {
      invalidateToken();
      const freshToken = await getGuestToken();

      const retryData = await apiJson(
        "GET",
        `${TV_API_BASE}/v2/channels/${apiId}/stream?access_token=${freshToken}&force_https=true`
      ) as { hls?: string; hls_mbr?: string };

      return retryData.hls_mbr || retryData.hls || null;
    }

    if (data.error_code) {
      console.error(`[tv-token] Stream error for ${internalId}: ${data.error_code}`);
      return null;
    }

    return data.hls_mbr || data.hls || null;
  } catch (error) {
    console.error(`[tv-token] Unexpected error for channel ${internalId}:`, error);
    return null;
  }
}

// ── Динамическая загрузка каналов ─────────────────────────────

function initChannelsCache(): DataCache<ChannelApiItem[]> {
  if (!globalThis.__tvChannelsCache) {
    globalThis.__tvChannelsCache = { data: null, expiresAt: 0, inflightPromise: null };
  }
  return globalThis.__tvChannelsCache;
}

function initNovinkiCache(): DataCache<ContentApiItem[]> {
  if (!globalThis.__tvNovinkiCache) {
    globalThis.__tvNovinkiCache = { data: null, expiresAt: 0, inflightPromise: null };
  }
  return globalThis.__tvNovinkiCache;
}

async function fetchChannelsFromApi(): Promise<ChannelApiItem[]> {
  const token = await getGuestToken();
  const data = await apiJson(
    "GET",
    `${TV_API_BASE}/v2/rows/freechannels?access_token=${token}`
  ) as { channels?: ChannelApiItem[] };

  return data.channels ?? [];
}

const SCHEDULE_CACHE_TTL = 10 * 60 * 1000;

function initScheduleCache() {
  if (!globalThis.__tvScheduleCache) {
    globalThis.__tvScheduleCache = { data: new Map(), expiresAt: 0 };
  }
  return globalThis.__tvScheduleCache;
}

async function fetchCurrentPrograms(channelIds: number[]): Promise<Map<number, CurrentProgramInfo>> {
  const sc = initScheduleCache();
  if (sc.data.size > 0 && Date.now() < sc.expiresAt) {
    return sc.data;
  }

  const token = await getGuestToken();
  const nowSec = Math.floor(Date.now() / 1000);
  const result = new Map<number, CurrentProgramInfo>();

  // Загружаем расписания параллельно
  const promises = channelIds.map(async (chId) => {
    try {
      const schedule = await apiJson(
        "GET",
        `${TV_API_BASE}/v2/channels/${chId}/schedule?access_token=${token}`
      ) as ScheduleEntry[];

      if (Array.isArray(schedule)) {
        const current = schedule.find(
          s => s.timestamp <= nowSec && (s.timestamp + s.duration) > nowSec
        );
        if (current?.img?.src) {
          result.set(chId, {
            title: current.program?.title ?? "",
            img: ensureHttps(current.img.src),
          });
        }
      }
    } catch {
      // пропускаем
    }
  });

  await Promise.all(promises);

  sc.data = result;
  sc.expiresAt = Date.now() + SCHEDULE_CACHE_TTL;
  return result;
}

async function fetchNovinkiFromApi(): Promise<ContentApiItem[]> {
  const token = await getGuestToken();
  const data = await apiJson(
    "GET",
    `${TV_API_BASE}/v2/rows/novinki-641048475342005896?access_token=${token}`
  ) as { contents?: ContentApiItem[] };

  return data.contents ?? [];
}

export async function getChannels(): Promise<{
  id: string;
  name: string;
  logo: string;
  currentProgram: string;
  thumbnail: string;
}[]> {
  const dc = initChannelsCache();

  let channels: ChannelApiItem[];

  if (dc.data && Date.now() < dc.expiresAt) {
    channels = dc.data;
  } else if (dc.inflightPromise) {
    channels = await dc.inflightPromise;
  } else {
    dc.inflightPromise = fetchChannelsFromApi()
      .then(items => {
        dc.data = items;
        dc.expiresAt = Date.now() + DATA_CACHE_TTL;
        return items;
      })
      .catch(err => {
        console.error("[tv-token] Failed to fetch channels:", err);
        return dc.data ?? [];
      })
      .finally(() => { dc.inflightPromise = null; });

    channels = await dc.inflightPromise;
  }

  const ourChannels = channels.filter(ch => REVERSE_CHANNEL_MAP[ch.id]);
  const ourIds = ourChannels.map(ch => ch.id);

  let currentPrograms = new Map<number, CurrentProgramInfo>();
  try {
    currentPrograms = await fetchCurrentPrograms(ourIds);
  } catch (err) {
    console.error("[tv-token] Failed to fetch schedule:", err);
  }

  return transformChannels(ourChannels, currentPrograms);
}

function transformChannels(
  apiChannels: ChannelApiItem[],
  currentPrograms: Map<number, CurrentProgramInfo>,
) {
  apiChannels.sort((a, b) => {
    const ia = CHANNEL_ORDER.indexOf(a.id);
    const ib = CHANNEL_ORDER.indexOf(b.id);
    return ia - ib;
  });

  return apiChannels.map(ch => {
    const program = currentPrograms.get(ch.id);
    return {
      id: REVERSE_CHANNEL_MAP[ch.id],
      name: ch.name,
      logo: ensureHttps(ch.icon),
      currentProgram: program?.title || ch.name,
      thumbnail: program?.img || ensureHttps(ch.cover?.color_bg || ch.cover?.bg || ch.icon),
    };
  });
}

export async function getNovinki(): Promise<{
  id: string;
  title: string;
  subtitle: string;
  poster: string;
  href: string;
  rating: number;
}[]> {
  const dc = initNovinkiCache();

  if (dc.data && Date.now() < dc.expiresAt) {
    return transformNovinki(dc.data);
  }

  if (dc.inflightPromise) {
    const data = await dc.inflightPromise;
    return transformNovinki(data);
  }

  dc.inflightPromise = fetchNovinkiFromApi()
    .then(items => {
      dc.data = items;
      dc.expiresAt = Date.now() + DATA_CACHE_TTL;
      return items;
    })
    .catch(err => {
      console.error("[tv-token] Failed to fetch novinki:", err);
      return dc.data ?? [];
    })
    .finally(() => { dc.inflightPromise = null; });

  const items = await dc.inflightPromise;
  return transformNovinki(items);
}

function transformNovinki(apiItems: ContentApiItem[]) {
  return apiItems.map(item => {
    const kpRating = item.ratings?.find(r => r.type === "kinopoisk");
    const imdbRating = item.ratings?.find(r => r.type === "imdb");
    const rating = parseFloat(kpRating?.rating ?? imdbRating?.rating ?? "0");

    const genreNames = item.genres?.map(g => g.name).join(", ") ?? "";
    const subtitle = [item.year, genreNames].filter(Boolean).join(", ");

    return {
      id: item.id,
      title: item.title,
      subtitle,
      poster: ensureHttps(item.cover?.src_2x3 ?? ""),
      href: `https://24h.tv/contents/${item.id}`,
      rating,
    };
  });
}
