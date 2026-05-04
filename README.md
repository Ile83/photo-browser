# Photo Browser

A React single-page app for browsing photos with pagination, search, and detail pages.

This project uses JSONPlaceholder as the data source and generates image URLs using Picsum so the UI can display real photos.

## Live demo

https://ile83.github.io/photo-browser/

## Features

- Browse paginated photos (24 items per page)
- Fetch gallery pages on demand with in-memory caching
- Filter photos from whole dataset
- Open a dedicated photo detail page
- View related photos from the same album
- View album and user metadata for each photo
- Shareable routes and query parameters
- Loading and error states for API requests

## Tech Stack

- TypeScript
- React 19
- React Router 7
- Vite 8
- lucide-react icons
- ESLint 9

## Getting Started

### Prerequisites

- Node.js 18+ (Node.js 20+ recommended)
- npm 9+

### Install

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

Then open the local URL shown in your terminal (usually `http://localhost:5173`).

## Available Scripts

- `npm run dev` starts the Vite dev server
- `npm run build` builds for production
- `npm run preview` previews the production build locally
- `npm run lint` runs ESLint
- `npm run typecheck` runs the TypeScript compiler without emitting files

## Routes

- `/` home gallery with pagination and title filter
- `/photos/:photoId` photo detail page

The home page uses query parameters:

- `page` for current page number
- `q` for title filter text

Example:

```text
/?page=3&q=accusamus
```

## Data Sources

- Photos API: https://jsonplaceholder.typicode.com/photos
- Album API: https://jsonplaceholder.typicode.com/albums/:id
- User API: https://jsonplaceholder.typicode.com/users/:id
- Image rendering: https://picsum.photos

Note: JSONPlaceholder photo records include placeholder URL fields. This app maps photo IDs to Picsum image URLs for thumbnails and larger previews.

## Data Fetching Strategy

- The default gallery view fetches only the current page of photos and caches visited pages in memory.
- Title filtering still searches across the full 5,000-photo dataset, so the app falls back to one cached full-dataset fetch the first time a filter is used.
- The detail page reuses cached photo, album, user, and album-photo requests when you open related photos.

## Project Structure

```text
src/
	App.tsx                  Main app, routes, and presentational components
	api/
		jsonPlaceholder.ts   API constants and fetch helper
		photos.ts            Photo data access, normalization, and caching
	hooks/
		usePhotoGallery.ts   Gallery loading and page/filter state
		usePhotoDetail.ts    Detail-page loading state
	main.tsx                 React app entry point
	types.ts                Shared TypeScript interfaces
	index.css                Global styles
	App.css                  Additional styles
```

## Production Build

```bash
npm run build
npm run preview
```

## Future Development Ideas

### Now (highest impact / lowest risk)

- **Search performance:** Replace the filter fallback full-dataset fetch with a backend or search-ready API that can handle substring queries server-side.
- **Resilience UX:** Add a clear error state and one-click retry for failed requests.
- **Test coverage on core flows:** Add unit tests for utility logic and integration tests for gallery -> search -> detail.

### Next (product quality and scale)

- **Search quality:** Add debounced input and richer filters (album, user) to reduce noise in results.
- **Image delivery improvements:** Expand lazy loading, add skeleton placeholders, and prefetch likely next-view images.
- **State architecture:** Move data fetching/state concerns into a dedicated layer (for example React Query) to simplify maintenance.

### Later (optimization and long-term maturity)

- **Accessibility hardening:** Improve keyboard flow, ARIA semantics, and contrast checks; verify screen reader behavior.
- **Mobile polish:** Fine-tune spacing, typography scaling, and touch ergonomics on smaller screens.
- **Data-informed prioritization:** Add lightweight analytics (search usage, opened photos) to guide roadmap decisions.
- **Engineering quality gates:** Add CI checks for lint, tests, and production build on pull requests.


## License

This project is provided as-is for learning and experimentation.
