import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  HashRouter,
  Link,
  Route,
  Routes,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  ArrowLeft,
  Search,
  Image as ImageIcon,
  User,
  Album,
  ExternalLink,
  RefreshCcw,
} from "lucide-react";

// Base API URL for JSONPlaceholder.
// We fetch photos, albums, and users from this API.
const API_BASE = "https://jsonplaceholder.typicode.com";

// Number of photos shown per page in the gallery.
const PAGE_SIZE = 24;

// Small helper for fetch requests that return JSON.
// Throws an error if the request was not successful.
async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json();
}

// JSONPlaceholder photo URLs are not ideal for real display images,
// so we generate thumbnail images from Picsum using the photo id.
function picsumThumbnail(id) {
  return `https://picsum.photos/id/${(id % 1000) + 1}/300/300`;
}

// Larger image version used on the detail page.
function picsumLarge(id) {
  return `https://picsum.photos/id/${(id % 1000) + 1}/1200/800`;
}

// Shared layout wrapper used by both the home page and detail page.
// This keeps the header and overall page styling consistent.
function AppShell({ children }) {
  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", color: "#0f172a" }}>
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          borderBottom: "1px solid #e2e8f0",
          background: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(8px)",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "16px 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
          }}
        >
          {/* App logo + title. Clicking this returns to the home page. */}
          <Link
            to="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <div
              style={{
                background: "#0f172a",
                color: "white",
                padding: 10,
                borderRadius: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ImageIcon size={20} />
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>Photo Browser</div>
              <div style={{ fontSize: 14, color: "#64748b" }}>
                React SPA with JSONPlaceholder
              </div>
            </div>
          </Link>

          {/* External link to the API source used by the app. */}
          <a
            href="https://jsonplaceholder.typicode.com/photos"
            target="_blank"
            rel="noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: "#475569",
              textDecoration: "none",
              fontSize: 14,
            }}
          >
            API Docs <ExternalLink size={16} />
          </a>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: 20 }}>{children}</main>
    </div>
  );
}

