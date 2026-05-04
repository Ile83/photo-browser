import React, {
  type ButtonHTMLAttributes,
  type CSSProperties,
  type FormEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
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
  Album,
  Aperture,
  ArrowLeft,
  Building2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Grid3X3,
  Image as ImageIcon,
  Mail,
  Phone,
  RefreshCcw,
  Search,
  User,
  type LucideIcon,
} from "lucide-react";
import { usePhotoGallery } from "./hooks/usePhotoGallery";
import { usePhotoDetail } from "./hooks/usePhotoDetail";
import type { Photo } from "./types";

interface WithChildren {
  children: ReactNode;
}

interface CardProps extends WithChildren {
  className?: string;
  style?: CSSProperties;
}

interface ButtonProps extends WithChildren {
  variant?: "primary" | "secondary" | "ghost";
}

type AppButtonProps = ButtonProps & ButtonHTMLAttributes<HTMLButtonElement>;

interface BadgeProps extends WithChildren {
  tone?: "light" | "dark" | "accent";
}

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

interface PhotoGridCardProps {
  photo: Photo;
  index: number;
}

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (nextPage: number) => void;
}

interface MetadataCardProps extends WithChildren {
  title: string;
  icon: LucideIcon;
}

const HERO_FRAMES = [
  { id: 1018, label: "Northern ridge" },
  { id: 1039, label: "Coastal dusk" },
  { id: 1043, label: "Amber trail" },
  { id: 1067, label: "Glasshouse" },
];

function classNames(...names: Array<string | false | undefined>) {
  return names.filter(Boolean).join(" ");
}

function AppShell({ children }: WithChildren) {
  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="site-header__inner">
          <Link to="/" className="brand-link" aria-label="Photo Browser home">
            <span className="brand-mark">
              <Aperture size={23} />
            </span>
            <span>
              <span className="brand-name">Photo Browser</span>
              <span className="brand-subtitle">5,000 frame catalog</span>
            </span>
          </Link>

          <a
            className="api-link"
            href="https://jsonplaceholder.typicode.com/photos"
            target="_blank"
            rel="noreferrer"
          >
            <span>API</span>
            <ExternalLink size={16} />
          </a>
        </div>
      </header>

      <main className="page-frame">{children}</main>
    </div>
  );
}

function Card({ children, className, style }: CardProps) {
  return (
    <div className={classNames("surface-card", className)} style={style}>
      {children}
    </div>
  );
}

function Button({
  children,
  className,
  type = "button",
  variant = "primary",
  ...buttonProps
}: AppButtonProps) {
  return (
    <button
      type={type}
      className={classNames("button", `button--${variant}`, className)}
      {...buttonProps}
    >
      {children}
    </button>
  );
}

function Badge({ children, tone = "light" }: BadgeProps) {
  return <span className={classNames("badge", `badge--${tone}`)}>{children}</span>;
}

function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
}: ErrorStateProps) {
  return (
    <Card className="error-state">
      <div className="error-state__icon">
        <RefreshCcw size={20} />
      </div>
      <div>
        <h2>{title}</h2>
        <p>{message}</p>
      </div>
      {onRetry ? (
        <Button onClick={onRetry} className="button--inline">
          <RefreshCcw size={16} />
          Retry
        </Button>
      ) : null}
    </Card>
  );
}

function LoadingGrid() {
  return (
    <div className="gallery-grid" aria-label="Loading photos">
      {Array.from({ length: 12 }).map((_, index) => (
        <Card
          key={index}
          className={classNames(
            "photo-card",
            "photo-card--loading",
            index === 0 || index === 7 ? "photo-card--feature" : undefined,
          )}
        >
          <div className="skeleton skeleton--media" />
          <div className="photo-card__body">
            <span className="skeleton skeleton--line" />
            <span className="skeleton skeleton--line skeleton--short" />
          </div>
        </Card>
      ))}
    </div>
  );
}

function HeroCollage() {
  return (
    <div className="hero-collage" aria-label="Featured photographs">
      {HERO_FRAMES.map((frame, index) => (
        <figure key={frame.id} className={classNames("hero-frame", `hero-frame--${index + 1}`)}>
          <img
            src={`https://picsum.photos/id/${frame.id}/900/700`}
            alt={frame.label}
            loading={index === 0 ? "eager" : "lazy"}
          />
          <figcaption>{frame.label}</figcaption>
        </figure>
      ))}
    </div>
  );
}

