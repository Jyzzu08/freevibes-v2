export type SearchEntityType = 'artist' | 'album' | 'track' | 'genre' | 'playlist';

export interface GenreSummary {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  coverUrl: string | null;
  artistCount?: number;
}

export interface ArtistSummary {
  id: string;
  name: string;
  slug: string;
  bio: string | null;
  country: string | null;
  formedYear: number | null;
  genreName: string;
  imageUrl: string | null;
}

export interface AlbumSummary {
  id: string;
  title: string;
  slug: string;
  releaseDate: string | null;
  genreName: string;
  artistName: string;
  coverUrl: string | null;
}

export interface TrackSummary {
  id: string;
  title: string;
  slug: string;
  durationSec: number;
  trackNumber: number;
  genreName: string;
  artistName: string;
  albumTitle: string;
  coverUrl: string | null;
  audioUrl: string | null;
}

export interface PlaylistSummary {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  isPublic: boolean;
  coverUrl: string | null;
  ownerName: string;
  trackCount: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface CombinedSearchResponse {
  query: string;
  page: number;
  limit: number;
  artists: PaginatedResponse<ArtistSummary>;
  albums: PaginatedResponse<AlbumSummary>;
  tracks: PaginatedResponse<TrackSummary>;
  genres: PaginatedResponse<GenreSummary>;
  playlists: PaginatedResponse<PlaylistSummary>;
}

export type PlaybackSourceType =
  | 'HOME'
  | 'BROWSE'
  | 'SEARCH'
  | 'ALBUM'
  | 'PLAYLIST'
  | 'ARTIST'
  | 'LIBRARY'
  | 'UNKNOWN';

export interface PlayerTrack {
  id: string;
  title: string;
  artistName: string;
  albumTitle: string;
  coverUrl: string | null;
  audioUrl: string | null;
  durationSec: number;
  sourceType?: PlaybackSourceType;
  sourceId?: string | null;
  sourceLabel?: string | null;
}
