import type { JsonNode } from '../core/types'
import { toPascalCase, sanitizeKey } from '../core/naming'

export function generateOpenAPI(root: JsonNode, rootName = 'Root'): string {
  const schemas: Record<string, unknown> = {}
  resolveSchema(root, toPascalCase(rootName), schemas)

  const doc = {
    components: {
      schemas,
    },
  }

  return toYaml(doc, 0)
}

function resolveSchema(node: JsonNode, name: string, out: Record<string, unknown>): string {
  if (node.kind === 'object') {
    const typeName = toPascalCase(name)
    const properties: Record<string, unknown> = {}
    const required: string[] = []

    for (const field of node.fields) {
      const safeKey = sanitizeKey(field.key)
      const innerName = `${typeName}${toPascalCase(field.key)}`
      const fieldSchema = resolveInlineSchema(field.node, innerName, out)
      properties[safeKey] = fieldSchema

      if (!field.optional) required.push(safeKey)
    }

    const schema: Record<string, unknown> = { type: 'object' }
    if (required.length > 0) schema['required'] = required
    if (Object.keys(properties).length > 0) schema['properties'] = properties

    out[typeName] = schema
    return typeName
  }

  return resolveInlineSchema(node, name, out) as string
}

function resolveInlineSchema(node: JsonNode, name: string, out: Record<string, unknown>): unknown {
  if (node.kind === 'object') {
    const typeName = resolveSchema(node, name, out)
    return { $ref: `#/components/schemas/${typeName}` }
  }

  if (node.kind === 'array') {
    if (node.items.kind === 'unknown') {
      return { type: 'array', items: {} }
    }
    const items = resolveInlineSchema(node.items, name, out)
    return { type: 'array', items }
  }

  if (node.kind === 'union') {
    const nullTypes = node.types.filter((t) => t.kind === 'primitive' && t.type === 'null')
    const nonNull = node.types.filter((t) => !(t.kind === 'primitive' && t.type === 'null'))
    if (nullTypes.length > 0 && nonNull.length === 1) {
      const inner = resolveInlineSchema(nonNull[0]!, name, out) as Record<string, unknown>
      return { ...inner, nullable: true }
    }
    return { oneOf: node.types.map((t) => resolveInlineSchema(t, name, out)) }
  }

  if (node.kind === 'primitive') {
    switch (node.type) {
      case 'string': return { type: 'string' }
      case 'integer': return { type: 'integer', format: 'int64' }
      case 'float': return { type: 'number', format: 'double' }
      case 'boolean': return { type: 'boolean' }
      case 'null': return { nullable: true }
    }
  }

  return {}
}

function toYaml(value: unknown, indent: number): string {
  const pad = '  '.repeat(indent)

  if (typeof value === 'boolean') return String(value)
  if (typeof value === 'string') {
    if (/[:#\[\]{},&*?|<>=!%@`]/.test(value) || value.includes('\n')) {
      return `"${value.replace(/"/g, '\\"')}"`
    }
    return value
  }

  if (Array.isArray(value)) {
    return value.map((item) => `${pad}- ${toYaml(item, indent + 1).trimStart()}`).join('\n')
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
    if (entries.length === 0) return '{}'
    return entries
      .map(([k, v]) => {
        if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
          return `${pad}${k}:\n${toYaml(v, indent + 1)}`
        }
        if (Array.isArray(v)) {
          return `${pad}${k}:\n${toYaml(v, indent + 1)}`
        }
        return `${pad}${k}: ${toYaml(v, indent)}`
      })
      .join('\n')
  }
}
