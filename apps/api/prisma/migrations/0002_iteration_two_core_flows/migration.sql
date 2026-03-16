-- Playlist slugs become globally unique to support direct detail routes and sharing.
DROP INDEX IF EXISTS "Playlist_userId_slug_key";
CREATE UNIQUE INDEX IF NOT EXISTS "Playlist_slug_key" ON "Playlist"("slug");

-- Additional consistency and query-performance indexes for iteration two flows.
CREATE UNIQUE INDEX IF NOT EXISTS "Album_artistId_title_key" ON "Album"("artistId", "title");
CREATE INDEX IF NOT EXISTS "Track_albumId_idx" ON "Track"("albumId");
CREATE INDEX IF NOT EXISTS "Playlist_userId_updatedAt_idx" ON "Playlist"("userId", "updatedAt");
CREATE INDEX IF NOT EXISTS "Playlist_isPublic_updatedAt_idx" ON "Playlist"("isPublic", "updatedAt");
CREATE INDEX IF NOT EXISTS "FavoriteTrack_userId_createdAt_idx" ON "FavoriteTrack"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "SavedAlbum_userId_createdAt_idx" ON "SavedAlbum"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "FollowedArtist_userId_createdAt_idx" ON "FollowedArtist"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "PlaybackHistory_userId_trackId_playedAt_idx" ON "PlaybackHistory"("userId", "trackId", "playedAt");
CREATE INDEX IF NOT EXISTS "UploadedAsset_kind_createdAt_idx" ON "UploadedAsset"("kind", "createdAt");
