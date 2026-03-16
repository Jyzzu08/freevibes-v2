import type { PlaybackSourceType, PlayerTrack, TrackSummary } from '@freevibes/types';

export function formatDuration(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function toPlayerTrack(
  track: TrackSummary,
  context?: {
    sourceType?: PlaybackSourceType;
    sourceId?: string | null;
    sourceLabel?: string | null;
  },
): PlayerTrack {
  return {
    id: track.id,
    title: track.title,
    artistName: track.artistName,
    albumTitle: track.albumTitle,
    coverUrl: track.coverUrl,
    audioUrl: track.audioUrl,
    durationSec: track.durationSec,
    sourceType: context?.sourceType,
    sourceId: context?.sourceId ?? null,
    sourceLabel: context?.sourceLabel ?? null,
  };
}

export function toPlayerQueue(
  tracks: TrackSummary[],
  context?: {
    sourceType?: PlaybackSourceType;
    sourceId?: string | null;
    sourceLabel?: string | null;
  },
) {
  return tracks.map((track) => toPlayerTrack(track, context));
}