// Reusable card component for consistent box styling.
function Card({ children, style = {} }) {
  return (
    <div
      style={{
        background: "white",
        border: "1px solid #e2e8f0",
        borderRadius: 24,
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// Reusable button component.
// Used throughout the app for actions like Search, Retry, paging, etc.
function Button({ children, onClick, disabled, style = {}, type = "button" }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "10px 14px",
        borderRadius: 12,
        border: "1px solid #cbd5e1",
        background: disabled ? "#e2e8f0" : "black",
        color: disabled ? "#64748b" : "white",
        cursor: disabled ? "not-allowed" : "pointer",
        fontWeight: 600,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

// Small badge UI used for IDs, page numbers, counts, etc.
function Badge({ children }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "4px 10px",
        borderRadius: 999,
        border: "1px solid #cbd5e1",
        fontSize: 12,
        background: "#f8fafc",
      }}
    >
      {children}
    </span>
  );
}

// Reusable error state with optional retry button.
function ErrorState({ title = "Something went wrong", message, onRetry }) {
  return (
    <Card style={{ background: "#fef2f2", borderColor: "#fecaca" }}>
      <div style={{ padding: 24 }}>
        <h2 style={{ margin: 0, color: "#7f1d1d" }}>{title}</h2>
        <p style={{ color: "#991b1b" }}>{message}</p>
        {onRetry && (
          <Button
            onClick={onRetry}
            style={{ display: "inline-flex", gap: 8, alignItems: "center" }}
          >
            <RefreshCcw size={16} />
            Retry
          </Button>
        )}
      </div>
    </Card>
  );
}

// Simple skeleton loading grid shown while the gallery is loading.
function LoadingGrid() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
        gap: 16,
      }}
    >
      {Array.from({ length: 12 }).map((_, index) => (
        <div
          key={index}
          style={{
            borderRadius: 24,
            background: "white",
            border: "1px solid #e2e8f0",
            overflow: "hidden",
          }}
        >
          <div style={{ aspectRatio: "1 / 1", background: "#e2e8f0" }} />
          <div style={{ padding: 12 }}>
            <div
              style={{
                height: 16,
                background: "#e2e8f0",
                borderRadius: 8,
                marginBottom: 8,
              }}
            />
            <div
              style={{
                height: 12,
                width: "70%",
                background: "#e2e8f0",
                borderRadius: 8,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// Single photo card used in the gallery grid.
// Entire card is clickable and navigates to the detail page.
function PhotoGridCard({ photo }) {
  return (
    <Link to={`/photos/${photo.id}`} style={{ textDecoration: "none", color: "inherit" }}>
      <Card style={{ overflow: "hidden", height: "100%" }}>
        <div style={{ aspectRatio: "1 / 1", overflow: "hidden", background: "#f1f5f9" }}>
          <img
            src={picsumThumbnail(photo.id)}
            alt={photo.title}
            loading="lazy"
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        </div>
        <div style={{ padding: 16 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 8,
              flexWrap: "wrap",
              marginBottom: 8,
            }}
          >
            <Badge>#{photo.id}</Badge>
            <Badge>Album {photo.albumId}</Badge>
          </div>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>{photo.title}</p>
        </div>
      </Card>
    </Link>
  );
}

// Pagination component.
// Displays previous/next buttons and a small set of page numbers
// around the current page.
function Pagination({ page, totalPages, onPageChange }) {
  const pageNumbers = useMemo(() => {
    const pages = new Set([1, totalPages, page - 1, page, page + 1, page - 2, page + 2]);
    return [...pages].filter((n) => n >= 1 && n <= totalPages).sort((a, b) => a - b);
  }, [page, totalPages]);

  if (totalPages <= 1) return null;

  return (
    <div
      style={{
        marginTop: 32,
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: 8,
      }}
    >
      <Button disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        Previous
      </Button>

      {pageNumbers.map((pageNumber, index) => {
        const previous = pageNumbers[index - 1];
        const showEllipsis = previous && pageNumber - previous > 1;

        return (
          <React.Fragment key={pageNumber}>
            {showEllipsis ? <span style={{ padding: "10px 4px" }}>…</span> : null}
            <Button
              onClick={() => onPageChange(pageNumber)}
              style={{
                background: pageNumber === page ? "#0f172a" : "white",
                color: pageNumber === page ? "white" : "inherit",
                borderColor: pageNumber === page ? "#0f172a" : "#cbd5e1",
                minWidth: 42,
              }}
            >
              {pageNumber}
            </Button>
          </React.Fragment>
        );
      })}

      <Button disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
        Next
      </Button>
    </div>
  );
}

// Main gallery page.
//
// Important behavior:
// - loads the whole dataset once
// - filters the whole dataset by title
// - paginates AFTER filtering
// - keeps page/search state in the URL
function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Read current page and search filter from the URL.
  const page = Math.max(Number(searchParams.get("page") || 1), 1);
  const filter = searchParams.get("q") || "";

  // allPhotos stores the full fetched dataset.
  const [allPhotos, setAllPhotos] = useState([]);

  // Standard loading + error states.
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // searchInput is controlled by the text input.
  // It stays in sync with the URL filter.
  const [searchInput, setSearchInput] = useState(filter);

  // Keep input field synced if the URL changes.
  useEffect(() => {
    setSearchInput(filter);
  }, [filter]);

  // Fetch all photos once when the page loads.
  useEffect(() => {
    let cancelled = false;

    async function loadPhotos() {
      try {
        setLoading(true);
        setError("");

        const data = await fetchJson(`${API_BASE}/photos`);

        if (!cancelled) {
          const normalized = data.map((item) => ({
            ...item,
            thumbnailUrl: picsumThumbnail(item.id),
            url: picsumLarge(item.id),
          }));

          setAllPhotos(normalized);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unknown error");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadPhotos();

    return () => {
      cancelled = true;
    };
  }, []);

  // Filter the entire dataset by title.
  // This is case-insensitive.
  const filteredPhotos = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return allPhotos;
    return allPhotos.filter((photo) => photo.title.toLowerCase().includes(q));
  }, [allPhotos, filter]);

  // Pagination values are based on the FILTERED dataset.
  const totalCount = filteredPhotos.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // If the user is on page 5 and a search leaves only 1 page,
  // we clamp the current page to a safe valid page.
  const safePage = Math.min(page, totalPages);

  // Slice the filtered dataset into the current visible page.
  const paginatedPhotos = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    return filteredPhotos.slice(start, end);
  }, [filteredPhotos, safePage]);

  // Update URL query params.
  // Example:
  // ?page=2&q=accusamus
const updateParams = useCallback(
  (nextPage, nextFilter) => {
    const params = new URLSearchParams();
    if (nextPage > 1) params.set("page", String(nextPage));
    if (nextFilter.trim()) params.set("q", nextFilter.trim());
    setSearchParams(params);
  },
  [setSearchParams]
);

  // If current page becomes invalid after filtering,
  // immediately push the corrected page into the URL.
  useEffect(() => {
    if (page !== safePage) {
      updateParams(safePage, filter);
    }
  }, [page, safePage, filter, updateParams]);

  // Search button / form submit handler.
  // Resets page back to 1 whenever a new search is performed.
  function onSearchSubmit(e) {
    e.preventDefault();
    updateParams(1, searchInput);
  }

  return (
    <AppShell>
      <section
        style={{
          marginBottom: 32,
          display: "grid",
          gap: 20,
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          alignItems: "end",
        }}
      >
        <div>
          <h1 style={{ fontSize: 40, margin: 0 }}>Browse 5,000 photos</h1>
          <p style={{ color: "#475569", lineHeight: 1.7 }}>
            A scalable single-page app built around JSONPlaceholder’s /photos endpoint,
            with shareable routes, pagination, search, and a detailed single-photo page.
          </p>
        </div>

        <Card>
          <div style={{ padding: 16 }}>
            <form onSubmit={onSearchSubmit} style={{ display: "flex", gap: 12 }}>
              <div style={{ position: "relative", flex: 1 }}>
                <Search
                  size={16}
                  style={{
                    position: "absolute",
                    left: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#94a3b8",
                  }}
                />
                <input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Filter all photos by title"
                  style={{
                    width: "100%",
                    padding: "10px 12px 10px 34px",
                    borderRadius: 12,
                    border: "1px solid #cbd5e1",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <Button type="submit">Search</Button>
            </form>
          </div>
        </Card>
      </section>

      {/* Small info row showing page + matching result counts */}
      <section
        style={{
          marginBottom: 20,
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          alignItems: "center",
          color: "#475569",
          fontSize: 14,
        }}
      >
        <Badge>Page {safePage}</Badge>
        <Badge>{paginatedPhotos.length} shown</Badge>
        <span>Matched in dataset: {filteredPhotos.length} photos</span>
        <span>Total dataset: {allPhotos.length} photos</span>
      </section>

      {loading ? <LoadingGrid /> : null}
      {!loading && error ? <ErrorState message={error} onRetry={() => navigate(0)} /> : null}

      {!loading && !error ? (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
              gap: 16,
            }}
          >
            {paginatedPhotos.map((photo) => (
              <PhotoGridCard key={photo.id} photo={photo} />
            ))}
          </div>

          {filteredPhotos.length === 0 ? (
            <Card style={{ marginTop: 24 }}>
              <div style={{ padding: 32, textAlign: "center", color: "#475569" }}>
                No photos matched this filter in the dataset.
              </div>
            </Card>
          ) : null}

          <Pagination
            page={safePage}
            totalPages={totalPages}
            onPageChange={(nextPage) => updateParams(nextPage, filter)}
          />
        </>
      ) : null}
    </AppShell>
  );
}

// Reusable metadata card for the detail page sidebar.
function MetadataCard({ title, icon, children }) {
  return (
    <Card>
      <div style={{ padding: 20 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontWeight: 700,
            marginBottom: 14,
          }}
        >
          {React.createElement(icon, { size: 16 })}
          {title}
        </div>
        <div style={{ display: "grid", gap: 8, fontSize: 14, color: "#334155" }}>{children}</div>
      </div>
    </Card>
  );
}

// Photo detail page.
//
// Fetch sequence:
// 1. load selected photo
// 2. load its album
// 3. load the album owner (user)
// 4. load a few more photos from the same album
function PhotoDetailPage() {
  const { photoId } = useParams();

  const [photo, setPhoto] = useState(null);
  const [album, setAlbum] = useState(null);
  const [user, setUser] = useState(null);
  const [albumPhotos, setAlbumPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadDetails() {
      try {
        setLoading(true);
        setError("");

        // Load the main selected photo.
        const photoData = await fetchJson(`${API_BASE}/photos/${photoId}`);
        const normalizedPhoto = {
          ...photoData,
          thumbnailUrl: picsumThumbnail(photoData.id),
          url: picsumLarge(photoData.id),
        };

        // Load album for the photo.
        const albumData = await fetchJson(`${API_BASE}/albums/${photoData.albumId}`);

        // Load user who owns the album.
        const userData = await fetchJson(`${API_BASE}/users/${albumData.userId}`);

        // Load a few more photos from the same album.
        const albumPhotoData = await fetchJson(
          `${API_BASE}/photos?albumId=${photoData.albumId}&_limit=8`
        );

        if (!cancelled) {
          setPhoto(normalizedPhoto);
          setAlbum(albumData);
          setUser(userData);
          setAlbumPhotos(
            albumPhotoData.map((item) => ({
              ...item,
              thumbnailUrl: picsumThumbnail(item.id),
              url: picsumLarge(item.id),
            }))
          );
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unknown error");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDetails();

    return () => {
      cancelled = true;
    };
  }, [photoId]);

  return (
    <AppShell>
      <div style={{ marginBottom: 24 }}>
        <Link to="/" style={{ textDecoration: "none" }}>
          <Button style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <ArrowLeft size={16} />
            Back to gallery
          </Button>
        </Link>
      </div>

      {/* Skeleton loading state */}
      {loading ? (
        <div
          style={{
            display: "grid",
            gap: 24,
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          }}
        >
          <div style={{ aspectRatio: "4 / 3", background: "#e2e8f0", borderRadius: 24 }} />
          <div style={{ display: "grid", gap: 16 }}>
            <div style={{ height: 180, background: "#e2e8f0", borderRadius: 24 }} />
            <div style={{ height: 180, background: "#e2e8f0", borderRadius: 24 }} />
          </div>
        </div>
      ) : null}

      {!loading && error ? <ErrorState title="Unable to load photo" message={error} /> : null}

      {!loading && !error && photo ? (
        <div
          style={{
            display: "grid",
            gap: 24,
            gridTemplateColumns: "minmax(0, 1.5fr) minmax(280px, 0.9fr)",
          }}
        >
          <div style={{ display: "grid", gap: 24 }}>
            {/* Main large photo */}
            <Card style={{ overflow: "hidden", borderRadius: 32 }}>
              <div style={{ aspectRatio: "4 / 3", background: "#f1f5f9" }}>
                <img
                  src={photo.url}
                  alt={photo.title}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              </div>
            </Card>

            {/* Main photo info */}
            <Card>
              <div style={{ padding: 24 }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                  <Badge>Photo #{photo.id}</Badge>
                  <Badge>Album {photo.albumId}</Badge>
                </div>

                <h1 style={{ color: "#0f172a", fontSize: 32, marginTop: 0 }}>{photo.title}</h1>
                <p style={{ color: "#475569", lineHeight: 1.7 }}>
                  This detail view is directly shareable, so opening /photos/{photo.id} loads the same item with related album and user context.
                </p>
              </div>
            </Card>

            {/* Related photos from same album */}
            <div>
              <h2 style={{ color: "#0f172a" }}>More from this album</h2>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                  gap: 16,
                }}
              >
                {albumPhotos.map((item) => (
                  <Link
                    key={item.id}
                    to={`/photos/${item.id}`}
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    <Card style={{ overflow: "hidden" }}>
                      <div style={{ aspectRatio: "1 / 1", overflow: "hidden" }}>
                        <img
                          src={item.thumbnailUrl}
                          alt={item.title}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                          }}
                        />
                      </div>
                      <div style={{ padding: 12 }}>
                        <p style={{ margin: 0, fontSize: 12 }}>{item.title}</p>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar metadata */}
          <aside style={{ display: "grid", gap: 16, alignSelf: "start" }}>
            <MetadataCard title="Photo metadata" icon={ImageIcon}>
              <div><strong>ID:</strong> {photo.id}</div>
              <div><strong>Album ID:</strong> {photo.albumId}</div>
              <div><strong>Shareable path:</strong> /photos/{photo.id}</div>
            </MetadataCard>

            {album ? (
              <MetadataCard title="Album" icon={Album}>
                <div><strong>Title:</strong> {album.title}</div>
                <div><strong>Album ID:</strong> {album.id}</div>
                <div><strong>Owner user ID:</strong> {album.userId}</div>
              </MetadataCard>
            ) : null}

            {user ? (
              <MetadataCard title="User details" icon={User}>
                <div><strong>Name:</strong> {user.name}</div>
                <div><strong>Username:</strong> {user.username}</div>
                <div><strong>Email:</strong> {user.email}</div>
                <div><strong>Phone:</strong> {user.phone}</div>
                <div><strong>Company:</strong> {user.company?.name}</div>
                <div><strong>Website:</strong> {user.website}</div>
              </MetadataCard>
            ) : null}
          </aside>
        </div>
      ) : null}
    </AppShell>
  );
}

// Root app component.
// HashRouter is used here because it works well for GitHub Pages deployments.
export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/photos/:photoId" element={<PhotoDetailPage />} />
      </Routes>
    </HashRouter>
  );
}