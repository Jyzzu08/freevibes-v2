import type {
  AlbumSummary,
  ArtistSummary,
  CombinedSearchResponse,
  GenreSummary,
  PaginatedResponse,
  PlaybackSourceType,
  PlaylistSummary,
  TrackSummary,
} from '@freevibes/types';
import type { LibraryOverview } from '@/store/library-store';
import { useSessionStore, type SessionUser } from '@/store/session-store';

export interface ApiAsset {
  id: string;
  kind: 'IMAGE' | 'AUDIO' | 'AVATAR';
  originalName: string;
  publicUrl: string;
  sizeBytes: number;
  mimeType: string;
  createdAt: string;
}

export interface ArtistDetail {
  id: string;
  name: string;
  slug: string;
  bio: string | null;
  country: string | null;
  heroAsset: { publicUrl: string | null } | null;
  genre: { name: string };
  albums: Array<{
    id: string;
    slug: string;
    title: string;
    _count: { tracks: number };
  }>;
}

export interface AlbumDetail {
  id: string;
  title: string;
  description: string | null;
  artist: { id: string; name: string };
  genre: { id: string; name: string };
  coverAsset: { publicUrl: string | null } | null;
  tracks: Array<{
    id: string;
    title: string;
    trackNumber: number;
    durationSec: number;
    genre: { id: string; name: string };
    artist: { id: string; name: string };
    album: { title: string; coverAsset: { publicUrl: string | null } | null };
    audioAsset: { publicUrl: string | null } | null;
  }>;
}

export interface PlaylistDetail {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  isPublic: boolean;
  canEdit: boolean;
  coverAssetId: string | null;
  coverAsset: { id: string; publicUrl: string | null } | null;
  owner: {
    id: string;
    username: string;
    displayName: string;
  };
  tracks: Array<{
    id: string;
    position: number;
    track: {
      id: string;
      title: string;
      durationSec: number;
      trackNumber: number;
      artist: { id: string; name: string };
      album: {
        id: string;
        title: string;
        coverAsset: { publicUrl: string | null } | null;
      };
      genre: { id: string; name: string };
      audioAsset: { publicUrl: string | null } | null;
    };
  }>;
}

export interface AuthSessionResponse {
  accessToken: string;
  user: SessionUser;
}

export interface AdminGenre {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  coverAssetId: string | null;
  coverUrl: string | null;
  artistCount: number;
  albumCount: number;
  trackCount: number;
  updatedAt: string;
}

export interface AdminArtist {
  id: string;
  name: string;
  slug: string;
  bio: string | null;
  country: string | null;
  formedYear: number | null;
  genreId: string;
  genreName: string;
  heroAssetId: string | null;
  heroUrl: string | null;
  albumCount: number;
  trackCount: number;
  followerCount: number;
  updatedAt: string;
}

export interface AdminAlbum {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  artistId: string;
  artistName: string;
  genreId: string;
  genreName: string;
  releaseDate: string | null;
  coverAssetId: string | null;
  coverUrl: string | null;
  trackCount: number;
  savedCount: number;
  updatedAt: string;
}

export interface AdminTrack {
  id: string;
  title: string;
  slug: string;
  trackNumber: number;
  durationSec: number;
  artistId: string;
  artistName: string;
  albumId: string;
  albumTitle: string;
  genreId: string;
  genreName: string;
  audioAssetId: string | null;
  audioUrl: string | null;
  isPublished: boolean;
  updatedAt: string;
}

export interface AdminBootstrap {
  stats: {
    genres: number;
    artists: number;
    albums: number;
    tracks: number;
  };
  genres: AdminGenre[];
  artists: AdminArtist[];
  albums: AdminAlbum[];
  tracks: AdminTrack[];
  imageAssets: ApiAsset[];
  audioAssets: ApiAsset[];
}

type AuthMode = 'none' | 'optional' | 'required';

