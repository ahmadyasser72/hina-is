# @hina-is/site

The front-end website for **hina-is** — a BanG Dream! fan site showing events and stamps from the game.

Built with [Astro](https://astro.build) and deployed as a [Cloudflare Worker](https://workers.cloudflare.com/). Game data is provided by the sibling `@hina-is/bestdori` package which pre-fetches everything from Bestdori at build time.

## Features

Browse and filter BanG Dream! **events** and **stamps**.

## Tech stack

| Thing                                | Tool                                                                            |
| ------------------------------------ | ------------------------------------------------------------------------------- |
| Framework                            | [Astro](https://astro.build) (server output)                                    |
| Styling                              | [Tailwind CSS v4](https://tailwindcss.com) + [daisyUI](https://daisyui.com)     |
| Filtering                            | [Orama](https://orama.com)                                                      |
| Runtime                              | [Cloudflare Workers](https://workers.cloudflare.com/) via `@astrojs/cloudflare` |
| Dates                                | [Day.js](https://day.js.org)                                                    |
| Icons                                | [Iconify](https://iconify.design)                                               |
| Interactivity & partial page updates | [htmx](https://htmx.org)                                                        |

## Prerequisites

- [Bun](https://bun.sh)

## Setup

### 1. Install dependencies (from repo root)

```sh
bun install
```

### 2. Configure environment variables

Create a `.env` file inside this directory:

```sh
# site/.env

# Optional: GoatCounter analytics endpoint
GOATCOUNTER_ENDPOINT=https://yoursite.goatcounter.com/count
```

| Variable               | Required | Description                                                    |
| ---------------------- | -------- | -------------------------------------------------------------- |
| `GOATCOUNTER_ENDPOINT` | No       | GoatCounter analytics URL. If omitted, analytics are disabled. |

### 3. Fetch data and start the dev server

Game data must be fetched before running the site. From the **repo root**:

```sh
bun update-data      # fetches the latest data from Bestdori
cd site
bun dev              # starts the Astro dev server at http://localhost:4321
```

Or do both steps with:

```sh
bun build-site       # fetches data + builds for production
```

## Commands

Run from inside the `site/` directory:

| Command       | Description                                       |
| ------------- | ------------------------------------------------- |
| `bun dev`     | Start local dev server at `http://localhost:4321` |
| `bun build`   | Build the site for production to `./dist/`        |
| `bun preview` | Preview the production build locally              |
| `bun check`   | Run Astro type checking                           |

## Project structure

```
site/
├── src/
│   ├── layouts/          # Base page layouts
│   ├── lib/              # Shared utilities
│   ├── pages/
│   │   ├── index.astro          # Home page (random event background)
│   │   └── page/
│   │       ├── events/          # Event list and detail pages
│   │       └── stamps/          # Stamp list and detail pages
│   └── styles/                  # Global CSS
├── public/               # Static assets
├── astro.config.mjs      # Astro configuration
└── wrangler.jsonc        # Cloudflare Workers configuration
```

## Deployment

Deployment is handled automatically by GitHub Actions — see the [root README](../README.md#deployment-cloudflare-workers-via-github-actions) for the full setup guide including required GitHub secrets.

To deploy manually (requires `wrangler` and Cloudflare credentials):

```sh
bun build            # build first
bun wrangler deploy  # deploy to Cloudflare Workers
```
