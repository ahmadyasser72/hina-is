# hina-is

A fan site for [BanG Dream!](https://en.wikipedia.org/wiki/BanG_Dream!) that shows events and stamps from the game. Data is pulled live from [Bestdori](https://bestdori.com) (the community BanG Dream! API), processed and bundled at build time, then served as a [Cloudflare Worker](https://workers.cloudflare.com/).

## What's inside

This is a monorepo with two packages:

| Package             | Path                 | What it does                                                        |
| ------------------- | -------------------- | ------------------------------------------------------------------- |
| `@hina-is/bestdori` | `packages/bestdori/` | Fetches and caches game data from Bestdori for use in the site      |
| `@hina-is/site`     | `site/`              | The website — renders event and stamp pages, deployed to Cloudflare |

## Prerequisites

- [Bun](https://bun.sh) (the package manager and runtime used throughout)
- [Git](https://git-scm.com) (the bestdori package uses `git rev-parse` to locate the cache directory)

## Setup

### 1. Install dependencies

```sh
bun install
```

### 2. Configure environment variables

Copy the example env file and fill in the values:

```sh
cp .env.example .env
```

| Variable               | Required | Description                                                                                                                |
| ---------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------- |
| `GOATCOUNTER_ENDPOINT` | No       | URL to your [GoatCounter](https://www.goatcounter.com/) analytics endpoint (e.g. `https://yoursite.goatcounter.com/count`) |

### 3. Run locally

```sh
# Fetch data from Bestdori and start the dev server
bun update-data
cd site && bun dev
```

The site will be available at `http://localhost:4321`.

## Scripts

Run these from the **repo root**:

| Command           | Description                                      |
| ----------------- | ------------------------------------------------ |
| `bun update-data` | Fetches the latest data from Bestdori            |
| `bun build-site`  | Fetches data then builds the site for production |
| `bun format`      | Formats all files with Prettier                  |

## Deployment (Cloudflare Workers via GitHub Actions)

The site is automatically deployed to Cloudflare Workers on every push to `main`. The pipeline also runs on a schedule (every hour) to keep the data fresh.

### GitHub Secrets & Variables

Go to your repository → **Settings → Secrets and variables → Actions** and add the following:

#### Secrets

| Name                    | Description                                                            |
| ----------------------- | ---------------------------------------------------------------------- |
| `CLOUDFLARE_API_TOKEN`  | A Cloudflare API token with **Workers Scripts: Edit** permission       |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID (found in the Cloudflare dashboard sidebar) |

#### Variables

| Name                   | Required | Description                             |
| ---------------------- | -------- | --------------------------------------- |
| `GOATCOUNTER_ENDPOINT` | No       | Your GoatCounter analytics endpoint URL |

### Deployment behaviour

- Pushes to `main` → deployed to production
- Pushes to any other branch → uploaded as a staged version (not promoted to production)
