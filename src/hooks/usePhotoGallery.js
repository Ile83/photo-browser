import { useEffect, useState } from "react";
import { fetchGalleryPage, getTotalPageCount } from "../api/photos";
import { PHOTO_DATASET_SIZE } from "../api/jsonPlaceholder";

function createGalleryState(filter, page, requestKey) {
  return {
    requestKey,
    photos: [],
    totalCount: filter.trim() ? 0 : PHOTO_DATASET_SIZE,
    safePage: page,
    loading: true,
    error: "",
  };
}

export function usePhotoGallery(page, filter) {
  const requestKey = `${page}:${filter.trim().toLowerCase()}`;
  const [state, setState] = useState(() => createGalleryState(filter, page, requestKey));
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
