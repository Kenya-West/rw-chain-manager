# AGENTS

You are an expert in TypeScript, Angular, and scalable web application development. You write functional, maintainable, performant, and accessible code following Angular and TypeScript best practices.

## Windows-specific

- You are on Windows. Use `pwsh` and PowerShell 7+ commands to interact with repository

## TypeScript Best Practices

- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain

## Angular Best Practices

- Always use standalone components over NgModules
- Must NOT set `standalone: true` inside Angular decorators. It's the default in Angular v20+.
- Use signals for state management
- Implement lazy loading for feature routes
- Do NOT use the `@HostBinding` and `@HostListener` decorators. Put host bindings inside the `host` object of the `@Component` or `@Directive` decorator instead
- Use `NgOptimizedImage` for all static images.
    - `NgOptimizedImage` does not work for inline base64 images.

## Accessibility Requirements

- It MUST pass all AXE checks.
- It MUST follow all WCAG AA minimums, including focus management, color contrast, and ARIA attributes.

### Components

- Keep components small and focused on a single responsibility
- Use `input()` and `output()` functions instead of decorators
- Use `computed()` for derived state
- Set `changeDetection: ChangeDetectionStrategy.OnPush` in `@Component` decorator
- Prefer Reactive forms instead of Template-driven ones
- Do NOT use `ngClass`, use `class` bindings instead
- Do NOT use `ngStyle`, use `style` bindings instead
- When using external templates/styles, use paths relative to the component TS file.

## State Management

- Use signals for local component state
- Use `computed()` for derived state
- Keep state transformations pure and predictable
- Do NOT use `mutate` on signals, use `update` or `set` instead

## Templates

- Keep templates simple and avoid complex logic
- Templates must be in separate HTML file for better developer experience
- Custom styles should be written in SCSS and kept in separate SCSS file
- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`
- Use the async pipe to handle observables
- Do not assume globals like (`new Date()`) are available.

## Services

- Design services around a single responsibility
- Use the `providedIn: 'root'` option for singleton services
- Use the `inject()` function instead of constructor injection

---

# RW Chain Manager Instructions

## Product Domain

- This project manages Remnawave proxy chains.
- A proxy chain is an ordered path through VPS nodes (for example: user -> Russian VPS -> non-Russian VPS, or user -> non-Russian VPS -> Russian VPS).
- Remnawave nodes are VPS instances.
- Remnawave hosts are URL addresses used by VPN client apps.
- Routing behavior is configured in Remnawave Config entities via VLESS route IDs that map inbound to outbound.

## API Sources Of Truth

- Primary contract source: `src/assets/remnawave-api.json`.
- Secondary reference: https://docs.rw/api/.
- Prefer generated/typed contracts from the local API spec over inferred field names.
- Keep API field names and enum usage aligned with the spec where practical.

## Implementation Expectations

- Keep business logic for chain detection/creation/modification explicit and easy to reason about.
- Preserve clear naming around chain direction, entry node, exit node, and route IDs.
- Validate route mapping inputs before sending API mutations whenever it improves safety and clarity.
- When changing routing logic, document non-obvious assumptions near the transformation.

## Review Focus

- Correctness of chain ordering and route-ID mapping.
- API payload and response compatibility with remnawave-api.json.
- Regression risk for censorship-bypass routing scenarios.
- Accessibility and maintainability of UI changes that expose chain operations.
