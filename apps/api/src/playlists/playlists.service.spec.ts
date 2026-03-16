import { PlaylistsService } from './playlists.service';

describe('PlaylistsService', () => {
  it('reorders tracks without colliding on unique playlist positions', async () => {
    const update = jest.fn().mockResolvedValue({});
    const prisma = {
      playlist: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'playlist-1',
          userId: 'user-1',
          slug: 'qa-playlist',
        }),
      },
      playlistTrack: {
        findMany: jest.fn().mockResolvedValue([
          { id: 'row-1', trackId: 'track-1', position: 1 },
          { id: 'row-2', trackId: 'track-2', position: 2 },
        ]),
      },
      $transaction: jest.fn(
        (
          callback: (tx: {
            playlistTrack: {
              update: typeof update;
            };
          }) => Promise<void>,
        ) =>
          callback({
            playlistTrack: {
              update,
            },
          }),
      ),
    };

    const service = new PlaylistsService(prisma as never, {} as never);
    jest.spyOn(service, 'getBySlug').mockResolvedValue({
      id: 'playlist-1',
      slug: 'qa-playlist',
      tracks: [],
    } as never);

    await expect(
      service.reorderTracks('playlist-1', 'user-1', {
        trackIds: ['track-2', 'track-1'],
      }),
    ).resolves.toEqual({
      id: 'playlist-1',
      slug: 'qa-playlist',
      tracks: [],
    });

    expect(update).toHaveBeenNthCalledWith(1, {
      where: { id: 'row-1' },
      data: { position: 3 },
    });
    expect(update).toHaveBeenNthCalledWith(2, {
      where: { id: 'row-2' },
      data: { position: 4 },
    });
    expect(update).toHaveBeenNthCalledWith(3, {
      where: {
        playlistId_trackId: {
          playlistId: 'playlist-1',
          trackId: 'track-2',
        },
      },
      data: { position: 1 },
    });
    expect(update).toHaveBeenNthCalledWith(4, {
      where: {
        playlistId_trackId: {
          playlistId: 'playlist-1',
          trackId: 'track-1',
        },
      },
      data: { position: 2 },
    });
  });
});
