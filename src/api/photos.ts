import { fetchJson, PAGE_SIZE, PHOTO_DATASET_SIZE } from "./jsonPlaceholder";
import type { Album, GalleryPageResult, Photo, PhotoDetailResult, User } from "../types";

const pageCache = new Map<number, Promise<Photo[]>>();
const filteredPhotosCache = new Map<string, Promise<Photo[]>>();
const photoCache = new Map<string, Promise<Photo>>();
const albumCache = new Map<string, Promise<Album>>();
const userCache = new Map<string, Promise<User>>();
const albumPhotosCache = new Map<string, Promise<Photo[]>>();

let allPhotosPromise: Promise<Photo[]> | null = null;

function loadCached<TKey, TValue>(
  cache: Map<TKey, Promise<TValue>>,
  key: TKey,
  load: () => Promise<TValue>,
): Promise<TValue> {
  if (cache.has(key)) {
    return cache.get(key)!;
  }

  const promise = load().catch((error) => {
    cache.delete(key);
    throw error;
  });

  cache.set(key, promise);
  return promise;
}

function clampPage(page: number, totalPages: number): number {
  return Math.min(Math.max(page, 1), totalPages);
}

export function picsumThumbnail(id: number): string {
  return `https://picsum.photos/id/${(id % 1000) + 1}/300/300`;
}

export function picsumLarge(id: number): string {
  return `https://picsum.photos/id/${(id % 1000) + 1}/1200/800`;
}

export function normalizePhoto(photo: Photo): Photo {
  return {
    ...photo,
    thumbnailUrl: picsumThumbnail(photo.id),
    url: picsumLarge(photo.id),
  };
}

function normalizePhotos(photos: Photo[]): Photo[] {
  return photos.map(normalizePhoto);
}

export function getTotalPageCount(totalCount: number): number {
  return Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
}

export async function fetchAllPhotos(): Promise<Photo[]> {
  if (!allPhotosPromise) {
    allPhotosPromise = fetchJson<Photo[]>("/photos")
      .then(normalizePhotos)
      .catch((error) => {
        allPhotosPromise = null;
        throw error;
      });
  }

  return allPhotosPromise;
}

async function fetchFilteredPhotos(filter: string): Promise<Photo[]> {
  if (!filter) {
    return [];
  }

  return loadCached(filteredPhotosCache, filter, async () => {
    const allPhotos = await fetchAllPhotos();
    return allPhotos.filter((photo) => photo.title.toLowerCase().includes(filter));
  });
}

export async function fetchGalleryPage({
  page,
  filter = "",
}: {
  page: number;
  filter?: string;
}): Promise<GalleryPageResult> {
  const normalizedFilter = filter.trim().toLowerCase();

  if (!normalizedFilter) {
    const totalPages = getTotalPageCount(PHOTO_DATASET_SIZE);
    const safePage = clampPage(page, totalPages);
    const start = (safePage - 1) * PAGE_SIZE;

    const photos = await loadCached(pageCache, safePage, async () => {
      const data = await fetchJson<Photo[]>(`/photos?_start=${start}&_limit=${PAGE_SIZE}`);
      return normalizePhotos(data);
    });

    return {
      photos,
      totalCount: PHOTO_DATASET_SIZE,
      page: safePage,
    };
  }

  const filteredPhotos = await fetchFilteredPhotos(normalizedFilter);
  const totalCount = filteredPhotos.length;
  const totalPages = getTotalPageCount(totalCount);
  const safePage = clampPage(page, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;

  return {
    photos: filteredPhotos.slice(start, start + PAGE_SIZE),
    totalCount,
    page: safePage,
  };
}

export async function fetchPhotoById(photoId: number | string): Promise<Photo> {
  return loadCached(photoCache, String(photoId), async () => {
    const photo = await fetchJson<Photo>(`/photos/${photoId}`);
    return normalizePhoto(photo);
  });
}

export async function fetchAlbumById(albumId: number | string): Promise<Album> {
  return loadCached(albumCache, String(albumId), () => fetchJson<Album>(`/albums/${albumId}`));
}

export async function fetchUserById(userId: number | string): Promise<User> {
  return loadCached(userCache, String(userId), () => fetchJson<User>(`/users/${userId}`));
}

export async function fetchAlbumPhotos(albumId: number | string, limit = 8): Promise<Photo[]> {
  const cacheKey = `${albumId}:${limit}`;

  return loadCached(albumPhotosCache, cacheKey, async () => {
    const photos = await fetchJson<Photo[]>(`/photos?albumId=${albumId}&_limit=${limit}`);
    return normalizePhotos(photos);
  });
}

export async function fetchPhotoDetail(photoId: number | string): Promise<PhotoDetailResult> {
  const photo = await fetchPhotoById(photoId);
  const [album, albumPhotos] = await Promise.all([
    fetchAlbumById(photo.albumId),
    fetchAlbumPhotos(photo.albumId),
  ]);
  const user = await fetchUserById(album.userId);

  return {
    photo,
    album,
    user,
    albumPhotos,
  };
}
