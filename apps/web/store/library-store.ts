'use client';

import { create } from 'zustand';
import type {
  AlbumSummary,
  ArtistSummary,
  PlaybackSourceType,
  PlaylistSummary,
  TrackSummary,
} from '@freevibes/types';

export interface RecentlyPlayedItem extends TrackSummary {
  lastPlayedAt: string;
  playCount: number;
}

export interface PlaybackHistoryItem {
  id: string;
  playedAt: string;
  completed: boolean;
  progressSeconds: number | null;
  sourceType: PlaybackSourceType;
  sourceId: string | null;
  track: {
    id: string;
    title: string;
    artistName: string;
    albumTitle: string;
    coverUrl: string | null;
    audioUrl: string | null;
    durationSec: number;
  };
}

export interface LibraryPlaylistSummary extends PlaylistSummary {
  updatedAt: string;
}

export interface LibraryOverview {
  favoriteTrackIds: string[];
  savedAlbumIds: string[];
  followedArtistIds: string[];
  favoriteTracks: TrackSummary[];
  savedAlbums: AlbumSummary[];
  followedArtists: ArtistSummary[];
  recentlyPlayed: RecentlyPlayedItem[];
  playbackHistory: PlaybackHistoryItem[];
  playlists: LibraryPlaylistSummary[];
}

interface LibraryStore {
  overview: LibraryOverview | null;
  isLoading: boolean;
  setOverview: (overview: LibraryOverview | null) => void;
  setLoading: (isLoading: boolean) => void;
  clearOverview: () => void;
}

export const useLibraryStore = create<LibraryStore>()((set) => ({
  overview: null,
  isLoading: false,
  setOverview: (overview) => set({ overview }),
  setLoading: (isLoading) => set({ isLoading }),
  clearOverview: () => set({ overview: null, isLoading: false }),
}));