interface RequestOptions {
  auth?: AuthMode;
  retryOnUnauthorized?: boolean;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001';

let refreshPromise: Promise<string | null> | null = null;

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function createApiError(response: Response) {
  let details: unknown = null;

  try {
    details = await response.json();
  } catch {
    try {
      details = await response.text();
    } catch {
      details = null;
    }
  }

  const message =
    typeof details === 'object' &&
    details !== null &&
    'message' in details &&
    typeof details.message === 'string'
      ? details.message
      : `API request failed with ${response.status}`;

  return new ApiError(message, response.status, details);
}

async function parseResponse<T>(response: Response) {
  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  return text ? (JSON.parse(text) as T) : ({} as T);
}

async function refreshAccessToken() {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const session = await requestRaw<AuthSessionResponse>('/auth/refresh', {
        method: 'POST',
      });
      useSessionStore.getState().setSession(session);
      return session.accessToken;
    } catch {
      useSessionStore.getState().clearSession();
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

async function requestRaw<T>(path: string, init?: RequestInit, accessToken?: string | null) {
  const headers = new Headers(init?.headers ?? {});

  if (!(init?.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    cache: 'no-store',
    credentials: 'include',
    headers,
  });

  if (!response.ok) {
    throw await createApiError(response);
  }

  return parseResponse<T>(response);
}

async function request<T>(
  path: string,
  init?: RequestInit,
  options: RequestOptions = {},
): Promise<T> {
  const authMode = options.auth ?? 'none';
  let accessToken = useSessionStore.getState().accessToken;

  if (authMode === 'required' && !accessToken) {
    accessToken = await refreshAccessToken();
  }

  if (authMode === 'required' && !accessToken) {
    throw new ApiError('Authentication required', 401);
  }

  try {
    return await requestRaw<T>(path, init, authMode === 'none' ? null : accessToken);
  } catch (error) {
    if (
      error instanceof ApiError &&
      error.status === 401 &&
      authMode !== 'none' &&
      options.retryOnUnauthorized !== false
    ) {
      const refreshedAccessToken = await refreshAccessToken();

      if (!refreshedAccessToken) {
        throw error;
      }

      return request<T>(path, init, {
        ...options,
        retryOnUnauthorized: false,
      });
    }

    throw error;
  }
}

export function listGenres() {
  return request<PaginatedResponse<GenreSummary>>('/genres?limit=12');
}

export function listArtists() {
  return request<PaginatedResponse<ArtistSummary>>('/artists?limit=12');
}

export function listAlbums() {
  return request<PaginatedResponse<AlbumSummary>>('/albums?limit=12');
}

export function listTracks(params?: {
  artistSlug?: string;
  albumSlug?: string;
  genre?: string;
  q?: string;
  limit?: number;
}) {
  const searchParams = new URLSearchParams();

  if (params?.artistSlug) searchParams.set('artistSlug', params.artistSlug);
  if (params?.albumSlug) searchParams.set('albumSlug', params.albumSlug);
  if (params?.genre) searchParams.set('genre', params.genre);
  if (params?.q) searchParams.set('q', params.q);
  searchParams.set('limit', String(params?.limit ?? 18));

  return request<PaginatedResponse<TrackSummary>>(`/tracks?${searchParams.toString()}`);
}

export function listPublicPlaylists() {
  return request<PaginatedResponse<PlaylistSummary>>('/playlists/public?limit=8');
}

export function searchCatalog(query: string) {
  return request<CombinedSearchResponse>(`/search?q=${encodeURIComponent(query)}&limit=8`);
}

export function getArtist(slug: string) {
  return request<ArtistDetail>(`/artists/${slug}`);
}

export function getAlbum(slug: string) {
  return request<AlbumDetail>(`/albums/${slug}`);
}

export async function getPlaylist(slug: string) {
  const hasSession = Boolean(
    useSessionStore.getState().user || useSessionStore.getState().accessToken,
  );

  if (!hasSession) {
    return request<PlaylistDetail>(`/playlists/${slug}`, undefined, {
      auth: 'optional',
    });
  }

  try {
    return await request<PlaylistDetail>(`/playlists/${slug}`, undefined, {
      auth: 'required',
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return request<PlaylistDetail>(`/playlists/${slug}`, undefined, {
        auth: 'optional',
      });
    }

    throw error;
  }
}

export async function login(emailOrUsername: string, password: string) {
  return request<AuthSessionResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ emailOrUsername, password }),
  });
}

