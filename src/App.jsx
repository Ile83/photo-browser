import React, { useEffect, useMemo, useState } from "react";
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
  ArrowLeft, // Icons from lucide-react (https://lucide.dev/)
  Search, // I used these in the UI for a more polished look, but you can replace them with any icons or text you like!
  Image as ImageIcon, // The Image icon is used for the app logo and photo metadata card
  User, // The User icon is used for the user details card on the photo detail page
  Album, // The Album icon is used for the album details card on the photo detail page
  ExternalLink, // The ExternalLink icon is used in the header link to the API docs to indicate it's an external site
  RefreshCcw, // The RefreshCcw icon is used in the error state to indicate retrying the request
} from "lucide-react";

const API_BASE = "https://jsonplaceholder.typicode.com" // Note: the /photos endpoint doesn't include real image URLs, so we'll generate them with Picsum
const PAGE_SIZE = 24;

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`); // Basic error handling to catch non-2xx responses and throw an error with the status code
  }
  return response.json();
}

function picsumThumbnail(id) {
  return `https://picsum.photos/id/${(id % 1000) + 1}/300/300`; // Generate a thumbnail URL using Picsum, since JSONPlaceholder doesn't provide real images
}

function picsumLarge(id) {
  return `https://picsum.photos/id/${(id % 1000) + 1}/1200/800`; // Generate a larger image URL using Picsum
}

