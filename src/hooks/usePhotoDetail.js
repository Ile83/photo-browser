import { useEffect, useState } from "react";
import { fetchPhotoDetail } from "../api/photos";

function createDetailState(requestKey) {
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

export function usePhotoDetail(photoId) {
  const requestKey = String(photoId);
  const [state, setState] = useState(() => createDetailState(requestKey));
  const viewState = state.requestKey === requestKey ? state : createDetailState(requestKey);

  useEffect(() => {
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
