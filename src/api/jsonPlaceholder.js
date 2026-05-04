export const API_BASE = "https://jsonplaceholder.typicode.com";
export const PAGE_SIZE = 24;
export const PHOTO_DATASET_SIZE = 5000;

export async function fetchJson(path) {
  const response = await fetch(`${API_BASE}${path}`);

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json();
}
