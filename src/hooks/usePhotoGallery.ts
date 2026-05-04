import { useEffect, useState } from "react";
import { fetchGalleryPage, getTotalPageCount } from "../api/photos";
import { PHOTO_DATASET_SIZE } from "../api/jsonPlaceholder";
import type { Photo } from "../types";

interface GalleryState {
  requestKey: string;
  photos: Photo[];
  totalCount: number;
  safePage: number;
  loading: boolean;
  error: string;
}

function createGalleryState(filter: string, page: number, requestKey: string): GalleryState {
  return {
    requestKey,
    photos: [],
    totalCount: filter.trim() ? 0 : PHOTO_DATASET_SIZE,
    safePage: page,
    loading: true,
    error: "",
  };
}

export function usePhotoGallery(page: number, filter: string) {
  const requestKey = `${page}:${filter.trim().toLowerCase()}`;
  const [state, setState] = useState<GalleryState>(() =>
    createGalleryState(filter, page, requestKey),
  );
  const viewState =
    state.requestKey === requestKey ? state : createGalleryState(filter, page, requestKey);

  useEffect(() => {
    let cancelled = false;

    fetchGalleryPage({ page, filter })
      .then((result) => {
        if (!cancelled) {
          setState({
            requestKey,
            photos: result.photos,
            totalCount: result.totalCount,
            safePage: result.page,
            loading: false,
            error: "",
          });
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setState({
            ...createGalleryState(filter, page, requestKey),
            loading: false,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [page, filter, requestKey]);

  const totalPages = getTotalPageCount(viewState.totalCount);

  return {
    photos: viewState.photos,
    totalCount: viewState.totalCount,
    totalPages,
    safePage: Math.min(viewState.safePage, totalPages),
    loading: viewState.loading,
    error: viewState.error,
    datasetCount: PHOTO_DATASET_SIZE,
  };
}
