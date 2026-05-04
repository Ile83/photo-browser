# Photo Browser

A visually rich React single-page photo browser for exploring a 5,000-image catalog with pagination, title search, and shareable detail pages.

The app uses JSONPlaceholder for structured photo, album, and user data. Photo records are normalized to Picsum URLs so the gallery renders real photographic imagery instead of placeholder blocks.

## Live Demo

https://ile83.github.io/photo-browser/

## Highlights

- Cinematic landing view with a responsive featured-photo collage
- Polished gallery grid with image overlays, badges, hover states, and skeleton loading
- Paginated browsing with 24 photos per page
- Whole-dataset title filtering with URL-backed query state
- Dedicated photo detail pages with large preview imagery
- Related photos from the same album
- Album and user metadata cards
- Shareable routes and query parameters
- Loading, empty, and error states for API requests
- Responsive layout for desktop and mobile screens

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

Vite is configured with the GitHub Pages base path, so open:

```text
http://localhost:5173/photo-browser/
```

The terminal may show `127.0.0.1` instead of `localhost`; either host is fine.

## Available Scripts

- `npm run dev` starts the Vite dev server
- `npm run build` runs TypeScript checks and builds for production
- `npm run preview` previews the production build locally
- `npm run lint` runs ESLint
- `npm run typecheck` runs the TypeScript compiler without emitting files

## Routes

- `/` home gallery with pagination and title filter
- `/photos/:photoId` photo detail page

The home page supports these query parameters:

- `page` for the current page number
- `q` for title filter text

Example:

```text
/?page=3&q=accusamus
```

Because this app uses `HashRouter`, deployed URLs are served under the hash path:

```text
https://ile83.github.io/photo-browser/#/photos/42
```

## Data Sources

- Photos API: https://jsonplaceholder.typicode.com/photos
- Album API: https://jsonplaceholder.typicode.com/albums/:id
- User API: https://jsonplaceholder.typicode.com/users/:id
- Image rendering: https://picsum.photos

JSONPlaceholder photo records include placeholder image URL fields. This app maps photo IDs to Picsum image URLs for thumbnails and large previews.

## Data Fetching Strategy

- The default gallery fetches only the current page and caches visited pages in memory.
- Title filtering searches across the full 5,000-photo dataset, so the first filtered search loads and caches the full dataset.
- Detail pages cache photo, album, user, and same-album photo requests, which keeps related-photo navigation snappy.

## Project Structure

```text
src/
  App.tsx                  Routes, page composition, and presentational components
  api/
    jsonPlaceholder.ts     API constants and fetch helper
    photos.ts              Photo data access, normalization, and caching
  hooks/
    usePhotoGallery.ts     Gallery loading and page/filter state
    usePhotoDetail.ts      Detail-page loading state
  main.tsx                 React app entry point
  types.ts                 Shared TypeScript interfaces
  index.css                Global visual system and responsive styles
  App.css                  Legacy starter styles, currently unused
```

## Production Build

```bash
npm run build
npm run preview
```

## Verification

Useful checks before shipping changes:

```bash
npm run lint
npm run typecheck
npm run build
```

## Future Development Ideas

### Now

- Add automated UI smoke tests for gallery, search, pagination, and detail navigation.
- Add accessibility checks for keyboard flow, landmarks, focus order, and screen reader labels.
- Add a debounced search interaction so typing feels lighter once the full dataset is loaded.

### Next

- Add richer filters for album, user, and photo ID.
- Prefetch adjacent pages and likely related-photo detail routes.
- Move API state into a dedicated data layer such as TanStack Query if the app grows.

### Later

- Add visual regression checks for desktop and mobile layouts.
- Add lightweight analytics for search terms and opened photos.
- Add CI checks for lint, typecheck, build, and tests on pull requests.

## License

This project is provided as-is for learning and experimentation.
