# Typify

## Product Overview

A developer tool that takes raw JSON as input and generates strongly-typed definitions across multiple languages and schema formats. Paste JSON, pick your target, get production-ready types instantly.

---

## Features

### Supported Output Targets

| Target       | Output                                      |
|--------------|---------------------------------------------|
| TypeScript   | `interface` and `type` definitions          |
| Rust         | `struct` with `serde` derives               |
| Go           | `struct` with `json` tags                   |
| Java         | POJO classes with Lombok or plain getters   |
| Zod          | `z.object(...)` schema with inferred types  |
| OpenAPI      | `components/schemas` YAML block             |

---

## Core Behavior

### Input
- Accept raw JSON (object or array)
- Validate JSON before processing
- Infer types from values:
  - `string`, `number`, `boolean`, `null`, `array`, `object`
  - Distinguish `integer` vs `float` when possible
  - Handle nested objects recursively
  - Handle arrays of mixed or uniform types

### Output Rules
- Generate idiomatic, production-ready code for each target
- Use PascalCase for type/struct/class names
- Derive root name from context or default to `Root`
- Nested objects become separate named types
- Optional fields: inferred when value is `null` or key is absent in array items
- Arrays: typed as `T[]`, `Vec<T>`, `[]T`, `List<T>`, etc. per language

---

## Generation Specs Per Target

### TypeScript
- `interface` for objects
- Union types for mixed arrays (`string | number`)
- `?` suffix for optional fields
- Export all interfaces

```ts
export interface Root {
  id: number;
  name: string;
  tags?: string[];
}
```

### Rust
- `#[derive(Debug, Serialize, Deserialize)]`
- `Option<T>` for nullable/optional fields
- `snake_case` field names with `#[serde(rename = "...")]` if needed

```rust
#[derive(Debug, Serialize, Deserialize)]
pub struct Root {
    pub id: u64,
    pub name: String,
    pub tags: Option<Vec<String>>,
}
```

### Go
- Exported struct fields (PascalCase)
- `json:"fieldName"` tags
- `omitempty` for optional fields
- Pointer types (`*string`) for nullable fields

```go
type Root struct {
    ID   int64    `json:"id"`
    Name string   `json:"name"`
    Tags []string `json:"tags,omitempty"`
}
```

### Java
- Plain POJO or Lombok (`@Data`, `@Builder`)
- `@JsonProperty` annotations
- Wrapper types for nullability (`Integer` vs `int`)
- Nested classes as inner static classes or separate files

```java
@Data
public class Root {
    @JsonProperty("id")
    private Long id;

    @JsonProperty("name")
    private String name;

    @JsonProperty("tags")
    private List<String> tags;
}
```

### Zod
- `z.object({})` schema
- `.optional()` for nullable/optional fields
- `.array()` for arrays
- Export schema + inferred TypeScript type

```ts
export const RootSchema = z.object({
  id: z.number(),
  name: z.string(),
  tags: z.array(z.string()).optional(),
});

export type Root = z.infer<typeof RootSchema>;
```

### OpenAPI
- YAML format under `components/schemas`
- `type`, `properties`, `required` array
- `$ref` for nested objects
- `nullable: true` for optional/null fields

```yaml
components:
  schemas:
    Root:
      type: object
      required:
        - id
        - name
      properties:
        id:
          type: integer
        name:
          type: string
        tags:
          type: array
          items:
            type: string
```

---

## UX Guidelines

- Single input area for JSON (with syntax highlighting)
- Target selector: tabs or dropdown per language
- Copy-to-clipboard button per output
- Inline error messages for invalid JSON
- Show inferred field types as tooltips on hover (optional enhancement)
- "Reset" button to clear input and output

---

## Edge Cases to Handle

- Empty object `{}` → generate empty type with comment
- Empty array `[]` → `unknown[]` / `Vec<serde_json::Value>` / etc.
- Deeply nested objects → flatten into named types with `_` or hierarchy
- Array of objects → infer union of all keys across items, mark missing as optional
- Keys with special characters → sanitize and add rename annotations
- `null` values → treat field as optional with inferred type from sibling items if available

---

## Tech Stack Suggestion

- **Frontend**: React + Monaco Editor (JSON input) + Shiki or Prism (output highlighting)
- **Logic**: Pure TypeScript — stateless transformation functions per target
- **No backend required** — all generation happens client-side
- **Claude API** (optional): for ambiguous type inference or natural language hints like "treat `id` as UUID"

---

## File Structure