function PhotoGridCard({ photo, index }: PhotoGridCardProps) {
  const isFeatured = index === 0 || index === 7;

  return (
    <Link
      to={`/photos/${photo.id}`}
      className={classNames("photo-card-link", isFeatured && "photo-card--feature")}
    >
      <Card className="photo-card">
        <div className="photo-card__media">
          <img src={photo.thumbnailUrl} alt={photo.title} loading="lazy" />
          <div className="photo-card__overlay" />
          <div className="photo-card__badges">
            <Badge tone="dark">#{photo.id}</Badge>
            <Badge tone="dark">Album {photo.albumId}</Badge>
          </div>
        </div>
        <div className="photo-card__body">
          <p>{photo.title}</p>
        </div>
      </Card>
    </Link>
  );
}

function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  const pageNumbers = useMemo(() => {
    const pages = new Set([1, totalPages, page - 1, page, page + 1, page - 2, page + 2]);
    return [...pages].filter((n) => n >= 1 && n <= totalPages).sort((a, b) => a - b);
  }, [page, totalPages]);

  if (totalPages <= 1) return null;

  return (
    <nav className="pagination" aria-label="Gallery pagination">
      <Button variant="secondary" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        <ChevronLeft size={17} />
        Previous
      </Button>

      <div className="pagination__pages">
        {pageNumbers.map((pageNumber, index) => {
          const previous = pageNumbers[index - 1];
          const showEllipsis = previous !== undefined && pageNumber - previous > 1;

          return (
            <React.Fragment key={pageNumber}>
              {showEllipsis ? <span className="pagination__ellipsis">...</span> : null}
              <Button
                variant={pageNumber === page ? "primary" : "ghost"}
                onClick={() => onPageChange(pageNumber)}
                className="pagination__number"
                aria-current={pageNumber === page ? "page" : undefined}
              >
                {pageNumber}
              </Button>
            </React.Fragment>
          );
        })}
      </div>

      <Button
        variant="secondary"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Next
        <ChevronRight size={17} />
      </Button>
    </nav>
  );
}

