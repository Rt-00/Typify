import type { JsonNode } from '../core/types'
import { toPascalCase, sanitizeKey } from '../core/naming'

export function generateZod(root: JsonNode, rootName = 'Root'): string {
  const schemas: string[] = []
  const typeName = toPascalCase(rootName)
  const schemaName = `${typeName}Schema`
  resolveSchema(root, typeName, schemaName, schemas)
  return `import { z } from 'zod'\n\n` + schemas.join('\n\n')
}

function resolveSchema(node: JsonNode, typeName: string, schemaName: string, out: string[]): string {
  if (node.kind === 'object') {
    const lines: string[] = []
    const fieldLines: string[] = []

    for (const field of node.fields) {
      const safeKey = sanitizeKey(field.key)
      const innerName = `${typeName}${toPascalCase(field.key)}`
      const innerSchema = `${toPascalCase(innerName)}Schema`
      const fieldSchema = resolveSchema(field.node, innerName, innerSchema, out)
      const schema = field.optional ? `${fieldSchema}.optional()` : fieldSchema
      fieldLines.push(`  ${safeKey}: ${schema},`)
    }

    if (node.fields.length === 0) {
      lines.push(`export const ${schemaName} = z.object({})`)
    } else {
      lines.push(`export const ${schemaName} = z.object({`)
      lines.push(...fieldLines)
      lines.push(`})`)
    }
    lines.push(`export type ${typeName} = z.infer<typeof ${schemaName}>`)
    out.push(lines.join('\n'))
    return schemaName
  }

  if (node.kind === 'array') {
    if (node.items.kind === 'unknown') return `z.array(z.unknown())`
    const inner = resolveSchema(node.items, typeName, schemaName, out)
    return `z.array(${inner})`
  }

  if (node.kind === 'union') {
    const parts = node.types.map((t) => resolveSchema(t, typeName, schemaName, out))
    return `z.union([${parts.join(', ')}])`
  }

  if (node.kind === 'primitive') {
    switch (node.type) {
      case 'string': return 'z.string()'
      case 'integer':
      case 'float': return 'z.number()'
      case 'boolean': return 'z.boolean()'
      case 'null': return 'z.null()'
    }
  }

  return 'z.unknown()'
}
