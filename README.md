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
- 113 tests, 91%+ coverage — generators are pure functions with no side effects

## Example

Given this JSON input:

```json
{
  "id": 1,
  "name": "Alice",
  "active": true,
  "score": 9.5,
  "tags": ["admin", "user"],
  "address": { "city": "Berlin", "zip": "10115" },
  "nickname": null
}
```

<details>
<summary>TypeScript</summary>

```ts
export interface Root {
  id: number;
  name: string;
  active: boolean;
  score: number;
  tags: string[];
  address: RootAddress;
  nickname?: null;
}
export interface RootAddress {
  city: string;
  zip: string;
}
```

</details>

<details>
<summary>Rust</summary>

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Root {
    pub id: i64,
    pub name: String,
    pub active: bool,
    pub score: f64,
    pub tags: Vec<String>,
    pub address: RootAddress,
    pub nickname: Option<serde_json::Value>,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RootAddress {
    pub city: String,
    pub zip: String,
}
```

</details>

<details>
<summary>Go</summary>

```go
package main

type Root struct {
	Id       int64       `json:"id"`
	Name     string      `json:"name"`
	Active   bool        `json:"active"`
	Score    float64     `json:"score"`
	Tags     []string    `json:"tags"`
	Address  RootAddress `json:"address"`
	Nickname interface{} `json:"nickname,omitempty"`
}
type RootAddress struct {
	City string `json:"city"`
	Zip  string `json:"zip"`
}
```

</details>

<details>
<summary>Java</summary>

```java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Root {
    @JsonProperty("id")
    private Long id;

    @JsonProperty("name")
    private String name;

    @JsonProperty("active")
    private Boolean active;

    @JsonProperty("score")
    private Double score;

    @JsonProperty("tags")
    private List<String> tags;

    @JsonProperty("address")
    private RootAddress address;

    @JsonProperty("nickname")
    private Object nickname;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RootAddress {
        @JsonProperty("city")
        private String city;

        @JsonProperty("zip")
        private String zip;
    }
}
```

</details>

<details>
<summary>Zod</summary>

```ts
import { z } from 'zod'

export const RootAddressSchema = z.object({
  city: z.string(),
  zip: z.string(),
})
export type RootAddress = z.infer<typeof RootAddressSchema>

export const RootSchema = z.object({
  id: z.number(),
  name: z.string(),
  active: z.boolean(),
  score: z.number(),
  tags: z.array(z.string()),
  address: RootAddressSchema,
  nickname: z.null().optional(),
})
export type Root = z.infer<typeof RootSchema>
```

</details>

<details>
<summary>OpenAPI</summary>

```yaml
components:
  schemas:
    RootAddress:
      type: object
      required:
        - city
        - zip
      properties:
        city:
          type: string
        zip:
          type: string
    Root:
      type: object
      required:
        - id
        - name
        - active
        - score
        - tags
        - address
      properties:
        id:
          type: integer
          format: int64
        name:
          type: string
        active:
          type: boolean
        score:
          type: number
          format: double
        tags:
          type: array
          items:
            type: string
        address:
          $ref: "#/components/schemas/RootAddress"
        nickname:
          nullable: true
```

</details>

---

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
