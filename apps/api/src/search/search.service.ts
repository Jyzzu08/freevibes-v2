import { Injectable } from '@nestjs/common';
import { CatalogService } from '@/catalog/catalog.service';
import type { SearchQueryDto } from './dto/search-query.dto';

@Injectable()
export class SearchService {
  constructor(private readonly catalogService: CatalogService) {}

  async search(query: SearchQueryDto) {
    const queryText = query.q?.trim() ?? '';

    const [artists, albums, tracks, genres, playlists] = await Promise.all([
      this.catalogService.listArtists({ ...query, q: queryText }),
      this.catalogService.listAlbums({ ...query, q: queryText }),
      this.catalogService.listTracks({ ...query, q: queryText }),
      this.catalogService.listGenres({ ...query, q: queryText }),
      this.catalogService.listPublicPlaylists({ ...query, q: queryText }),
    ]);

    return {
      query: queryText,
      page: query.page,
      limit: query.limit,
      artists,
      albums,
      tracks,
      genres,
      playlists,
    };
  }
}