export async function register(payload: {
  email: string;
  username: string;
  password: string;
  displayName?: string;
}) {
  return request<AuthSessionResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function logout() {
  await request<{ success: true }>('/auth/logout', { method: 'POST' }, { auth: 'optional' });
  useSessionStore.getState().clearSession();
}

export async function getCurrentUser() {
  return request<SessionUser>('/auth/me', undefined, { auth: 'required' });
}

export async function updateProfile(payload: {
  displayName?: string;
  bio?: string;
  country?: string;
}) {
  return request<SessionUser>(
    '/users/me',
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
    { auth: 'required' },
  );
}

export function getLibraryOverview() {
  return request<LibraryOverview>('/library/overview', undefined, {
    auth: 'required',
  });
}

export function favoriteTrack(trackId: string) {
  return request<LibraryOverview>(
    `/library/tracks/${trackId}/favorite`,
    {
      method: 'POST',
    },
    { auth: 'required' },
  );
}

export function unfavoriteTrack(trackId: string) {
  return request<LibraryOverview>(
    `/library/tracks/${trackId}/favorite`,
    {
      method: 'DELETE',
    },
    { auth: 'required' },
  );
}

export function saveAlbum(albumId: string) {
  return request<LibraryOverview>(
    `/library/albums/${albumId}/save`,
    {
      method: 'POST',
    },
    { auth: 'required' },
  );
}

export function unsaveAlbum(albumId: string) {
  return request<LibraryOverview>(
    `/library/albums/${albumId}/save`,
    {
      method: 'DELETE',
    },
    { auth: 'required' },
  );
}

export function followArtist(artistId: string) {
  return request<LibraryOverview>(
    `/library/artists/${artistId}/follow`,
    {
      method: 'POST',
    },
    { auth: 'required' },
  );
}

export function unfollowArtist(artistId: string) {
  return request<LibraryOverview>(
    `/library/artists/${artistId}/follow`,
    {
      method: 'DELETE',
    },
    { auth: 'required' },
  );
}

export function listMyPlaylists() {
  return request<LibraryOverview['playlists']>('/playlists/mine', undefined, {
    auth: 'required',
  });
}

export function createPlaylist(payload: {
  title: string;
  description?: string;
  isPublic?: boolean;
  coverAssetId?: string;
}) {
  return request<PlaylistDetail>(
    '/playlists',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    { auth: 'required' },
  );
}

export function updatePlaylist(
  playlistId: string,
  payload: {
    title?: string;
    description?: string;
    isPublic?: boolean;
    coverAssetId?: string | null;
  },
) {
  return request<PlaylistDetail>(
    `/playlists/${playlistId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
    { auth: 'required' },
  );
}

export function deletePlaylist(playlistId: string) {
  return request<{ success: true }>(
    `/playlists/${playlistId}`,
    { method: 'DELETE' },
    { auth: 'required' },
  );
}

export function addTrackToPlaylist(playlistId: string, trackId: string) {
  return request<PlaylistDetail>(
    `/playlists/${playlistId}/tracks`,
    {
      method: 'POST',
      body: JSON.stringify({ trackId }),
    },
    { auth: 'required' },
  );
}

export function removeTrackFromPlaylist(playlistId: string, trackId: string) {
  return request<PlaylistDetail>(
    `/playlists/${playlistId}/tracks/${trackId}`,
    { method: 'DELETE' },
    { auth: 'required' },
  );
}

export function reorderPlaylistTracks(playlistId: string, trackIds: string[]) {
  return request<PlaylistDetail>(
    `/playlists/${playlistId}/tracks/reorder`,
    {
      method: 'PATCH',
      body: JSON.stringify({ trackIds }),
    },
    { auth: 'required' },
  );
}

export function uploadImage(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  return request<ApiAsset>(
    '/uploads/images',
    {
      method: 'POST',
      body: formData,
    },
    { auth: 'required' },
  );
}

export function uploadAudio(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  return request<ApiAsset>(
    '/uploads/audio',
    {
      method: 'POST',
      body: formData,
    },
    { auth: 'required' },
  );
}

export function recordPlayback(payload: {
  trackId: string;
  sourceType?: PlaybackSourceType;
  sourceId?: string | null;
  completed?: boolean;
  progressSeconds?: number;
}) {
  return request<{ success: true }>(
    '/playback/history',
    {
      method: 'POST',
      body: JSON.stringify({
        sourceType: payload.sourceType ?? 'UNKNOWN',
        sourceId: payload.sourceId ?? null,
        ...payload,
      }),
    },
    { auth: 'required' },
  );
}

export function getAdminBootstrap() {
  return request<AdminBootstrap>('/admin/bootstrap', undefined, {
    auth: 'required',
  });
}

export function createAdminGenre(payload: {
  name: string;
  description?: string;
  coverAssetId?: string;
}) {
  return request<AdminGenre>(
    '/admin/genres',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    { auth: 'required' },
  );
}

export function updateAdminGenre(
  genreId: string,
  payload: {
    name?: string;
    description?: string;
    coverAssetId?: string | null;
  },
) {
  return request<AdminGenre>(
    `/admin/genres/${genreId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
    { auth: 'required' },
  );
}

export function deleteAdminGenre(genreId: string) {
  return request<{ success: true }>(
    `/admin/genres/${genreId}`,
    { method: 'DELETE' },
    { auth: 'required' },
  );
}

export function createAdminArtist(payload: {
  name: string;
  genreId: string;
  bio?: string;
  country?: string;
  formedYear?: number;
  heroAssetId?: string;
}) {
  return request<AdminArtist>(
    '/admin/artists',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    { auth: 'required' },
  );
}

export function updateAdminArtist(
  artistId: string,
  payload: {
    name?: string;
    genreId?: string;
    bio?: string;
    country?: string;
    formedYear?: number;
    heroAssetId?: string | null;
  },
) {
  return request<AdminArtist>(
    `/admin/artists/${artistId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
    { auth: 'required' },
  );
}

export function deleteAdminArtist(artistId: string) {
  return request<{ success: true }>(
    `/admin/artists/${artistId}`,
    { method: 'DELETE' },
    { auth: 'required' },
  );
}

export function createAdminAlbum(payload: {
  title: string;
  artistId: string;
  genreId: string;
  description?: string;
  releaseDate?: string;
  coverAssetId?: string;
}) {
  return request<AdminAlbum>(
    '/admin/albums',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    { auth: 'required' },
  );
}

export function updateAdminAlbum(
  albumId: string,
  payload: {
    title?: string;
    artistId?: string;
    genreId?: string;
    description?: string;
    releaseDate?: string | null;
    coverAssetId?: string | null;
  },
) {
  return request<AdminAlbum>(
    `/admin/albums/${albumId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
    { auth: 'required' },
  );
}

export function deleteAdminAlbum(albumId: string) {
  return request<{ success: true }>(
    `/admin/albums/${albumId}`,
    { method: 'DELETE' },
    { auth: 'required' },
  );
}

export function createAdminTrack(payload: {
  title: string;
  trackNumber: number;
  durationSec: number;
  artistId: string;
  albumId: string;
  genreId: string;
  audioAssetId?: string;
  isPublished?: boolean;
}) {
  return request<AdminTrack>(
    '/admin/tracks',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    { auth: 'required' },
  );
}

export function updateAdminTrack(
  trackId: string,
  payload: {
    title?: string;
    trackNumber?: number;
    durationSec?: number;
    artistId?: string;
    albumId?: string;
    genreId?: string;
    audioAssetId?: string | null;
    isPublished?: boolean;
  },
) {
  return request<AdminTrack>(
    `/admin/tracks/${trackId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
    { auth: 'required' },
  );
}

export function deleteAdminTrack(trackId: string) {
  return request<{ success: true }>(
    `/admin/tracks/${trackId}`,
    { method: 'DELETE' },
    { auth: 'required' },
  );
}
