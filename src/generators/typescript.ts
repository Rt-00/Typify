import type { JsonNode } from '../core/types'
import { toPascalCase, sanitizeKey } from '../core/naming'

export function generateTypeScript(root: JsonNode, rootName = 'Root'): string {
  const interfaces: string[] = []
  resolveType(root, rootName, interfaces)
  return interfaces.join('\n\n')
}

function resolveType(node: JsonNode, name: string, out: string[]): string {
  if (node.kind === 'object') {
    const typeName = toPascalCase(name)
    const lines: string[] = [`export interface ${typeName} {`]
    for (const field of node.fields) {
      const fieldType = resolveType(field.node, `${typeName}${toPascalCase(field.key)}`, out)
      const safeKey = sanitizeKey(field.key)
      const opt = field.optional ? '?' : ''
      lines.push(`  ${safeKey}${opt}: ${fieldType};`)
    }
    if (node.fields.length === 0) lines.push('  // empty object')
    lines.push('}')
    out.unshift(lines.join('\n'))
    return typeName
  }

  if (node.kind === 'array') {
    const itemType = resolveType(node.items, name, out)
    if (node.items.kind === 'unknown') {
      return `unknown[] // TODO: add item type`
    }
    return `${itemType}[]`
  }

  if (node.kind === 'union') {
    return node.types.map((t) => resolveType(t, name, out)).join(' | ')
  }

  if (node.kind === 'primitive') {
    switch (node.type) {
      case 'string': return 'string'
      case 'integer':
      case 'float': return 'number'
      case 'boolean': return 'boolean'
      case 'null': return 'null'
    }
  }

  return 'unknown'
}