```
src/
├── parsers/
│   └── jsonParser.ts        # JSON → intermediate AST
├── generators/
│   ├── typescript.ts
│   ├── rust.ts
│   ├── go.ts
│   ├── java.ts
│   ├── zod.ts
│   └── openapi.ts
├── utils/
│   ├── naming.ts            # camelCase, PascalCase, snake_case helpers
│   └── typeInference.ts     # value → type mapping
├── components/
│   ├── JsonInput.tsx
│   ├── TargetSelector.tsx
│   └── OutputPanel.tsx
└── App.tsx
```

---

## Commit Guidelines

### Commits por Feature
- Cada commit deve representar **uma feature completa e funcional** — nunca commitar trabalho pela metade
- Exemplos de granularidade correta:
  - ✅ `feat: add TypeScript generator with nested object support`
  - ✅ `feat: add Rust generator with serde derives`
  - ✅ `test: add integration tests for Go generator`
  - ✅ `fix: handle empty array edge case in all generators`
  - ❌ `wip: typescript` — nunca commitar WIP
  - ❌ `feat: add all generators` — granularidade grande demais

### Pré-condição Obrigatória para Commit
**Só commitar se todos os testes passarem e a cobertura estiver acima de 80%.** Rodar obrigatoriamente antes de cada commit:

```bash
vitest run --coverage
```

Se qualquer teste falhar ou a cobertura cair abaixo do threshold, o commit deve ser bloqueado.

### Git Hooks
Configurar o **pre-commit hook** via `simple-git-hooks` + `nano-staged` para garantir isso automaticamente:

```ts
// package.json
{
  "simple-git-hooks": {
    "pre-commit": "npx nano-staged"
  },
  "nano-staged": {
    "*.ts": "vitest run --coverage"
  }
}
```

### Padrão de Mensagem (Conventional Commits)
```
<type>(<scope>): <descrição curta em inglês>
```

| Type | Quando usar |
|------|-------------|
| `feat` | Nova feature ou generator |
| `fix` | Correção de bug |
| `test` | Adição ou correção de testes |
| `refactor` | Refatoração sem mudança de comportamento |
| `chore` | Config, deps, CI |
| `docs` | Documentação |

---

## Testing Strategy

### Unit Tests
- Cada generator (`typescript.ts`, `rust.ts`, etc.) deve ter seu próprio arquivo de testes
- Testar ao menos os seguintes casos por generator:
  - Objeto simples com tipos primitivos
  - Objeto com campos opcionais/nullable
  - Objeto com array de primitivos
  - Objeto com array de objetos (tipos aninhados)
  - Objeto profundamente aninhado
  - Chaves com caracteres especiais
  - Array vazio e objeto vazio
- Testar o parser (`parse.ts`) e o inferidor (`infer.ts`) de forma isolada
- Testar os helpers de naming (`toPascalCase`, `toSnakeCase`, `sanitizeKey`)

### Integration Tests
- Testar o pipeline completo: `JSON string → AST → output por target`
- Usar fixtures de JSON reais (ex: resposta de uma API REST, package.json, config de CI)
- Validar que o output gerado é sintaticamente correto para cada linguagem:
  - TypeScript: compilar com `tsc --noEmit`
  - Rust: validar estrutura com parser de AST
  - Zod: executar o schema gerado e checar que `z.parse()` aceita o JSON original
  - OpenAPI: validar com `@apidevtools/swagger-parser`

### Code Coverage
- Cobertura mínima obrigatória: **80% em linhas, funções e branches**
- Configurar o threshold no `vitest.config.ts`:

```ts
coverage: {
  thresholds: {
    lines: 80,
    functions: 80,
    branches: 80,
  }
}
```
- Rodar cobertura com: `vitest run --coverage`
- CI deve **falhar** se a cobertura cair abaixo do threshold

### Ferramentas
- **Vitest** para unit e integration tests
- **@vitest/coverage-v8** para code coverage
- Estrutura de arquivos de teste:

```
src/
├── core/
│   ├── parse.test.ts
│   ├── infer.test.ts
│   └── naming.test.ts
├── generators/
│   ├── typescript.test.ts
│   ├── rust.test.ts
│   ├── go.test.ts
│   ├── java.test.ts
│   ├── zod.test.ts
│   └── openapi.test.ts
└── __fixtures__/
    ├── simple.json
    ├── nested.json
    ├── array-of-objects.json
    └── edge-cases.json
```

---

## Future Targets (Backlog)

- Python (`TypedDict`, `dataclass`, Pydantic)
- C# (`class` with `JsonProperty`)
- Kotlin (`data class`)
- GraphQL SDL
- Protobuf `.proto`
- JSON Schema
