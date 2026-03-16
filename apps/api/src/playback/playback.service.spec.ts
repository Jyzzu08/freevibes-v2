import { NotFoundException } from '@nestjs/common';
import { SourceType } from '@prisma/client';
import { PlaybackService } from './playback.service';

describe('PlaybackService', () => {
  it('records playback history and recently played data', async () => {
    const create = jest.fn().mockResolvedValue({ id: 'history-1' });
    const upsert = jest.fn().mockResolvedValue({ id: 'recent-1' });
    const transaction = jest.fn(
      (
        callback: (tx: {
          playbackHistory: { create: typeof create };
          recentlyPlayed: { upsert: typeof upsert };
        }) => Promise<{ history: { id: string }; recent: { id: string } }>,
      ) =>
        callback({
          playbackHistory: { create },
          recentlyPlayed: { upsert },
        }),
    );
    const service = new PlaybackService({
      track: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ id: 'track-1', durationSec: 180 }),
      },
      $transaction: transaction,
    } as never);

    await expect(
      service.record('user-1', {
        trackId: 'track-1',
        sourceType: SourceType.ALBUM,
        sourceId: 'album-1',
        progressSeconds: 220,
        completed: true,
      }),
    ).resolves.toEqual({
      success: true,
      historyId: 'history-1',
      recentlyPlayedId: 'recent-1',
    });

    expect(create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        trackId: 'track-1',
        sourceType: SourceType.ALBUM,
        sourceId: 'album-1',
        completed: true,
        progressSeconds: 180,
      },
    });
    expect(upsert).toHaveBeenCalled();
  });

  it('throws when the requested track does not exist', async () => {
    const service = new PlaybackService({
      track: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
    } as never);

    await expect(
      service.record('user-1', {
        trackId: 'missing-track',
        sourceType: SourceType.UNKNOWN,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
