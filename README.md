# hina-is

A fan site for [BanG Dream!](https://en.wikipedia.org/wiki/BanG_Dream!) that shows various content and assets from the game. Data is pulled live from [Bestdori](https://bestdori.com) (the community BanG Dream! API), processed and bundled at build time, then served as a [Cloudflare Worker](https://workers.cloudflare.com/).

## What's inside

This is a monorepo with two packages:

| Package             | Path                 | What it does                                                               |
| ------------------- | -------------------- | -------------------------------------------------------------------------- |
| `@hina-is/bestdori` | `packages/bestdori/` | Fetches and caches game data from Bestdori for use in the site             |
| `@hina-is/site`     | `site/`              | The website — renders various game data and assets, deployed to Cloudflare |

## Project structure

```
.
├── .github/          # CI/CD workflows and automation
├── packages/
│   └── bestdori/     # Internal logic for data fetching and processing
├── site/             # Frontend website and application logic
└── package.json      # Monorepo configuration and scripts
```

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

| Variable                   | Required | Description                                                                                                                |
| -------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------- |
| `GOATCOUNTER_ENDPOINT`     | No       | URL to your [GoatCounter](https://www.goatcounter.com/) analytics endpoint (e.g. `https://yoursite.goatcounter.com/count`) |
| `UPSTASH_REDIS_REST_URL`   | Yes      | REST URL for your [Upstash Redis](https://upstash.com/redis) database (used for sharing character sorter results)          |
| `UPSTASH_REDIS_REST_TOKEN` | Yes      | REST token for your Upstash Redis database                                                                                 |

### 3. Run locally

```sh
# Fetch data from Bestdori and start the dev server
bun prebuild
bun dev
```

The site will be available at `http://localhost:4321`.

## Scripts

Run these from the **repo root**:

| Command                | Description                                           |
| ---------------------- | ----------------------------------------------------- |
| `bun dev`              | Starts the development server                         |
| `bun prebuild`         | Runs checks and fetches the latest data from Bestdori |
| `bun build`            | Builds the site for production                        |
| `bun run check`        | Runs type checks across all workspaces                |
| `bun run format:check` | Verifies code formatting                              |
| `bun format`           | Formats all files with Prettier                       |

## Deployment (Cloudflare Workers via GitHub Actions)

The site is automatically deployed to Cloudflare Workers on every push to `main`. The pipeline also runs on a schedule (every hour) to keep the data fresh.

### GitHub Secrets & Variables

Go to your repository → **Settings → Secrets and variables → Actions** and add the following:

#### Secrets

| Name                       | Description                                                            |
| -------------------------- | ---------------------------------------------------------------------- |
| `CLOUDFLARE_API_TOKEN`     | A Cloudflare API token with **Workers Scripts: Edit** permission       |
| `CLOUDFLARE_ACCOUNT_ID`    | Your Cloudflare account ID (found in the Cloudflare dashboard sidebar) |
| `UPSTASH_REDIS_REST_URL`   | Your Upstash Redis REST URL                                            |
| `UPSTASH_REDIS_REST_TOKEN` | Your Upstash Redis REST token                                          |

#### Variables

| Name                   | Required | Description                             |
| ---------------------- | -------- | --------------------------------------- |
| `GOATCOUNTER_ENDPOINT` | No       | Your GoatCounter analytics endpoint URL |

### Deployment behaviour

- Pushes to `main` → deployed to production
- Pushes to any other branch → uploaded as a staged version (not promoted to production)

## Credits & Attribution

- Icons: [Lucide](https://lucide.dev) (ISC) and [SVG Spinners](https://github.com/n3r4zzurr0/svg-spinners) (MIT) provided via [Iconify](https://iconify.design).
- Data API: [Bestdori](https://bestdori.com).
- Game Assets: All original game assets, art, and characters are property of **Bushiroad** and **Craft Egg**.

## License

This project is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**. See the [LICENSE](LICENSE) file for the full text.

> [!IMPORTANT]
> **Legal Disclaimer:**
> This project is a fan-made site and is not affiliated with or endorsed by Bushiroad, Craft Egg, or the BanG Dream! franchise. All game assets, characters, and data are copyright of their respective owners. The AGPL-3.0 license applies only to the custom code contained in this repository.
