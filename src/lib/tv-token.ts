/**
 * TokenManager singleton для работы с API 24h.tv.
 *
 * QRATOR anti-bot блокирует Node.js fetch по TLS fingerprint,
 * поэтому auth-запросы выполняются через curl (execSync).
 * Stream URL тоже получаются через curl.
 *
 * Токен хранится только на сервере. Клиент вызывает /api/tv/stream/[id].
 */

import { createHash, randomUUID } from "crypto";
import { execSync } from "child_process";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const TV_API_BASE =
  process.env.TV_API_BASE_URL ?? "https://api.24h.tv";

const PROVIDER_POSTFIX = process.env.TV_PROVIDER_POSTFIX ?? "";

/** Маппинг internal id → числовой id бесплатного канала в API 24h.tv */
export const CHANNEL_ID_MAP: Record<string, number> = {
  perviy:    3929,  // Первый канал HD
  russia1:   5515,  // Россия-1 HD
  match:     3948,  // МАТЧ! HD
  ntv:       10004, // НТВ HD
  pyatiy:    4833,  // 5 канал HD
  russia24:  10049, // Россия-24 HD
  otr:       10199, // ОТР HD
  tvc:       10003, // ТВЦ HD
  karusel:   10040, // Карусель
  spas:      10060, // Спас
  ren:       10007, // РЕН ТВ HD
  sts:       4835,  // СТС HD
  tv3:       3947,  // ТВ3 HD
  pyatnica:  3570,  // Пятница! HD
  domashniy: 10115, // Домашний HD
};

/** Обратный маппинг: числовой API id → internal id */
const REVERSE_CHANNEL_MAP: Record<number, string> = Object.fromEntries(
  Object.entries(CHANNEL_ID_MAP).map(([k, v]) => [v, k])
);

/** Порядок каналов для шлейфа (как на сайте 24h.tv) */
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

/** Элемент расписания канала из /v2/channels/{id}/schedule */
interface ScheduleEntry {
  timestamp: number;
  duration: number;
  img?: { src?: string };
  program?: { title?: string };
}

/** Кеш текущих программ: channelApiId → { title, img, expiresAt } */
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

const DATA_CACHE_TTL = 15 * 60 * 1000; // 15 минут

function ensureHttps(url: string | undefined): string {
  if (!url) return "";
  return url.replace(/^http:\/\//, "https://");
}

// ── Network check (обязательный первый запрос) ──────────────

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
const NETWORK_CACHE_TTL = 30 * 60 * 1000; // 30 минут

/**
 * Выполняет GET /v2/users/self/network — обязательный первый запрос,
 * устанавливающий контекст провайдера на стороне API.
 */
function fetchNetworkData(): NetworkData {
  const data = curlJson("GET", `${TV_API_BASE}/v2/users/self/network`) as NetworkData;
  networkCache.data = data;
  networkCache.expiresAt = Date.now() + NETWORK_CACHE_TTL;
  return data;
}

function getNetworkData(): NetworkData {
  if (networkCache.data && Date.now() < networkCache.expiresAt) {
    return networkCache.data;
  }
  return fetchNetworkData();
}

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

// ── Persistent file cache ─────────────────────────────────────
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
  } catch (err) {
    console.warn("[tv-token] Failed to write persistent cache:", err);
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
  if (persisted.token) {
    console.log("[tv-token] Restored credentials from persistent cache");
  }
}

const cache = globalThis.__tvTokenCache;

function sha1Trunc(input: string): string {
  return createHash("sha1").update(input).digest("hex").slice(0, 32);
}

/**
 * Выполняет HTTP-запрос через curl (обходит QRATOR TLS fingerprinting).
 * Возвращает JSON-ответ.
 */
function curlJson(method: string, url: string, body?: unknown): unknown {
  const args = [
    "curl", "-s", "-m", "15",
    "-X", method,
    "-H", "Content-Type: application/json",
    "-H", "Accept: application/json",
  ];

  if (body) {
    args.push("-d", JSON.stringify(body));
  }

  args.push(url);

  // Экранируем аргументы для shell
  const cmd = args.map(a => `'${a.replace(/'/g, "'\\''")}'`).join(" ");

  const stdout = execSync(cmd, {
    encoding: "utf-8",
    timeout: 20_000,
    stdio: ["pipe", "pipe", "pipe"],
  });

  return JSON.parse(stdout);
}

/**
 * 5-шаговая гостевая аутентификация через curl.
 * Шаг 0 (network) — обязательный, устанавливает контекст провайдера.
 */
