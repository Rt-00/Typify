# Typify

Convert JSON into strongly-typed definitions. Paste raw JSON, pick a target language, get production-ready code instantly — no backend, no requests, everything runs in the browser.

## Supported targets

| Target     | Output                                    |
|------------|-------------------------------------------|
| TypeScript | `interface` definitions                   |
| Rust       | `struct` with `serde` derives             |
| Go         | `struct` with `json` tags                 |
| Java       | POJO with Lombok annotations              |
| Zod        | `z.object(...)` schema + inferred type    |
| OpenAPI    | `components/schemas` YAML block           |

## Features

- **Monaco Editor** input with real-time JSON validation
- **Shiki** syntax highlighting on the output
- Instant tab switching — AST is cached, no re-parsing
- Copy to clipboard + Download file per target
- Handles nested objects, optional fields, mixed arrays, special-character keys
- 112 tests, 91%+ coverage — generators are pure functions with no side effects

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Scripts

| Command               | Description                          |
|-----------------------|--------------------------------------|
| `npm run dev`         | Start development server             |
| `npm run build`       | Type-check + production build        |
| `npm run test`        | Run test suite                       |
| `npm run test:watch`  | Run tests in watch mode              |
| `npm run test:coverage` | Run tests with coverage report     |

## Architecture

```
src/
├── core/
│   ├── types.ts        # JsonNode AST types
│   ├── parse.ts        # JSON string → JsonNode
│   ├── infer.ts        # Type inference, optional detection, array merging
│   └── naming.ts       # PascalCase, snake_case, sanitizeKey helpers
├── generators/
│   ├── typescript.ts
│   ├── rust.ts
│   ├── go.ts
│   ├── java.ts
│   ├── zod.ts
│   └── openapi.ts
└── components/
    ├── JsonInput.tsx   # Monaco Editor wrapper
    ├── TargetTabs.tsx  # Language selector
    ├── OutputPanel.tsx # Highlighted output + copy/download
    └── ErrorBanner.tsx # Parse error display
```

The pipeline is: `JSON string → parse → AST → generator(target) → code string`. Generators never touch the raw JSON string — they only receive the typed AST.

## Tech stack

- React 18 + TypeScript
- Vite
- Monaco Editor
- Shiki
- Tailwind CSS
- Vitest + @vitest/coverage-v8
