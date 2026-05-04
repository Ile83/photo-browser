import { useEffect, useState } from "react";
import { fetchPhotoDetail } from "../api/photos";
import type { Album, Photo, User } from "../types";

interface DetailState {
  requestKey: string;
  photo: Photo | null;
  album: Album | null;
  user: User | null;
  albumPhotos: Photo[];
  loading: boolean;
  error: string;
}

function createDetailState(requestKey: string): DetailState {
  return {
    requestKey,
    photo: null,
    album: null,
    user: null,
    albumPhotos: [],
    loading: true,
    error: "",
  };
}

export function usePhotoDetail(photoId?: string) {
  const requestKey = String(photoId ?? "");
  const [state, setState] = useState<DetailState>(() => createDetailState(requestKey));
  const viewState = !photoId
    ? {
        ...createDetailState(requestKey),
        loading: false,
        error: "Photo id is missing",
      }
    : state.requestKey === requestKey
      ? state
      : createDetailState(requestKey);

  useEffect(() => {
    if (!photoId) {
      return;
    }

    let cancelled = false;

    fetchPhotoDetail(photoId)
      .then((result) => {
        if (!cancelled) {
          setState({
            requestKey,
            ...result,
            loading: false,
            error: "",
          });
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setState({
            ...createDetailState(requestKey),
            loading: false,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [photoId, requestKey]);

  return viewState;
}