async function fetchNewGuestToken(): Promise<string> {
  // Шаг 0: запрос network — устанавливает контекст провайдера на стороне API
  const networkData = getNetworkData();

  if (networkData.is_guest_allowed === false) {
    throw new Error("[tv-token] Guest creation not allowed by provider (is_guest_allowed=false)");
  }

  const serial = cache.serial ?? randomUUID();
  cache.serial = serial;

  const username = randomUUID();
  const password = sha1Trunc(username + serial);

  // Шаг 1: создать гостевого юзера
  const createBody: Record<string, unknown> = {
    username, password, is_guest: true,
  };

  // Если у провайдера есть покупки — передаём app_version (как в client-web)
  if (networkData.provider?.is_have_purchases) {
    createBody.app_version = "v30";
  }

  const postfix = PROVIDER_POSTFIX ? `?provider=${PROVIDER_POSTFIX}` : "";

  const createData = curlJson("POST", `${TV_API_BASE}/v2/users${postfix}`, createBody) as { id?: number };

  if (!createData.id) {
    throw new Error(`[tv-token] Create guest failed: ${JSON.stringify(createData)}`);
  }

  // Шаг 2: логин → промежуточный токен
  const loginBody: Record<string, unknown> = { login: username, password };
  if (networkData.provider?.is_have_purchases) {
    loginBody.app_version = "v30";
  }

  const loginData = curlJson("POST", `${TV_API_BASE}/v2/auth/login`, loginBody) as { access_token?: string };

  if (!loginData.access_token) {
    throw new Error(`[tv-token] Login failed: ${JSON.stringify(loginData)}`);
  }

  const interimToken = loginData.access_token;

  // Сохраняем credentials для повторного логина без создания нового юзера
  cache.username = username;
  cache.password = password;

  // Шаг 3: зарегистрировать устройство
  const deviceData = curlJson(
    "POST",
    `${TV_API_BASE}/v2/users/self/devices?access_token=${interimToken}`,
    {
      device_type: "pc",
      vendor: "PC",
      model: "Chrome",
      version: "199",
      os_name: "macOS",
      os_version: "15.0",
      application_type: "web",
      serial,
    }
  ) as { id?: string };

  if (!deviceData.id) {
    throw new Error(`[tv-token] Device registration failed: ${JSON.stringify(deviceData)}`);
  }

  // Шаг 4: получить финальный токен
  const authData = curlJson(
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

/**
 * Попробовать переавторизоваться с сохранёнными credentials (без создания нового юзера).
 */
async function reloginWithCachedCredentials(): Promise<string> {
  if (!cache.username || !cache.password || !cache.serial) {
    return fetchNewGuestToken();
  }

  try {
    const loginData = curlJson("POST", `${TV_API_BASE}/v2/auth/login`, {
      login: cache.username, password: cache.password,
    }) as { access_token?: string };

    if (!loginData.access_token) {
      return fetchNewGuestToken();
    }

    const interimToken = loginData.access_token;

    const authData = curlJson(
      "POST",
      `${TV_API_BASE}/v2/auth/device?access_token=${interimToken}`,
      { device_id: cache.serial }
    ) as { access_token?: string; expired?: number };

    // Если device auth не сработал — делаем полный flow
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

/**
 * Получить гостевой токен с кешированием и promise deduplication.
 */
export async function getGuestToken(): Promise<string> {
  if (cache.token && Date.now() < cache.expiresAt) {
    return cache.token;
  }

  if (cache.inflightPromise) {
    return cache.inflightPromise;
  }

  // Если есть сохранённые credentials — переавторизуемся без нового юзера
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

/**
 * Получить HLS stream URL для канала через curl.
 */
export async function getStreamUrl(internalId: string): Promise<string | null> {
  const apiId = CHANNEL_ID_MAP[internalId];

  if (!apiId) {
    console.warn(`[tv-token] No API id mapping for channel: ${internalId}`);
    return null;
  }

  try {
    const token = await getGuestToken();

    const data = curlJson(
      "GET",
      `${TV_API_BASE}/v2/channels/${apiId}/stream?access_token=${token}&force_https=true`
    ) as { hls?: string; hls_mbr?: string; status_code?: number; error_code?: string };

    // 401/403 — токен устарел или подписка
    if (data.status_code === 401) {
      invalidateToken();
      const freshToken = await getGuestToken();

      const retryData = curlJson(
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
  const data = curlJson(
    "GET",
    `${TV_API_BASE}/v2/rows/freechannels?access_token=${token}`
  ) as { channels?: ChannelApiItem[] };

  return data.channels ?? [];
}

const SCHEDULE_CACHE_TTL = 10 * 60 * 1000; // 10 минут

function initScheduleCache() {
  if (!globalThis.__tvScheduleCache) {
    globalThis.__tvScheduleCache = { data: new Map(), expiresAt: 0 };
  }
  return globalThis.__tvScheduleCache;
}

/**
 * Загрузить расписание каналов и найти текущие передачи.
 * Возвращает Map<channelApiId, { title, img }>.
 */
async function fetchCurrentPrograms(channelIds: number[]): Promise<Map<number, CurrentProgramInfo>> {
  const sc = initScheduleCache();
  if (sc.data.size > 0 && Date.now() < sc.expiresAt) {
    return sc.data;
  }

  const token = await getGuestToken();
  const nowSec = Math.floor(Date.now() / 1000);
  const result = new Map<number, CurrentProgramInfo>();

  // Загружаем расписания параллельно (curl синхронный, но это OK для server-side)
  for (const chId of channelIds) {
    try {
      const schedule = curlJson(
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
      // Если не удалось получить расписание канала — пропускаем
    }
  }

  sc.data = result;
  sc.expiresAt = Date.now() + SCHEDULE_CACHE_TTL;
  return result;
}

async function fetchNovinkiFromApi(): Promise<ContentApiItem[]> {
  const token = await getGuestToken();
  const data = curlJson(
    "GET",
    `${TV_API_BASE}/v2/rows/novinki-641048475342005896?access_token=${token}`
  ) as { contents?: ContentApiItem[] };

  return data.contents ?? [];
}

/**
 * Получить бесплатные каналы с 24h.tv.
 * Подтягивает расписание для реальных картинок текущих передач.
 * Возвращает данные, совместимые с ChannelData.
 */
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

  // Фильтруем наши каналы
  const ourChannels = channels.filter(ch => REVERSE_CHANNEL_MAP[ch.id]);
  const ourIds = ourChannels.map(ch => ch.id);

  // Загружаем текущие программы (расписание)
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
  // Сортируем по заданному порядку
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

/**
 * Получить новинки с 24h.tv.
 * Возвращает данные, совместимые с ContentItem.
 */
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
