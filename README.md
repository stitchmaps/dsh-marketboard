# dsh-marketboard

[中文](README.zh.md) | **English**

A focused **real-time quote board** for DeepSeek Harness. It puts A-shares, Hong Kong and US stocks, FX majors and crosses, domestic/international commodity futures and global indices into one clean watchlist — **lists and live prices only, no charts**.

The UI is a native DSH Client plugin: it follows the active light/dark theme, uses the Harness locale service, and persists the watchlist on the host side.

## Highlights

- **One board, six markets** — A-shares, Hong Kong, US, FX, commodity futures and indices. Filter by group, search inside the watchlist and sort by move.
- **Live by default** — 3/5/10/30/60-second auto-refresh, pause/resume, manual refresh, and stale-quote markers when an upstream source hiccups.
- **A useful watchlist** — 49 curated instruments on first run; star to pin, remove with one click, add through search or a manual code form.
- **Custom groups** — keep instruments from different markets in one named collection. Create, rename, delete and tick members; A-shares / Hong Kong / US / FX / futures / indices remain immutable default groups.
- **A real dashboard, not a table dump** — breadth/up-down counts, average move, top gainer/loser, last update, day-range position, open and previous close.
- **Made for the Harness** — theme tokens only for UI colour, localized (zh/en), responsive, and built with local React controls (no Harness Client package imports).
- **Host-side persistence** — `<DSH_HOME>/dsh-marketboard/data.json` with atomic writes, a `.bak` fallback and the latest 20 timestamped backups. No localStorage.

## Markets and symbols

| Group | Markets | Default examples |
|---|---|---|
| A-shares | `cn` | 600519 贵州茅台, 300750 宁德时代, 002594 比亚迪 |
| Hong Kong | `hk` | 00700 腾讯控股, 09988 阿里巴巴-W, 03690 美团-W |
| US | `us` | AAPL, NVDA, MSFT, TSLA, AMZN, META |
| FX | `fx` | USDCNH, EURUSD, GBPUSD, USDJPY, EURJPY, GBPJPY, AUDJPY … |
| Commodity futures | `futcn`, `futgl` | RB0, CU0, AU0, AG0, SC0, M0, I0, TA0; CL=F, GC=F |
| Indices | `index` | 上证指数, 深证成指, 创业板指, 恒生指数, 标普500, 纳斯达克, 道琼斯, 日经225 |

Manual code formats:

- A-share `600519` or `sh600519` / `sz000001`
- Hong Kong `00700` or `700`
- US `AAPL`, `BRK.B`
- FX `EURUSD`, `EUR/USD`, `EURUSD=X`
- Domestic futures `RB0` (main continuous), `RB` (auto `RB0`), or a contract code
- International futures `CL`, `CL=F`
- Index `sh000001`, `sz399001`, `^GSPC`, `^HSI`

## Data sources

All endpoints are public and require **no API key or account**.

| Asset | Primary | Fallback |
|---|---|---|
| A-shares / HK / US stocks / A-share indices | Tencent `qt.gtimg.cn` (batch) | Sina `hq.sinajs.cn` |
| FX (majors + crosses) | Sina `fx_s*` (batch) | Yahoo Finance chart |
| Domestic commodity futures | Sina `nf_*` (batch) | — |
| International commodity futures | Sina `hf_*` | Yahoo Finance chart |
| Global indices | Sina `int_*` | Yahoo Finance chart |

The host fetches all primary quotes in at most two batched requests per refresh, then only falls back for symbols that are still missing. Last successful quotes are cached for 15 minutes and marked as stale when reused.

> Quotes may be delayed, incomplete or temporarily unavailable. This plugin is read-only and **does not place orders**.

## Install

This repository is a DSH bundle (`dsh.bundle.patch` + `dsh.client`).

### Option A — DSH CLI

```bash
dsh plugin --profile desktop add file:/absolute/path/to/dsh-marketboard
```

### Option B — Plugin Manager

Add the repository folder as a local bundle in the DSH Plugin Manager, then enable it.

After installation, **refresh the DSH Web GUI** (`Ctrl+R`). If the host half was already loaded, reload the profile patch (remove and re-add the `dsh-marketboard` insert row) or restart the desktop app once.

## Usage

1. Open **Marketboard** in the left navigation.
2. Use the group chips to switch markets or custom groups. Default market groups are automatic and cannot be deleted.
3. Press **New group** to create a custom collection, then tick its members; use **Manage** to rename or delete custom groups.
4. Press **Add symbol** to search by name/ticker or to enter a code manually. When a custom group is active, new symbols are added to that group too.
5. Hover a row: the star pins it to the top, the `×` removes it.
6. Pause automatic refresh from the toolbar; refresh manually at any time.
7. Open **Settings** to change refresh interval, up/down colours (red-up/green-down or the reverse) and density.

## Architecture

| Half | File | Responsibility |
|---|---|---|
| Host | `lib/index.js` | Cordis plugin; registers `/api/dsh-marketboard/state`, `/quotes` and `/search`; owns persistence, validation and all upstream fetching |
| Client | `lib/client.js` | DSH `__ModuleLoader__` CJS factory; registers `main` (keyed panel) and `sidebar.panellist` (nav row); renders the React UI |

Browser calls use relative paths (`api/dsh-marketboard/...`), which works with the IPC-backed fetch used by the DSH desktop Web GUI.

### Host API

All routes are `POST` JSON.

| Route | Body | Description |
|---|---|---|
| `/api/dsh-marketboard/state` | `{op:'get'}` | Load watchlist + settings |
| | `{op:'add', item:{market,code,name?}}` | Add and normalize an instrument |
| | `{op:'remove', id}` | Remove an instrument |
| | `{op:'favorite', id}` | Toggle pin |
| | `{op:'saveSettings', settings}` | Persist preferences |
| | `{op:'resetWatchlist'}` | Restore the built-in default list, keeping settings and custom groups (members still present are kept) |
| | `{op:'addGroup', name}` | Create a custom group |
| | `{op:'renameGroup', id, name}` | Rename a custom group |
| | `{op:'deleteGroup', id}` | Delete a custom group (instruments stay watched) |
| | `{op:'setGroupItems', id, itemIds}` | Set custom group members |
| `/api/dsh-marketboard/quotes` | `{}` | Fetch current quotes for the watchlist |
| `/api/dsh-marketboard/search` | `{q, group}` | Search the built-in catalog and Tencent stock search |

The host validates and canonicalizes every write; the browser never picks its own IDs. The watchlist, settings and custom groups live in the local data file; default market groups are implicit and cannot be changed or deleted.

## Compatibility

- DSH `>= 0.2.0-rc.2 || >= 0.2.1-rc.2` (verified against the current desktop build)
- Node `^22.19.0 || >= 24.0.0`
- Web GUI platform

## Privacy

- No account, cookies or API keys.
- No telemetry.
- Only public quote/search endpoints are contacted by the host; the browser only talks to the local DSH API.
- Watchlist and settings never leave the machine.

## Disclaimer

The quotes are aggregated from public endpoints for personal reference only. They are not guaranteed to be accurate, complete or real-time and **do not constitute investment advice**. You are responsible for complying with the terms of the upstream data providers and for any decisions you make.

## License

MIT © 2026 gary
