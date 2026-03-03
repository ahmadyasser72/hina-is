# @hina-is/bestdori

This package is responsible for fetching, caching, validating, and exporting game data from [Bestdori](https://bestdori.com) — the community API for BanG Dream!.

It is an internal workspace package consumed by the `@hina-is/site` package at build time. You do **not** run this on a server; it runs once during the build to produce a static `data.js` file.

## How it works

1. **Fetch** — Pulls various game data and assets from the Bestdori API
2. **Cache** — Saves responses locally so they don't need to be re-fetched on every build
3. **Validate** — Checks the data matches the expected shape
4. **Transform** — Normalizes and links related data together
5. **Write** — Saves everything to a single file that the site imports at build time

## Scripts

Run from this directory **or** from the repo root using `bun --filter`:

| Command          | What it does                                                 |
| ---------------- | ------------------------------------------------------------ |
| `bun run update` | Fetches fresh data from Bestdori and rewrites `src/data.js`  |
| `bun run styles` | Generates CSS utility classes from band/attribute color data |

From the **repo root** you can also use:

```sh
bun update-data
```

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
