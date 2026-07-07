# Quantum Clap

Quantum Clap is a full-stack entertainment discovery platform for exploring movies, series, and anime with a polished browsing experience, authenticated user flows, and personalized watch activity.

## Overview

- Discover movies, TV series, and anime from TMDB
- Explore rich media, person, and company detail pages
- Sign up, sign in, refresh sessions, and revoke auth tokens
- Save titles to a watch list and track recent activity
- Browse curated home sections with trending, upcoming, top-rated, and on-air content
- Filter catalog pages by language, year, rating, release date, genre, and sort order

## Architecture

- `frontend/` — React 19 + Vite + TypeScript single-page app
- `backend/` — Fastify + TypeScript REST API
- `MongoDB` — persistence for users, JWT sessions, watch list, recent activity, and roles
- `TMDB API` — upstream content source for media discovery and metadata

## Tech Stack

- Frontend: `React`, `TypeScript`, `Vite`, `@tanstack/react-router`, `Tailwind CSS`, `shadcn/ui`, `Sonner`
- Backend: `Fastify`, `TypeScript`, `Mongoose`, `bcryptjs`
- Database: `MongoDB Atlas` or any MongoDB connection exposed through `MONGODB_URI`
- Deployment: frontend configured for SPA hosting with `frontend/vercel.json`

## Features

### Discovery Experience

- Home experience with hero media preview and curated rails
- Dedicated catalog pages for movies, series, and anime
- Search across movies, series, people, and companies
- Detail pages with metadata, cast, recommendations, images, reviews, and related content
- Series and anime overview pages for season-level exploration

### Personalization

- User registration and sign-in
- Session-based auth with access token refresh support
- Watch list save/remove flows
- Recent activity tracking for authenticated users
- Profile screen for user account data

### Performance-Oriented Client Behavior

- Shared request deduplication for repeated API calls
- Short-lived GET response caching for smoother navigation
- Backend warm-up check before sign-in on cold deployments
- Request timeout handling for backend API calls

## Route Map

### Public Auth Routes

- `/sign-in`
- `/sign-up`

### Main App Routes

- `/home`
- `/movie`
- `/movie/:mediaId`
- `/series`
- `/series/:mediaId`
- `/series/:mediaId/overview`
- `/series/:mediaId/season/:seasonNumber`
- `/anime`
- `/anime/:mediaId`
- `/anime/:mediaId/overview`
- `/anime/:mediaId/season/:seasonNumber`
- `/person/:personId`
- `/company/:companyId`
- `/profile`

## Backend API

### System

- `GET /ping`
- `GET /health`

### Auth

- `POST /sign-in`
- `POST /jwt_user/token`
- `POST /jwt_user/refresh`
- `POST /jwt_user/revoke`

### Resources

- `POST /user`
- `GET /user`
- `GET /user/:id`
- `PUT /user/:id`
- `PATCH /user/:id`
- `DELETE /user/:id`

- `POST /watch-list`
- `GET /watch-list`
- `GET /watch-list/:id`
- `PUT /watch-list/:id`
- `PATCH /watch-list/:id`
- `DELETE /watch-list/:id`

- `POST /recent`
- `GET /recent`
- `GET /recent/:id`
- `PUT /recent/:id`
- `PATCH /recent/:id`
- `DELETE /recent/:id`

- `POST /roles`
- `GET /roles`
- `GET /roles/:id`
- `PUT /roles/:id`
- `PATCH /roles/:id`
- `DELETE /roles/:id`

## Project Structure

- `README.md` — root project documentation
- `frontend/` — client application
- `frontend/src/routes/` — TanStack file-based routes
- `frontend/src/components/` — feature components and page building blocks
- `frontend/src/components/ui/` — shared UI primitives
- `frontend/src/layout/` — app layout and header shell
- `frontend/src/lib/` — auth helpers, filter helpers, URL helpers, request cache
- `frontend/src/service/` — TMDB fetch layer and backend API layer
- `frontend/src/api-fetch-endpoints/` — endpoint contracts for TMDB and backend
- `backend/` — API server
- `backend/src/controllers/` — route handlers and resource logic
- `backend/src/modules/` — Mongoose models
- `backend/src/config/` — DB configuration
- `backend/src/helper/` — password, JWT, response, and REST helpers
- `backend/src/router/` — route registration

## Environment Variables

### Frontend

Set these in `frontend/.env` for local development or in your deployment platform for production builds:

- `VITE_API_ACCEPT` — usually `application/json`
- `VITE_TMDB_AUTHORIZATION` — TMDB bearer token
- `VITE_BACKEND_API_BASE_URL` — backend base URL, such as `http://localhost:8002`

### Backend

Use either `MONGODB_URI` or the individual MongoDB settings below:

- `MONGODB_URI`
- `DB_USER`
- `DB_PASSWORD`
- `DB_HOST`
- `DB_NAME`
- `DB_OPTIONS`
- `PORT`
- `HOST` (optional)
- `JWT_SECRET`
- `JWT_ACCESS_EXPIRES_IN_SECONDS`
- `JWT_REFRESH_EXPIRES_IN_SECONDS`

## Local Development

### 1. Start the backend

```bash
cd backend
npm install
npm run dev
```

### 2. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

### 3. Open the app

- Frontend default: `http://localhost:5173`
- Backend default from env: `http://localhost:8002`

## Scripts

### Frontend Scripts

- `npm run dev`
- `npm run build`
- `npm run preview`
- `npm run lint`
- `npm run format`
- `npm run typecheck`

### Backend Scripts

- `npm run dev`
- `npm run build`
- `npm run start`

## Deployment Notes

- The frontend is configured as an SPA with rewrite support in `frontend/vercel.json`
- `VITE_BACKEND_API_BASE_URL` must point to the deployed backend URL at build time
- The backend waits for MongoDB connection before serving requests
- Cold-started backend environments may respond slower on the first request, so frontend auth warm-up logic helps reduce sign-in friction

## Current Implementation Notes

- Auth state is stored in `sessionStorage`
- TMDB endpoint metadata is centralized in JSON files for consistency
- Backend CORS headers are applied in the Fastify `onRequest` hook
- Health checks expose DB collection visibility and runtime status

## Validation

Recommended verification commands:

```bash
cd frontend && npm run typecheck
cd frontend && npm run lint
cd backend && npm run build
```
