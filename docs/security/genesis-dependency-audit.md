# Project Genesis Dependency Audit

Audit date: 2026-07-21

Scope:

- `three@0.170.0`
- `@react-three/fiber@8.17.10`
- `@react-three/drei@9.120.5`
- `gsap@3.12.5`
- Existing Next.js, React, Framer Motion, Lucide, OpenAI, and Tailwind stack

## Commands Run

| Command | Result |
| --- | --- |
| `npm.cmd audit --json` | Failed because the environment blocked the live npm registry advisory request. |
| `npm.cmd audit --offline --json` | Completed successfully with `0` vulnerabilities from the local advisory/cache data. |
| `npm.cmd outdated --json` | Failed because the environment blocked registry access for package metadata. |
| `npm.cmd ls three @react-three/fiber @react-three/drei gsap --depth=0` | Confirmed installed package versions. |

## Verified Local Audit Result

The offline audit result reported no current vulnerabilities:

| Severity | Count |
| --- | ---: |
| Critical | 0 |
| High | 0 |
| Moderate | 0 |
| Low | 0 |
| Info | 0 |

Dependency totals from the offline audit:

- Production dependencies: 145
- Development dependencies: 367
- Optional dependencies: 38
- Total dependencies: 520

## Live Registry Limitation

The live npm advisory endpoint could not be reached from this environment:

```text
request to https://registry.npmjs.org/-/npm/v1/security/advisories/bulk failed
```

`npm outdated --json` was also blocked while attempting to fetch package metadata:

```text
FetchError: request to https://registry.npmjs.org/@react-three%2fdrei failed
```

Because the live registry checks were unavailable, no registry-only advisory details could be classified beyond the successful local/offline audit result.

## Finding Classification

| Package | Dependency type | Severity | Exposure | Remediation |
| --- | --- | --- | --- | --- |
| `three@0.170.0` | Direct production dependency | No offline advisory found | Browser-only 3D rendering at `/`; no secret or server execution exposure | No action required from local audit. Re-run live audit in CI. |
| `@react-three/fiber@8.17.10` | Direct production dependency | No offline advisory found | Browser React renderer for the Genesis canvas | No action required from local audit. Re-run live audit in CI. |
| `@react-three/drei@9.120.5` | Direct production dependency | No offline advisory found | Browser helper components for sky, environment, float and particles | No action required from local audit. Re-run live audit in CI. |
| `gsap@3.12.5` | Direct production dependency | No offline advisory found | Browser animation sequencing only | No action required from local audit. Re-run live audit in CI. |

## Remediation Taken

- No forced dependency updates were applied.
- No `npm audit fix --force` was run.
- The Genesis implementation was hardened to reduce dependency/runtime risk:
  - WebGL availability check before rendering.
  - Error boundary around the 3D experience.
  - Branded fallback when the canvas fails or times out.
  - Device-aware visual quality levels to reduce GPU load.
  - Rendering reduction when the tab is hidden.

## Deferred Remediation

- Run `npm audit --json` in CI or a network-enabled production-like environment.
- Run `npm outdated --json` in CI or a network-enabled production-like environment.
- If live advisories appear, prefer non-breaking patch/minor upgrades first.
- Do not upgrade React Three Fiber to the React 19 line until the application itself is intentionally upgraded to React 19.

## Recommended Follow-Up

1. Add a CI job that runs `npm audit --audit-level=moderate` with registry access.
2. Track package updates for `three`, `@react-three/fiber`, `@react-three/drei`, and `gsap` monthly.
3. Keep 3D dependencies isolated to Project Genesis until the Digital Twin sprint begins.
