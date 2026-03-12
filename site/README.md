# @hina-is/site

The front-end website for **hina-is** — a BanG Dream! fan site showing various game data and assets.

Built with [Astro](https://astro.build) and deployed as a [Cloudflare Worker](https://workers.cloudflare.com/). Game data is provided by the sibling `@hina-is/bestdori` package which pre-fetches everything from Bestdori at build time.

## Features

Browse and filter through different categories of BanG Dream! game data and assets.

## Tech stack

| Category      | Tools                                                                                                     |
| ------------- | --------------------------------------------------------------------------------------------------------- |
| Framework     | [Astro](https://astro.build) + [Cloudflare Workers](https://workers.cloudflare.com/)                      |
| Styling       | [Tailwind CSS](https://tailwindcss.com) + [daisyUI](https://daisyui.com)                                  |
| UI & Logic    | [Preact](https://preactjs.com) (Signals), [htmx](https://htmx.org), and [Iconify](https://iconify.design) |
| Data & Search | [Orama](https://orama.com) + [Upstash Redis](https://upstash.com)                                         |
| Utilities     | [Day.js](https://day.js.org), [Zod](https://zod.dev), and various helpers                                 |

## Setup

Refer to the [root README](../README.md#setup) for general prerequisites, installation steps, and environment variable configuration.

> [!NOTE]
> The `.env` file in this directory is symlinked from the repo root.

## Commands

Run from inside the `site/` directory:

| Command           | Description                                       |
| ----------------- | ------------------------------------------------- |
| `bun run dev`     | Start local dev server at `http://localhost:4321` |
| `bun run build`   | Build the site for production to `./dist/`        |
| `bun run preview` | Preview the production build locally              |
| `bun run check`   | Run Astro type checking                           |

## Project structure

```
site/
├── src/
│   ├── actions/          # App logic
│   ├── components/       # Reusable components
│   ├── layouts/          # Page layouts
│   ├── lib/              # Helper functions
│   ├── middleware.ts     # Global logic
│   ├── pages/            # Site content
│   └── styles/           # Site styling
├── public/               # Assets
├── astro.config.mjs      # Project configuration
└── wrangler.jsonc        # Deployment configuration
```

## Deployment

Refer to the [root README](../README.md#deployment-cloudflare-workers-via-github-actions) for deployment instructions.

## License

This project is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**. See the [LICENSE](../LICENSE) file for the full text.

> [!IMPORTANT]
> **Legal Disclaimer:**
> This project is a fan-made site and is not affiliated with or endorsed by Bushiroad, Craft Egg, or the BanG Dream! franchise. All game assets, characters, and data are copyright of their respective owners. The AGPL-3.0 license applies only to the custom code contained in this repository.
