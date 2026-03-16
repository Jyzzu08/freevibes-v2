'use client';

import { useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import { Pause, Play, SkipBack, SkipForward, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { recordPlayback } from '@/lib/api';
import { formatDuration } from '@/lib/player';
import { usePlayerStore } from '@/store/player-store';
import { useSessionStore } from '@/store/session-store';

export function PlayerBar() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const reportedPlaybackRef = useRef<string | null>(null);
  const user = useSessionStore((state) => state.user);
  const {
    queue,
    currentIndex,
    isPlaying,
    volume,
    currentTime,
    queueContext,
    playNext,
    playPrevious,
    togglePlayback,
    setPlaying,
    setCurrentTime,
    setVolume,
  } = usePlayerStore();

  const currentTrack = useMemo(() => queue[currentIndex] ?? null, [queue, currentIndex]);

  useEffect(() => {
    if (!audioRef.current || !currentTrack?.audioUrl) {
      return;
    }

    audioRef.current.src = currentTrack.audioUrl;
    audioRef.current.currentTime = 0;
    audioRef.current.volume = volume;

    if (isPlaying) {
      void audioRef.current.play().catch(() => undefined);
    }
  }, [currentTrack, isPlaying, volume]);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    if (!audioRef.current || !currentTrack?.audioUrl) return;

    if (isPlaying) {
      void audioRef.current.play().catch(() => undefined);
      return;
    }

    audioRef.current.pause();
  }, [currentTrack?.audioUrl, isPlaying]);

  useEffect(() => {
    if (!user || !currentTrack || !isPlaying) {
      return;
    }

    const reportKey = [
      currentTrack.id,
      queueContext?.sourceType ?? currentTrack.sourceType ?? 'UNKNOWN',
      queueContext?.sourceId ?? currentTrack.sourceId ?? '',
    ].join(':');

    if (reportedPlaybackRef.current === reportKey) {
      return;
    }

    reportedPlaybackRef.current = reportKey;

    void recordPlayback({
      trackId: currentTrack.id,
      sourceType: queueContext?.sourceType ?? currentTrack.sourceType ?? 'UNKNOWN',
      sourceId: queueContext?.sourceId ?? currentTrack.sourceId ?? null,
      progressSeconds: 0,
      completed: false,
    }).catch(() => undefined);
  }, [currentTrack, isPlaying, queueContext, user]);

  if (!currentTrack) {
    return null;
  }

  const handleSeek = (nextTime: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = nextTime;
    }
    setCurrentTime(nextTime);
  };

  return (
    <div
      className={`fixed bottom-4 left-4 right-4 z-50 rounded-[30px] border p-4 backdrop-blur-xl transition-all duration-300 ${
        isPlaying
          ? 'border-[rgba(255,213,74,0.28)] bg-black/88 shadow-[0_18px_48px_rgba(255,213,74,0.1)]'
          : 'border-white/10 bg-black/85'
      }`}
    >
      <audio
        ref={audioRef}
        onPause={() => setPlaying(false)}
        onPlay={() => setPlaying(true)}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onEnded={playNext}
      />
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4 md:min-w-[300px]">
          <div
            className={`relative h-14 w-14 overflow-hidden rounded-2xl border transition-all duration-300 ${
              isPlaying ? 'border-[rgba(255,213,74,0.3)] shadow-[0_0_0_1px_rgba(255,213,74,0.12)]' : 'border-white/10'
            }`}
          >
            <Image
              src={currentTrack.coverUrl ?? '/legacy/FreeVibes.jpg'}
              alt={currentTrack.title}
              fill
              className={`object-cover transition duration-500 ${isPlaying ? 'scale-[1.03]' : ''}`}
            />
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium text-[var(--color-text)]">{currentTrack.title}</p>
            <p className="truncate text-sm text-[var(--color-muted)]">
              {currentTrack.artistName} / {currentTrack.albumTitle}
            </p>
            {queueContext?.sourceLabel ? (
              <p className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-[var(--color-accent)]">
                <span
                  className={`inline-block h-2 w-2 rounded-full bg-[var(--color-accent)] ${
                    isPlaying ? 'animate-pulse' : ''
                  }`}
                />
                {queueContext.sourceLabel}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-1 flex-col items-center gap-3">
          <div className="flex items-center gap-3">
            <Button variant="secondary" size="sm" onClick={playPrevious}>
              <SkipBack className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={togglePlayback}>
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button variant="secondary" size="sm" onClick={playNext}>
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex w-full items-center gap-3">
            <span className="text-xs text-[var(--color-muted)]">{formatDuration(currentTime)}</span>
            <input
              type="range"
              min={0}
              max={Math.max(currentTrack.durationSec, 1)}
              step={1}
              value={Math.min(currentTime, currentTrack.durationSec)}
              onChange={(event) => handleSeek(Number(event.target.value))}
              className="w-full accent-[var(--color-accent)]"
            />
            <span className="text-xs text-[var(--color-muted)]">
              {formatDuration(currentTrack.durationSec)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 md:min-w-[210px] md:justify-end">
          <Volume2 className="h-4 w-4 text-[var(--color-muted)]" />
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(event) => setVolume(Number(event.target.value))}
            className="w-full accent-[var(--color-accent)] md:w-32"
          />
        </div>
      </div>
    </div>
  );
}
