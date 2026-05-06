# Quantum Clap Frontend

The frontend delivers the Quantum Clap experience for browsing and discovering entertainment. It focuses on clean navigation, clear content discovery, and immersive media pages.

## Summary

- Browse movies, series, and anime in one place
- Responsive catalogs, detail pages, and entity profiles
- Explore trending titles, ratings, and recommendations
- Enjoy polished cards, carousels, and clear navigation

## Key Pages

- `Home` — hero section and trending discovery
- `Movies` — movie catalog with pagination and genre metadata
- `Series` — TV series catalog and series detail pages
- `Anime` — anime catalog and overview pages
- `Movie Detail` — movie synopsis, cast, recommendations, and providers
- `Series Detail` — full series overview, seasons, and creators
- `Person Detail` — actor/crew biography and credit list
- `Company Detail` — production company profile and logos

## Project Structure

- `src/routes/` — route definitions and page route components
- `src/components/` — page components, shared UI, and feature widgets
- `src/components/ui/` — shared reusable UI components
- `src/service/` — `fetchApiData` helper for TMDB requests
- `src/api-fetch-endpoints/` — JSON endpoint configurations for TMDB
- `src/layout/` — application layout and header wrapper

## Setup

1. `cd frontend`
2. `npm install`
3. Configure environment variables for TMDB API access
4. `npm run dev`

## Scripts

- `npm run dev`
- `npm run build`
- `npm run preview`
- `npm run lint`
- `npm run format`
- `npm run typecheck`
