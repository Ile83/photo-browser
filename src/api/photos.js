import { fetchJson, PAGE_SIZE, PHOTO_DATASET_SIZE } from "./jsonPlaceholder";

const pageCache = new Map();
const filteredPhotosCache = new Map();
const photoCache = new Map();
const albumCache = new Map();
const userCache = new Map();
const albumPhotosCache = new Map();

let allPhotosPromise = null;

function loadCached(cache, key, load) {
  if (cache.has(key)) {
    return cache.get(key);
  }

  const promise = load().catch((error) => {
    cache.delete(key);
    throw error;
  });

  cache.set(key, promise);
  return promise;
}

function clampPage(page, totalPages) {
  return Math.min(Math.max(page, 1), totalPages);
}

export function picsumThumbnail(id) {
  return `https://picsum.photos/id/${(id % 1000) + 1}/300/300`;
}

export function picsumLarge(id) {
  return `https://picsum.photos/id/${(id % 1000) + 1}/1200/800`;
}

export function normalizePhoto(photo) {
  return {
    ...photo,
    thumbnailUrl: picsumThumbnail(photo.id),
    url: picsumLarge(photo.id),
  };
}

function normalizePhotos(photos) {
  return photos.map(normalizePhoto);
}

export function getTotalPageCount(totalCount) {
  return Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
}

export async function fetchAllPhotos() {
  if (!allPhotosPromise) {
    allPhotosPromise = fetchJson("/photos")
      .then(normalizePhotos)
      .catch((error) => {
        allPhotosPromise = null;
        throw error;
      });
  }

  return allPhotosPromise;
}

async function fetchFilteredPhotos(filter) {
  if (!filter) {
    return [];
  }

  return loadCached(filteredPhotosCache, filter, async () => {
    const allPhotos = await fetchAllPhotos();
    return allPhotos.filter((photo) => photo.title.toLowerCase().includes(filter));
  });
}

export async function fetchGalleryPage({ page, filter = "" }) {
  const normalizedFilter = filter.trim().toLowerCase();

  if (!normalizedFilter) {
    const totalPages = getTotalPageCount(PHOTO_DATASET_SIZE);
    const safePage = clampPage(page, totalPages);
    const start = (safePage - 1) * PAGE_SIZE;

    const photos = await loadCached(pageCache, safePage, async () => {
      const data = await fetchJson(`/photos?_start=${start}&_limit=${PAGE_SIZE}`);
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

export async function fetchPhotoById(photoId) {
  return loadCached(photoCache, String(photoId), async () => {
    const photo = await fetchJson(`/photos/${photoId}`);
    return normalizePhoto(photo);
  });
}

export async function fetchAlbumById(albumId) {
  return loadCached(albumCache, String(albumId), () => fetchJson(`/albums/${albumId}`));
}

export async function fetchUserById(userId) {
  return loadCached(userCache, String(userId), () => fetchJson(`/users/${userId}`));
}

export async function fetchAlbumPhotos(albumId, limit = 8) {
  const cacheKey = `${albumId}:${limit}`;

  return loadCached(albumPhotosCache, cacheKey, async () => {
    const photos = await fetchJson(`/photos?albumId=${albumId}&_limit=${limit}`);
    return normalizePhotos(photos);
  });
}

export async function fetchPhotoDetail(photoId) {
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
