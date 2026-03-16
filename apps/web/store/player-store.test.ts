import type { PlayerTrack } from '@freevibes/types';
import { beforeEach, describe, expect, it } from 'vitest';
import { usePlayerStore } from './player-store';

const demoQueue: PlayerTrack[] = [
  {
    id: 'track-1',
    title: 'Golden Night',
    artistName: 'FreeVibes',
    albumTitle: 'After Hours',
    coverUrl: null,
    audioUrl: '/audio/demo/demo-01.wav',
    durationSec: 30,
  },
  {
    id: 'track-2',
    title: 'Neon Echo',
    artistName: 'FreeVibes',
    albumTitle: 'After Hours',
    coverUrl: null,
    audioUrl: '/audio/demo/demo-02.wav',
    durationSec: 30,
  },
];

describe('usePlayerStore', () => {
  beforeEach(() => {
    usePlayerStore.setState({
      queue: [],
      currentIndex: 0,
      isPlaying: false,
      volume: 0.8,
      currentTime: 0,
      queueContext: null,
    });
  });

  it('sets queue context when a collection starts playing', () => {
    usePlayerStore.getState().setQueue(demoQueue, 1, {
      sourceType: 'PLAYLIST',
      sourceId: 'playlist-1',
      sourceLabel: 'Focus Pulse',
    });

    const state = usePlayerStore.getState();

    expect(state.queue).toHaveLength(2);
    expect(state.currentIndex).toBe(1);
    expect(state.isPlaying).toBe(true);
    expect(state.queueContext).toEqual({
      sourceType: 'PLAYLIST',
      sourceId: 'playlist-1',
      sourceLabel: 'Focus Pulse',
    });
  });

  it('plays the correct track index when given an existing queue', () => {
    usePlayerStore.getState().playTrack(demoQueue[1], demoQueue, {
      sourceType: 'SEARCH',
      sourceLabel: 'dream',
    });

    const state = usePlayerStore.getState();

    expect(state.currentIndex).toBe(1);
    expect(state.queue[1]?.id).toBe('track-2');
    expect(state.queueContext?.sourceType).toBe('SEARCH');
    expect(state.queueContext?.sourceLabel).toBe('dream');
  });
});
