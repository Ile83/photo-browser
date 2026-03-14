# Photo Browser

A React single-page app for browsing photos with pagination, search, and detail pages.

This project uses JSONPlaceholder as the data source and generates image URLs using Picsum so the UI can display real photos.

## Live demo

https://ile83.github.io/photo-browser/

## Features

- Browse paginated photos (24 items per page)
- Filter photos on the current page by title
- Open a dedicated photo detail page
- View related photos from the same album
- View album and user metadata for each photo
- Shareable routes and query parameters
- Loading and error states for API requests

## Tech Stack

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

## Project Structure

```text
src/
	App.jsx       Main app, routing, pages, and data fetching
	main.jsx      React app entry point
	index.css     Global styles
	App.css       Additional styles
```

## Production Build

```bash
npm run build
npm run preview
```

## License

This project is provided as-is for learning and experimentation.
