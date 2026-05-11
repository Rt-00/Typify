import type { JsonNode } from '../core/types'
import { toPascalCase, toSnakeCase, needsRename } from '../core/naming'

function escapeRustString(s: string): string {
  return [...s].map((ch) => {
    const cp = ch.codePointAt(0)!
    if (ch === '\\') return '\\\\'
    if (ch === '"') return '\\"'
    // ASCII control chars + DEL
    if (cp < 0x20 || cp === 0x7f) return `\\u{${cp.toString(16)}}`
    // C1 control chars
    if (cp >= 0x80 && cp <= 0x9f) return `\\u{${cp.toString(16)}}`
    // Zero-width space / joiner / non-joiner
    if (cp === 0x200b || cp === 0x200c || cp === 0x200d) return `\\u{${cp.toString(16)}}`
    // Bidi override and isolate chars (RTL override, LTR override, etc.)
    if (cp >= 0x202a && cp <= 0x202e) return `\\u{${cp.toString(16)}}`
    if (cp >= 0x2066 && cp <= 0x2069) return `\\u{${cp.toString(16)}}`
    // BOM / zero-width no-break space
    if (cp === 0xfeff) return `\\u{feff}`
    return ch
  }).join('')
}

export function generateRust(root: JsonNode, rootName = 'Root'): string {
  const structs: string[] = []
  resolveType(root, rootName, structs)
  return structs.join('\n\n')
}

function resolveType(node: JsonNode, name: string, out: string[]): string {
  if (node.kind === 'object') {
    const typeName = toPascalCase(name)
    const lines: string[] = [
      '#[derive(Debug, Clone, Serialize, Deserialize)]',
      `pub struct ${typeName} {`,
    ]
    for (const field of node.fields) {
      const rustField = toSnakeCase(field.key)
      const innerType = resolveType(field.node, `${typeName}${toPascalCase(field.key)}`, out)
      const rustType = field.optional ? `Option<${innerType}>` : innerType

      if (needsRename(field.key) || rustField !== field.key) {
        lines.push(`    #[serde(rename = "${escapeRustString(field.key)}")]`)
      }
      lines.push(`    pub ${rustField}: ${rustType},`)
    }
    if (node.fields.length === 0) lines.push('    // empty struct')
    lines.push('}')
    out.unshift(lines.join('\n'))
    return typeName
  }

  if (node.kind === 'array') {
    const inner = resolveType(node.items, name, out)
    return `Vec<${inner}>`
  }

  if (node.kind === 'union') {
    // Rust doesn't have native union types; use serde_json::Value for mixed
    if (node.types.length === 2 && node.types.some((t) => t.kind === 'primitive' && t.type === 'null')) {
      const nonNull = node.types.find((t) => !(t.kind === 'primitive' && t.type === 'null'))!
      return `Option<${resolveType(nonNull, name, out)}>`
    }
    return 'serde_json::Value'
  }

  if (node.kind === 'primitive') {
    switch (node.type) {
      case 'string': return 'String'
      case 'integer': return 'i64'
      case 'float': return 'f64'
      case 'boolean': return 'bool'
      case 'null': return 'serde_json::Value'
    }
  }

  return 'serde_json::Value'
}
