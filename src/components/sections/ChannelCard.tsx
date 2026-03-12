"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export interface ChannelData {
  id: string;
  name: string;
  logo: string;
  currentProgram: string;
  thumbnail: string;
  /** Progress of current program 0-100 */
  progress?: number;
}

interface ChannelCardProps {
  channel: ChannelData;
  className?: string;
}

export function ChannelCard({ channel, className }: ChannelCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hlsRef = useRef<any>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const startStream = useCallback(async () => {
    if (!videoRef.current) return;

    // Abort any previous listeners
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    // Fetch stream URL from our server API
    let streamUrl: string;
    try {
      const resp = await fetch(`/api/tv/stream/${channel.id}`, {
        signal: ac.signal,
      });
      if (!resp.ok) return;
      const data = await resp.json() as { streamUrl: string };
      if (!data.streamUrl || ac.signal.aborted) return;
      streamUrl = data.streamUrl;
    } catch {
      return; // aborted or network error
    }

    const video = videoRef.current;
    if (!video || ac.signal.aborted) return;

    const isHls = streamUrl.includes(".m3u8");

    const onPlaying = () => {
      if (!ac.signal.aborted) setVideoReady(true);
    };

    if (isHls) {
      // Native HLS (Safari, iOS)
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = streamUrl;
        video.addEventListener(
          "loadedmetadata",
          () => { video.play().catch(() => {}); },
          { once: true, signal: ac.signal }
        );
        video.addEventListener("playing", onPlaying, { once: true, signal: ac.signal });
        return;
      }

      // hls.js for other browsers
      try {
        const HlsModule = await import("hls.js");
        const Hls = HlsModule.default;

        if (!Hls.isSupported() || ac.signal.aborted) return;

        const hls = new Hls({
          maxBufferLength: 3,
          maxMaxBufferLength: 5,
          startLevel: -1,
        });

        hls.loadSource(streamUrl);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(() => {});
        });

        hls.on(Hls.Events.ERROR, (_event: unknown, data: { fatal?: boolean }) => {
          if (data.fatal) hls.destroy();
        });

        hlsRef.current = hls;
        video.addEventListener("playing", onPlaying, { once: true, signal: ac.signal });
      } catch {
        // hls.js not available
      }
    } else {
      // mp4 or direct video
      video.src = streamUrl;
      video.addEventListener("playing", onPlaying, { once: true, signal: ac.signal });
      video.play().catch(() => {});
    }
  }, [channel.id]);

  const stopStream = useCallback(() => {
    setVideoReady(false);
    abortRef.current?.abort();
    abortRef.current = null;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.removeAttribute("src");
      videoRef.current.load();
    }
  }, []);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    hoverTimerRef.current = setTimeout(() => {
      startStream();
    }, 200);
  }, [startStream]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    stopStream();
  }, [stopStream]);

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
      abortRef.current?.abort();
      if (hlsRef.current) hlsRef.current.destroy();
    };
  }, []);

  return (
    <div
      className={cn("channel-card group", className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className={cn(
          "channel-card-inner",
          isHovered && "channel-card-inner--hovered"
        )}
      >
        {/* Preview area 16:9 */}
        <div className="channel-card__preview">
          <Image
            src={channel.thumbnail}
            alt={channel.currentProgram}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            unoptimized
          />

          {/* Video overlay */}
          <div
            className={cn(
              "absolute inset-0 z-10 transition-opacity duration-300",
              videoReady && isHovered ? "opacity-100" : "opacity-0"
            )}
            style={{ transitionDelay: videoReady ? "0.4s" : "0s" }}
          >
            <video
              ref={videoRef}
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          </div>

          {/* Live indicator */}
          {isHovered && videoReady && (
            <div className="absolute top-2 right-2 z-20 flex items-center gap-1 bg-black/60 rounded px-1.5 py-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[10px] text-white font-medium">LIVE</span>
            </div>
          )}

          {/* Progress bar */}
          {channel.progress !== undefined && channel.progress > 0 && (
            <div className="absolute bottom-0 left-0 right-0 z-20 h-[3px] bg-white/20">
              <div
                className="h-full bg-brand-primary transition-all"
                style={{ width: `${channel.progress}%` }}
              />
            </div>
          )}
        </div>

        {/* Info panel */}
        <div className="channel-card__info">
          <div className="channel-card__logo">
            <Image
              src={channel.logo}
              alt={channel.name}
              width={84}
              height={50}
              className="object-contain w-full h-full p-2"
              unoptimized
            />
          </div>

          <div className="channel-card__text">
            <p className="channel-card__program">{channel.currentProgram}</p>
            <span className="channel-card__name">{channel.name}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
