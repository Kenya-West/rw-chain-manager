# RW Chain Manager

A web-based diagnostic and management interface for [Remnawave](https://github.com/remnawave) proxy chains. Detects, visualizes, and troubleshoots proxy chain configurations across VPS nodes.

## What It Does

RW Chain Manager connects to a Remnawave panel via its API and provides tools to:

- **Detect proxy chains** by resolving host domains to node IPs, following XRay routing rules and outbound configs to build a visual chain map
- **Diagnose chain health** with a 6-step validation pipeline that checks VLESS route IDs, config profile assignments, routing consistency, outbound targets, and host states
- **Show affected squads** (internal and external) for a given chain configuration
- **Manage multiple connections** to different Remnawave panels, with profile import/export

### Proxy Chain Concept

A proxy chain is an ordered path through VPS nodes:

```
User -> Host (domain) -> Node A (entry) -> [routing rule] -> Outbound -> Node B (exit) -> Internet
```

The chain is defined by:

1. A **Host** with a VLESS route ID
2. The Host's domain resolving to a **Node**'s IP address
3. The Node's **Config Profile** containing routing rules that match the VLESS route ID
4. Routing rules pointing to **outbounds** whose addresses lead to the next Node

## Pages

| Route             | Page              | Description                                                      |
| ----------------- | ----------------- | ---------------------------------------------------------------- |
| `/dashboard`      | Dashboard         | Connection status overview with quick-action cards               |
| `/connection`     | Connection        | Multi-profile connection manager (save, switch, import/export)   |
| `/chains`         | Proxy Chains      | Detect and visualize all proxy chains, grouped by config profile |
| `/chain-diagnose` | Chain Diagnostics | Validate a specific VLESS route ID + config profile combination  |
| `/about`          | About             | Project info and tech stack                                      |

## Architecture

### Centralized Panel Data

All Remnawave API data flows through a single `PanelDataService` that:

- Fetches hosts, nodes, config profiles (including computed XRay configs), and squads in parallel
- Stores everything in a typed `PanelData` model per connection
- Persists to `localStorage` keyed by connection ID
- Auto-clears when the active connection changes
- Is shared across all pages — no duplicate API calls

```
PanelDataService (singleton)
    |
    +-- PanelData
    |     +-- meta (connectionId, fetchedAt, ...)
    |     +-- hosts[]
    |     +-- nodes[]
    |     +-- configProfiles[]
    |     +-- computedConfigs (Record<uuid, XRayConfig>)
    |     +-- externalSquads[]
    |     +-- internalSquads[]
    |
    +-- Used by:
          +-- ProxyChainService.detectChains(data)
          +-- ChainDiagnoseService.diagnose(routeId, profileUuid, data)
```

### Key Services

| Service                   | Responsibility                                               |
| ------------------------- | ------------------------------------------------------------ |
| `PanelDataService`        | Fetches and caches all Remnawave panel data per connection   |
| `ProxyChainService`       | Detects chains via DNS resolution and XRay config traversal  |
| `ChainDiagnoseService`    | Runs sequential validation checks on a VLESS route + profile |
| `ConnectionConfigService` | Manages connection profiles (multi-profile, localStorage)    |
| `DnsService`              | Resolves domains via Cloudflare DNS-over-HTTPS with caching  |

### DNS Resolution

Chain detection resolves host and outbound domains to IP addresses using [Cloudflare's DNS-over-HTTPS API](https://developers.cloudflare.com/1.1.1.1/encryption/dns-over-https/) (`cloudflare-dns.com/dns-query`). Results are cached in-memory for the session.

## Tech Stack

| Category         | Tool                        | Version |
| ---------------- | --------------------------- | ------- |
| Framework        | Angular                     | 21      |
| UI Components    | Angular Material            | 21      |
| Styling          | Tailwind CSS                | 4       |
| API Contract     | @remnawave/backend-contract | 2.6.x   |
| Unit Testing     | Jest                        | 30      |
| E2E Testing      | Playwright                  | 1.58    |
| Linting          | ESLint                      | 10      |
| Formatting       | Prettier                    | 3.8     |
| i18n             | Transloco                   | 8.2     |
| Documentation    | Compodoc                    | 1.2     |
| Component Dev    | Storybook                   | 10      |
| Containerization | Docker                      | -       |

Angular patterns used throughout:

- Standalone components (no NgModules)
- Signals and `computed()` for state management
- `OnPush` change detection
- Lazy-loaded routes with route animations
- `inject()` function (no constructor injection)

## Quick Start

First, create a Cloudflare worker from [this repository](https://github.com/DAN3002/Cloudflare-CORS-Proxy). This is necessary step to use this project. This helps avoiding CORS errors.

```bash
# Install dependencies
npm install

# Start the development server
npm start
```

Open [http://localhost:4200](http://localhost:4200). Configure a connection to your Remnawave panel on the Connection page.

### Docker

```bash
docker build . -t rw-chain-manager
docker run -p 3000:80 rw-chain-manager
```

## Scripts

| Command              | Description                         |
| -------------------- | ----------------------------------- |
| `npm start`          | Dev server on `localhost:4200`      |
| `npm run build:prod` | Production build with optimizations |
| `npm test`           | Unit tests (Jest)                   |
| `npm run e2e`        | E2E tests (Playwright)              |
| `npm run lint`       | Lint with ESLint                    |
| `npm run prettier`   | Format with Prettier                |
| `npm run storybook`  | Storybook on `localhost:6006`       |
| `npm run compodoc`   | Generate API documentation          |
| `npm run analyze`    | Bundle size analysis                |

## Project Structure

```
src/app/
  pages/
    dashboard/          Dashboard page
    home/               Connection manager (multi-profile)
    proxy-chains/       Chain detection and visualization
    chain-diagnose/     Chain diagnostics with health checks
    about/              About page
  services/
    panel-data.service          Centralized Remnawave data store
    proxy-chain.service         Chain detection logic
    chain-diagnose.service      Diagnostic check pipeline
    connection-config.service   Connection profile management
    dns.service                 DNS-over-HTTPS resolution
    base-api.service            HTTP layer (Fetch API + auth headers)
    api/                        25+ typed API services (hosts, nodes, configs, squads, ...)
  components/
    log-viewer/         Reusable collapsible log viewer
  layout/               Shell layout with Material sidenav
  animations/           Route transition animations
```

## Remnawave API

The app communicates with the Remnawave panel through a CORS proxy. The API contract is defined by `@remnawave/backend-contract` and the local spec at `src/assets/remnawave-api.json`.

Requests flow through `BaseApiService` which handles:

- URL construction via the configured proxy endpoint
- Bearer token authentication
- Optional `X-Api-Key` header for reverse proxy auth
- Forwarded headers (`x-forwarded-for`, `x-forwarded-proto`)

## License

[MIT](LICENSE)
