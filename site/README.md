# @hina-is/site

The front-end website for **hina-is** — a BanG Dream! fan site showing various game data and assets.

Built with [Astro](https://astro.build) and deployed as a [Cloudflare Worker](https://workers.cloudflare.com/). Game data is provided by the sibling `@hina-is/bestdori` package which pre-fetches everything from Bestdori at build time.

## Features

Browse and filter through different categories of BanG Dream! game data and assets.

## Tech stack

| Thing         | Tool                                                                                                                         |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Framework     | [Astro](https://astro.build) (server output)                                                                                 |
| Styling       | [Tailwind CSS v4](https://tailwindcss.com) + [daisyUI](https://daisyui.com)                                                  |
| Filtering     | [Orama](https://orama.com)                                                                                                   |
| Runtime       | [Cloudflare Workers](https://workers.cloudflare.com/) via `@astrojs/cloudflare`                                              |
| Dates         | [Day.js](https://day.js.org)                                                                                                 |
| Icons         | [Iconify](https://iconify.design) ([Lucide](https://lucide.dev), [SVG Spinners](https://github.com/n3r4zzurr0/svg-spinners)) |
| Interactivity | [htmx](https://htmx.org)                                                                                                     |

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
│   │   ├── index.astro          # Home page
│   │   └── page/                # Dynamic content pages and views
│   └── styles/                  # Global styling (CSS/Tailwind)
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

## License

This project is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**. See the [LICENSE](../LICENSE) file for the full text.

> [!IMPORTANT]
> **Legal Disclaimer:**
> This project is a fan-made site and is not affiliated with or endorsed by Bushiroad, Craft Egg, or the BanG Dream! franchise. All game assets, characters, and data are copyright of their respective owners. The AGPL-3.0 license applies only to the custom code contained in this repository.