function AppShell({ children }) { // A simple layout component that includes the header and wraps the main content. This helps keep the UI consistent across different pages and makes it easy to add global elements like the header or footer.
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
              <ImageIcon size={20} /> {/* A simple logo using the Image icon, since this app is all about browsing photos */}
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>Photo Browser</div>
              <div style={{ fontSize: 14, color: "#64748b" }}>
                React SPA with JSONPlaceholder
              </div>
            </div>
          </Link>

          <a
            href="https://jsonplaceholder.typicode.com/photos" // A link to the JSONPlaceholder /photos endpoint documentation, which is the API this app is built around. It opens in a new tab and has an external link icon for clarity.
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

function Card({ children, style = {} }) { // A reusable Card component to create consistent card styles across the app. It accepts children to render inside the card and an optional style prop for custom styling.
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

function Button({ children, onClick, disabled, style = {}, type = "button" }) { // A reusable Button component that accepts children to display inside the button, an onClick handler, a disabled state, and optional styles. This helps maintain consistent button styles and behavior across the app.
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "10px 14px",
        borderRadius: 12,
        border: "1px solid #cbd5e1",
        background: disabled ? "#e2e8f0" : "white",
        cursor: disabled ? "not-allowed" : "pointer",
        fontWeight: 600,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function Badge({ children }) { // A reusable Badge component to display small pieces of information, such as IDs or statuses. It accepts children to render inside the badge.
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

function ErrorState({ title = "Something went wrong", message, onRetry }) { // A reusable ErrorState component to display error messages. It accepts a title, a message, and an optional onRetry callback for retrying the action.
  return (
    <Card style={{ background: "#fef2f2", borderColor: "#fecaca" }}>
      <div style={{ padding: 24 }}>
        <h2 style={{ margin: 0, color: "#7f1d1d" }}>{title}</h2>
        <p style={{ color: "#991b1b" }}>{message}</p>
        {onRetry && (
          <Button onClick={onRetry} style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
            <RefreshCcw size={16} />
            Retry
          </Button>
        )}
      </div>
    </Card>
  );
}

function LoadingGrid() { // A simple loading state component that displays a grid of placeholder cards while data is being loaded. This provides a better user experience by giving a visual indication that content is loading, rather than just showing a spinner or blank screen.
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
          }} // A placeholder card with a white background, border, and rounded corners to mimic the appearance of a loaded card.

        >
          <div style={{ aspectRatio: "1 / 1", background: "#e2e8f0" }} />
          <div style={{ padding: 12 }}>
            <div style={{ height: 16, background: "#e2e8f0", borderRadius: 8, marginBottom: 8 }} />
            <div style={{ height: 12, width: "70%", background: "#e2e8f0", borderRadius: 8 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function PhotoGridCard({ photo }) { // A reusable component to display a photo in a grid. It accepts a photo object and displays its thumbnail, ID, album ID, and title.
  return (
    <Link to={`/photos/${photo.id}`} style={{ textDecoration: "none", color: "inherit" }}> {/* Wrap the card in a Link to make the entire card clickable and navigate to the photo detail page */}
      <Card style={{ overflow: "hidden", height: "100%" }}>
        <div style={{ aspectRatio: "1 / 1", overflow: "hidden", background: "#f1f5f9" }}>
          <img
            src={picsumThumbnail(photo.id)} /* Use the generated thumbnail URL for the image source */
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
            <Badge>#{photo.id}</Badge> {/* Display the photo ID in a badge for quick reference */}
            <Badge>Album {photo.albumId}</Badge> {/* Display the album ID in a badge for quick reference */}
          </div>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>{photo.title}</p>
        </div>
      </Card>
    </Link>
  );
}

function Pagination({ page, totalPages, onPageChange }) { // A pagination component that displays page numbers and navigation buttons. It accepts the current page, total number of pages, and a callback for when the page changes. It also includes logic to show ellipses when there are many pages, and to disable navigation buttons when on the first or last page.
  const pageNumbers = useMemo(() => {
    const pages = new Set([1, totalPages, page - 1, page, page + 1, page - 2, page + 2]);
    return [...pages].filter((n) => n >= 1 && n <= totalPages).sort((a, b) => a - b);
  }, [page, totalPages]);

  if (totalPages <= 1) return null; // Don't render the pagination component if there's only one page, since there's no need for navigation in that case.

  return ( // The pagination controls are wrapped in a div with styling to center the buttons and add spacing. The Previous and Next buttons are disabled when on the first or last page, respectively. The page numbers are displayed as buttons, with the current page highlighted. Ellipses are shown when there are gaps between the displayed page numbers to indicate that there are more pages in between.
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

      {pageNumbers.map((pageNumber, index) => { // Map over the page numbers to render buttons for each page. The index is used to determine if an ellipsis should be shown before the page number, based on whether there's a gap between this page number and the previous one.
        const previous = pageNumbers[index - 1];
        const showEllipsis = previous && pageNumber - previous > 1;

        return ( // Each page number is rendered as a button. The current page is styled differently to indicate that it's active. If there's a gap between this page number and the previous one, an ellipsis is shown before the button.
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

      <Button disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}> {/* The Next button is disabled when on the last page, and calls the onPageChange callback with the next page number when clicked. */}
        Next
      </Button>
    </div>
  );
}

function HomePage() { // The main page of the app that displays the photo gallery with pagination and search functionality. It uses the useSearchParams hook to read and update the URL query parameters for pagination and filtering, and the useNavigate hook to programmatically navigate when retrying after an error. It fetches photos from the API based on the current page, handles loading and error states, and allows filtering the displayed photos by title.
  const [searchParams, setSearchParams] = useSearchParams(); // useSearchParams is a React Router hook that allows us to read and manipulate the URL query parameters. We use it to get the current page number and search filter from the URL, and to update them when the user interacts with the pagination or search form. This makes our routes shareable and allows users to bookmark or share specific pages and filters.
  const navigate = useNavigate(); // useNavigate is a React Router hook that gives us a function to programmatically navigate to different routes. We use it in the error state to refresh the page and retry loading the photos when the user clicks the Retry button. By calling navigate(0), we effectively reload the current page, which triggers the useEffect to fetch the photos again.
  const page = Math.max(Number(searchParams.get("page") || 1), 1); // We read the "page" query parameter from the URL and convert it to a number. If it's not present, we default to 1. We also use Math.max to ensure that the page number is at least 1, so we don't end up with invalid page numbers if someone manually edits the URL.
  const filter = searchParams.get("q") || ""; // We read the "q" query parameter from the URL to get the current search filter. If it's not present, we default to an empty string, which means no filter. This allows us to filter the displayed photos based on their title, and have that filter be reflected in the URL for shareability.

  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [totalCount, setTotalCount] = useState(5000);
  const [searchInput, setSearchInput] = useState(filter);

  useEffect(() => { // Whenever the "q" query parameter changes in the URL, we update the searchInput state to reflect that change. This ensures that the search input field is always in sync with the URL, so if someone shares a link with a specific filter, the input field will show that filter when they open the page.
    setSearchInput(filter);
  }, [filter]);

  useEffect(() => {
    let cancelled = false;

    async function loadPhotos() { // This function is responsible for fetching the photos from the API based on the current page. It handles setting the loading state, catching errors, and normalizing the data to include thumbnail and large image URLs. The cancelled variable is used to prevent state updates if the component unmounts before the fetch completes, which can help avoid memory leaks and React warnings about updating state on an unmounted component.
      try {
        setLoading(true);
        setError("");

        const params = new URLSearchParams({
          _page: String(page),
          _limit: String(PAGE_SIZE),
        });

        const response = await fetch(`${API_BASE}/photos?${params.toString()}`); // We make a fetch request to the /photos endpoint with the appropriate query parameters for pagination. The _page parameter tells the API which page of results we want, and the _limit parameter tells it how many items to return per page. This allows us to load only the photos we need for the current page, rather than fetching all 5,000 photos at once.
        if (!response.ok) throw new Error(`Request failed: ${response.status}`); // Basic error handling to catch non-2xx responses and throw an error with the status code. This will be caught in the catch block below, where we can set the error state to display an error message to the user.

        const data = await response.json();
        const countHeader = response.headers.get("x-total-count");

        if (!cancelled) {
          const normalized = data.map((item) => ({
            ...item,
            thumbnailUrl: picsumThumbnail(item.id),
            url: picsumLarge(item.id),
          }));
          setPhotos(normalized);
          setTotalCount(Number(countHeader) || 5000);
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
  }, [page]);

  const filteredPhotos = useMemo(() => { // We use useMemo to compute the filtered list of photos based on the current filter and the loaded photos. This is an optimization to avoid re-filtering the photos on every render if the photos or filter haven't changed. The filtering logic converts both the filter and the photo titles to lowercase for a case-insensitive search, and checks if the photo title includes the filter string.
    const q = filter.trim().toLowerCase();
    if (!q) return photos;
    return photos.filter((photo) => photo.title.toLowerCase().includes(q));
  }, [photos, filter]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  function updateParams(nextPage, nextFilter) { // This function is responsible for updating the URL query parameters when the user changes the page or submits a new search filter. It constructs a new URLSearchParams object, sets the "page" and "q" parameters based on the provided values, and then updates the search parameters in the URL using setSearchParams. This will trigger a re-render and cause the useEffect that loads photos to run again with the new parameters.
    const params = new URLSearchParams();
    if (nextPage > 1) params.set("page", String(nextPage));
    if (nextFilter.trim()) params.set("q", nextFilter.trim());
    setSearchParams(params);
  }

  function onSearchSubmit(e) { // This function is called when the search form is submitted. It prevents the default form submission behavior, and then calls updateParams with the current page (resetting to 1) and the current search input value. This will update the URL with the new search filter and reset the pagination to the first page, which will trigger the photo loading logic to fetch and display the filtered results.
    e.preventDefault();
    updateParams(1, searchInput);
  }

  return ( // The main content of the home page is wrapped in the AppShell component, which provides the consistent layout and header. Inside the AppShell, we have a section for the page header and search form, a section for displaying the current page and filter information, and then conditional rendering for the loading state, error state, and the photo grid with pagination. The UI is designed to be responsive and user-friendly, with clear indications of loading and error states, and easy navigation through pages and filters.
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
                  placeholder="Filter current page by title"
                  style={{
                    width: "100%",
                    padding: "10px 12px 10px 34px",
                    borderRadius: 12,
                    border: "1px solid #cbd5e1",
                    outline: "none",
                  }}
                />
              </div>
              <Button type="submit">Search</Button>
            </form>
          </div>
        </Card>
      </section>

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
        <Badge>Page {page}</Badge>
        <Badge>{filteredPhotos.length} shown</Badge>
        <span>Total dataset: {totalCount} photos</span>
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
            {filteredPhotos.map((photo) => (
              <PhotoGridCard key={photo.id} photo={photo} />
            ))}
          </div>

          {filteredPhotos.length === 0 ? (
            <Card style={{ marginTop: 24 }}>
              <div style={{ padding: 32, textAlign: "center", color: "#475569" }}>
                No photos matched this filter on the current page.
              </div>
            </Card>
          ) : null}

          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={(nextPage) => updateParams(nextPage, filter)}
          />
        </>
      ) : null}
    </AppShell>
  );
}

function MetadataCard({ title, icon: Icon, children }) { // A reusable component for displaying metadata about a photo, album, or user in a card format. It accepts a title, an icon component to display next to the title, and children to render the metadata content. This helps create a consistent look for the different metadata sections on the photo detail page.
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
          <Icon size={16} />
          {title}
        </div>
        <div style={{ display: "grid", gap: 8, fontSize: 14, color: "#334155" }}>{children}</div>
      </div>
    </Card>
  );
}

function PhotoDetailPage() { // The detail page for a single photo, which displays the photo in a larger format along with its title, album information, user information, and a selection of other photos from the same album. It uses the useParams hook to read the photo ID from the URL, and fetches the necessary data from the API to display the details. It also handles loading and error states, and provides a link to go back to the main gallery.
  const { photoId } = useParams();
  const [photo, setPhoto] = useState(null);
  const [album, setAlbum] = useState(null);
  const [user, setUser] = useState(null);
  const [albumPhotos, setAlbumPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadDetails() { // This function is responsible for loading all the necessary data to display the photo details. It fetches the photo data, then uses the albumId from the photo to fetch the album data, and then uses the userId from the album to fetch the user data. It also fetches a selection of other photos from the same album to display as related content. The cancelled variable is used to prevent state updates if the component unmounts before the fetch completes, which can help avoid memory leaks and React warnings about updating state on an unmounted component.
      try {
        setLoading(true);
        setError("");

        const photoData = await fetchJson(`${API_BASE}/photos/${photoId}`);
        const normalizedPhoto = {
          ...photoData,
          thumbnailUrl: picsumThumbnail(photoData.id),
          url: picsumLarge(photoData.id),
        };

        const albumData = await fetchJson(`${API_BASE}/albums/${photoData.albumId}`);
        const userData = await fetchJson(`${API_BASE}/users/${albumData.userId}`);
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

  return ( // The content of the photo detail page is wrapped in the AppShell component for consistent layout. The page includes a back link to return to the gallery, and then conditionally renders the loading state, error state, or the photo details based on the current state. The photo details include the photo itself, its title, album information, user information, and related photos from the same album. The layout is designed to be responsive and visually appealing, with clear sections for each type of information.
    <AppShell>
      <div style={{ marginBottom: 24 }}>
        <Link to="/" style={{ textDecoration: "none" }}>
          <Button style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <ArrowLeft size={16} />
            Back to gallery
          </Button>
        </Link>
      </div>

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
            <Card style={{ overflow: "hidden", borderRadius: 32 }}>
              <div style={{ aspectRatio: "4 / 3", background: "#f1f5f9" }}>
                <img
                  src={photo.url}
                  alt={photo.title}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              </div>
            </Card>

            <Card>
              <div style={{ padding: 24 }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                  <Badge>Photo #{photo.id}</Badge>
                  <Badge>Album {photo.albumId}</Badge>
                </div>

                <h1 style={{ fontSize: 32, marginTop: 0 }}>{photo.title}</h1>
                <p style={{ color: "#475569", lineHeight: 1.7 }}>
                  This detail view is directly shareable, so opening /photos/{photo.id}
                  loads the same item with related album and user context.
                </p>
              </div>
            </Card>

            <div>
              <h2>More from this album</h2>
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

export default function App() { // The main App component that sets up the routing for the application. It uses React Router's BrowserRouter to enable client-side routing, and defines two routes: the home page at "/" and the photo detail page at "/photos/:photoId". Each route renders the appropriate component for that page. This structure allows us to have a single-page application with multiple views, while keeping the URL in sync with the current view for shareability and navigation.
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/photos/:photoId" element={<PhotoDetailPage />} />
      </Routes>
    </HashRouter>
  );
}