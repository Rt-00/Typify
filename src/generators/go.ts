import type { JsonNode } from '../core/types'
import { toPascalCase, sanitizeKey } from '../core/naming'

export function generateGo(root: JsonNode, rootName = 'Root'): string {
  const structs: string[] = []
  resolveType(root, rootName, structs)
  return `package main\n\n` + structs.join('\n\n')
}

function resolveType(node: JsonNode, name: string, out: string[]): string {
  if (node.kind === 'object') {
    const typeName = toPascalCase(name)
    const lines: string[] = [`type ${typeName} struct {`]
    for (const field of node.fields) {
      const goField = toPascalCase(field.key)
      const innerType = resolveType(field.node, `${typeName}${toPascalCase(field.key)}`, out)
      const goType = field.optional && innerType !== 'interface{}' ? `*${innerType}` : innerType
      const omit = field.optional ? ',omitempty' : ''
      const safeKey = sanitizeKey(field.key)
      lines.push(`\t${goField} ${goType} \`json:"${safeKey}${omit}"\``)
    }
    if (node.fields.length === 0) lines.push('\t// empty struct')
    lines.push('}')
    out.unshift(lines.join('\n'))
    return typeName
  }

  if (node.kind === 'array') {
    if (node.items.kind === 'unknown') return '[]interface{}'
    const inner = resolveType(node.items, name, out)
    return `[]${inner}`
  }

  if (node.kind === 'union') {
    if (node.types.length === 2 && node.types.some((t) => t.kind === 'primitive' && t.type === 'null')) {
      const nonNull = node.types.find((t) => !(t.kind === 'primitive' && t.type === 'null'))!
      return `*${resolveType(nonNull, name, out)}`
    }
    return 'interface{}'
  }

  if (node.kind === 'primitive') {
    switch (node.type) {
      case 'string': return 'string'
      case 'integer': return 'int64'
      case 'float': return 'float64'
      case 'boolean': return 'bool'
      case 'null': return 'interface{}'
    }
  }

  return 'interface{}'
}
