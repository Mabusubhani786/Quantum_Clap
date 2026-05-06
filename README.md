# Quantum Clap

Quantum Clap is an entertainment discovery application designed to help users explore movies, series, and anime in one place. It delivers a smooth browsing experience with curated trending sections, rich media details, and easy access to cast and company information.

## Summary

- Unified movie, series, and anime discovery experience
- Responsive browsing with carousels, cards, and pagination
- Rich detail pages for media, people, and companies
- Discover trending titles, top picks, and new releases

## Page Overview

### Home (`/home`)

- Hero landing section with featured content and quick navigation
- Trending media sections with filters for all media, movies, and TV
- Top rated and upcoming sections for easy discovery
- Cards link directly to media detail pages

### Movies (`/movie/`)

- Movie catalog listing with genre mapping and title cards
- Poster preview, rating, release year, and overview snippets
- Pagination support for browsing large datasets

### Series (`/series/`)

- TV series catalog listing with responsive cards
- Genre details and media metadata
- Links to series detail pages for deeper information

### Anime (`/anime/`)

- Anime catalog and browse experience
- Same polished presentation as movies and series
- Anime detail pages with season and episode metadata

### Movie Detail (`/movie/:mediaId`)

- Movie poster, synopsis, runtime, rating, and release date
- Cast and crew highlights
- Similar recommendations and related content
- Watch provider and external links when available

### Series Detail (`/series/:mediaId`)

- Series overview with seasons, creators, genres, and status
- Ratings, summary, and release timeline
- Season and episode details using the overview page

### Anime Detail (`/anime/:mediaId`)

- Anime series details with cast and reviews
- Related content and recommended watch suggestions
- Seasonal overview for anime-specific metadata

### Overview Pages (`/series/:mediaId/overview`, `/anime/:mediaId/overview`)

- Season guides and episode breakdowns
- Visual galleries, episode summaries, and review content

### Person Detail (`/person/:personId`)

- Biography and profile information
- Combined acting and crew credits
- Image gallery and known-for highlights

### Company Detail (`/company/:companyId`)

- Company profile, headquarters, and origin country
- Logo gallery and alternative names
- Homepage and external company links

## Project Structure

- `frontend/`
  - `src/routes/` — route definitions and page wiring
  - `src/components/` — page components, reusable UI, and shared widgets
  - `src/service/` — centralized API fetch helper
  - `src/api-fetch-endpoints/` — TMDB endpoint definitions in JSON
  - `src/layout/` — header and layout wrappers
  - `src/components/ui/` — shared shadcn-style UI components

## Setup

1. `cd frontend`
2. `npm install`
3. Create a `.env` file or set environment variables:
   - `VITE_TMDB_AUTHORIZATION` — TMDB authorization header string
   - `VITE_API_ACCEPT` — usually `application/json`
4. `npm run dev`

## Available Scripts

- `npm run dev` — start local development server
- `npm run build` — build production bundle
- `npm run preview` — preview production build
- `npm run lint` — run ESLint across the frontend
- `npm run format` — format code with Prettier
- `npm run typecheck` — run TypeScript type checking

## Notes

- The app uses file-based routing via `@tanstack/react-router`.
- `fetchApiData` centralizes all TMDB fetch logic and query parameters.
- The UI is powered by Tailwind CSS and shadcn/ui components.
- Root `/` redirects to `/home`.
