# @hina-is/bestdori

Internal package for gathering and processing game data.

This package pre-processes data at build time for the website. It is an internal workspace package and is not intended to be run on a server.

## How it works

- **Data gathering**: Pulls information and assets from external sources
- **Local caching**: Saves data locally to speed up builds
- **Data processing**: Normalizes and structures data for the site
- **Static exports**: Generates files consumed by the site at build time

## Commands

Run from this directory:

| Command                   | Description                               |
| ------------------------- | ----------------------------------------- |
| `bun run generate-data`   | Refresh local data from external sources  |
| `bun run generate-styles` | Generate style definitions from game data |

> [!TIP]
> You can also run `bun prebuild` from the repository root.

## Exports

| Export path                   | What it exports                                                        |
| ----------------------------- | ---------------------------------------------------------------------- |
| `@hina-is/bestdori`           | Cached fetch helpers for the Bestdori API                              |
| `@hina-is/bestdori/assets`    | URL helpers for Bestdori CDN assets                                    |
| `@hina-is/bestdori/constants` | Shared constants                                                       |
| `@hina-is/bestdori/data`      | The pre-built game data (automatically aggregated from all categories) |
| `@hina-is/bestdori/utilities` | Small utility helpers used internally                                  |

## Cache directory

Cached responses are stored in `.bestdori-cache/` at the repo root. This folder is gitignored but preserved in CI between runs so builds stay fast.

## License

This project is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**. See the [LICENSE](../../LICENSE) file for the full text.

> [!IMPORTANT]
> **Legal Disclaimer:**
> This project is a fan-made site and is not affiliated with or endorsed by Bushiroad, Craft Egg, or the BanG Dream! franchise. All game assets, characters, and data are copyright of their respective owners. The AGPL-3.0 license applies only to the custom code contained in this repository.
