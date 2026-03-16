'use client';

import type { PlaybackSourceType, PlayerTrack } from '@freevibes/types';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface QueueContext {
  sourceType: PlaybackSourceType;
  sourceId: string | null;
  sourceLabel: string | null;
}

interface PlayerStore {
  queue: PlayerTrack[];
  currentIndex: number;
  isPlaying: boolean;
  volume: number;
  currentTime: number;
  queueContext: QueueContext | null;
  setQueue: (queue: PlayerTrack[], startIndex?: number, context?: Partial<QueueContext>) => void;
  playTrack: (track: PlayerTrack, queue?: PlayerTrack[], context?: Partial<QueueContext>) => void;
  selectTrack: (index: number) => void;
  playNext: () => void;
  playPrevious: () => void;
  togglePlayback: () => void;
  setPlaying: (isPlaying: boolean) => void;
  setVolume: (volume: number) => void;
  setCurrentTime: (time: number) => void;
}

export const usePlayerStore = create<PlayerStore>()(
  persist(
    (set, get) => ({
      queue: [],
      currentIndex: 0,
      isPlaying: false,
      volume: 0.8,
      currentTime: 0,
      queueContext: null,
      setQueue: (queue, startIndex = 0, context) =>
        set({
          queue,
          currentIndex: startIndex,
          currentTime: 0,
          isPlaying: queue.length > 0,
          queueContext: queue.length
            ? {
                sourceType: context?.sourceType ?? queue[startIndex]?.sourceType ?? 'UNKNOWN',
                sourceId: context?.sourceId ?? queue[startIndex]?.sourceId ?? null,
                sourceLabel: context?.sourceLabel ?? queue[startIndex]?.sourceLabel ?? null,
              }
            : null,
        }),
      playTrack: (track, queue, context) =>
        set({
          queue: queue ?? [track],
          currentIndex: queue
            ? Math.max(
                queue.findIndex((item) => item.id === track.id),
                0,
              )
            : 0,
          currentTime: 0,
          isPlaying: true,
          queueContext: {
            sourceType: context?.sourceType ?? track.sourceType ?? 'UNKNOWN',
            sourceId: context?.sourceId ?? track.sourceId ?? null,
            sourceLabel: context?.sourceLabel ?? track.sourceLabel ?? null,
          },
        }),
      selectTrack: (index) =>
        set((state) => ({
          currentIndex: index < 0 || index >= state.queue.length ? state.currentIndex : index,
          currentTime: 0,
          isPlaying: state.queue.length > 0,
        })),
      playNext: () => {
        const { queue, currentIndex } = get();
        if (!queue.length) return;
        set({
          currentIndex: (currentIndex + 1) % queue.length,
          currentTime: 0,
          isPlaying: true,
        });
      },
      playPrevious: () => {
        const { queue, currentIndex } = get();
        if (!queue.length) return;
        set({
          currentIndex: currentIndex === 0 ? queue.length - 1 : currentIndex - 1,
          currentTime: 0,
          isPlaying: true,
        });
      },
      togglePlayback: () => set((state) => ({ isPlaying: !state.isPlaying })),
      setPlaying: (isPlaying) => set({ isPlaying }),
      setVolume: (volume) => set({ volume }),
      setCurrentTime: (time) => set({ currentTime: time }),
    }),
    {
      name: 'freevibes-player',
      partialize: (state) => ({
        queue: state.queue,
        currentIndex: state.currentIndex,
        volume: state.volume,
        queueContext: state.queueContext,
      }),
    },
  ),
);