function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const page = Math.max(Number(searchParams.get("page") || 1), 1);
  const filter = searchParams.get("q") || "";
  const [searchInput, setSearchInput] = useState(filter);

  const { photos, totalCount, totalPages, safePage, loading, error, datasetCount } =
    usePhotoGallery(page, filter);

  useEffect(() => {
    setSearchInput(filter);
  }, [filter]);

  const updateParams = useCallback(
    (nextPage: number, nextFilter: string) => {
      const params = new URLSearchParams();
      if (nextPage > 1) params.set("page", String(nextPage));
      if (nextFilter.trim()) params.set("q", nextFilter.trim());
      setSearchParams(params);
    },
    [setSearchParams],
  );

  useEffect(() => {
    if (!loading && page !== safePage) {
      updateParams(safePage, filter);
    }
  }, [page, safePage, filter, loading, updateParams]);

  function onSearchSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    updateParams(1, searchInput);
  }

  return (
    <AppShell>
      <section className="gallery-hero">
        <div className="gallery-hero__content">
          <div className="eyebrow">
            <Grid3X3 size={16} />
            JSONPlaceholder Collection
          </div>
          <h1>Photo Browser</h1>

          <form onSubmit={onSearchSubmit} className="search-panel" aria-label="Search photos">
            <label htmlFor="photo-search">Filter titles</label>
            <div className="search-panel__row">
              <div className="search-input">
                <Search size={18} aria-hidden="true" />
                <input
                  id="photo-search"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Try accusamus, officia, skyline..."
                />
              </div>
              <Button type="submit" className="button--search">
                <Search size={17} />
                Search
              </Button>
            </div>
          </form>

          <div className="metric-strip" aria-label="Gallery metrics">
            <div>
              <strong>{datasetCount.toLocaleString()}</strong>
              <span>photos</span>
            </div>
            <div>
              <strong>{totalCount.toLocaleString()}</strong>
              <span>matches</span>
            </div>
            <div>
              <strong>{safePage}</strong>
              <span>page</span>
            </div>
          </div>
        </div>

        <HeroCollage />
      </section>

      <section className="gallery-toolbar">
        <div className="gallery-toolbar__copy">
          <span className="section-kicker">Current frame set</span>
          <h2>{filter ? `Results for "${filter}"` : "Latest photos"}</h2>
        </div>
        <div className="gallery-toolbar__meta">
          <Badge tone="accent">{photos.length} shown</Badge>
          <Badge>{totalCount.toLocaleString()} matched</Badge>
          <Badge>{datasetCount.toLocaleString()} total</Badge>
        </div>
      </section>

      {loading ? <LoadingGrid /> : null}
      {!loading && error ? <ErrorState message={error} onRetry={() => navigate(0)} /> : null}

      {!loading && !error ? (
        <>
          <div className="gallery-grid">
            {photos.map((photo, index) => (
              <PhotoGridCard key={photo.id} photo={photo} index={index} />
            ))}
          </div>

          {totalCount === 0 ? (
            <Card className="empty-state">
              <ImageIcon size={32} />
              <h2>No matching photos</h2>
              <p>Adjust the title filter and the catalog will refresh.</p>
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

function MetadataCard({ title, icon, children }: MetadataCardProps) {
  return (
    <Card className="metadata-card">
      <div className="metadata-card__title">
        {React.createElement(icon, { size: 17 })}
        {title}
      </div>
      <div className="metadata-card__content">{children}</div>
    </Card>
  );
}

function MetadataRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: ReactNode;
  icon?: LucideIcon;
}) {
  return (
    <div className="metadata-row">
      {icon ? React.createElement(icon, { size: 15 }) : <span aria-hidden="true" />}
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function PhotoDetailPage() {
  const { photoId } = useParams();
  const { photo, album, user, albumPhotos, loading, error } = usePhotoDetail(photoId);

  return (
    <AppShell>
      <div className="detail-nav">
        <Link to="/" className="button button--secondary">
          <ArrowLeft size={17} />
          Back to gallery
        </Link>
      </div>

      {loading ? (
        <div className="detail-grid">
          <div className="detail-photo skeleton" />
          <div className="detail-sidebar">
            <div className="skeleton skeleton--panel" />
            <div className="skeleton skeleton--panel" />
            <div className="skeleton skeleton--panel" />
          </div>
        </div>
      ) : null}

      {!loading && error ? <ErrorState title="Unable to load photo" message={error} /> : null}

      {!loading && !error && photo ? (
        <div className="detail-grid">
          <article className="detail-main">
            <figure className="detail-photo">
              <img src={photo.url} alt={photo.title} />
              <figcaption>
                <Badge tone="dark">Photo #{photo.id}</Badge>
                <Badge tone="dark">Album {photo.albumId}</Badge>
              </figcaption>
            </figure>

            <div className="detail-heading">
              <span className="section-kicker">Selected frame</span>
              <h1>{photo.title}</h1>
            </div>

            <section className="related-section">
              <div className="gallery-toolbar">
                <div className="gallery-toolbar__copy">
                  <span className="section-kicker">Same album</span>
                  <h2>More frames</h2>
                </div>
              </div>

              <div className="related-grid">
                {albumPhotos.map((item) => (
                  <Link
                    key={item.id}
                    to={`/photos/${item.id}`}
                    className="related-card"
                  >
                    <img src={item.thumbnailUrl} alt={item.title} loading="lazy" />
                    <span>{item.title}</span>
                  </Link>
                ))}
              </div>
            </section>
          </article>

          <aside className="detail-sidebar">
            <MetadataCard title="Photo" icon={ImageIcon}>
              <MetadataRow label="ID" value={photo.id} />
              <MetadataRow label="Album" value={photo.albumId} />
              <MetadataRow label="Path" value={`/photos/${photo.id}`} />
            </MetadataCard>

            {album ? (
              <MetadataCard title="Album" icon={Album}>
                <MetadataRow label="Title" value={album.title} />
                <MetadataRow label="Album ID" value={album.id} />
                <MetadataRow label="Owner ID" value={album.userId} />
              </MetadataCard>
            ) : null}

            {user ? (
              <MetadataCard title="Owner" icon={User}>
                <MetadataRow label="Name" value={user.name} icon={User} />
                <MetadataRow label="Email" value={user.email} icon={Mail} />
                <MetadataRow label="Phone" value={user.phone} icon={Phone} />
                <MetadataRow label="Company" value={user.company?.name} icon={Building2} />
                <MetadataRow label="Website" value={user.website} icon={ExternalLink} />
              </MetadataCard>
            ) : null}
          </aside>
        </div>
      ) : null}
    </AppShell>
  );
}

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
