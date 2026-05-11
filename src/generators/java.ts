import type { JsonNode } from '../core/types'
import { toPascalCase, toCamelCase, sanitizeKey } from '../core/naming'

export function generateJava(root: JsonNode, rootName = 'Root'): string {
  const classes: string[] = []
  resolveType(root, rootName, classes, '')
  return classes.join('\n\n')
}

function resolveType(node: JsonNode, name: string, out: string[], indent: string): string {
  if (node.kind === 'object') {
    const typeName = toPascalCase(name)
    const fieldIndent = indent + '    '
    const classKw = indent === '' ? 'public class' : 'public static class'
    const lines: string[] = []

    lines.push(`${indent}@Data`)
    lines.push(`${indent}@Builder`)
    lines.push(`${indent}@NoArgsConstructor`)
    lines.push(`${indent}@AllArgsConstructor`)
    lines.push(`${indent}${classKw} ${typeName} {`)

    const innerClasses: string[] = []
    for (const field of node.fields) {
      const javaField = toCamelCase(field.key)
      const innerType = resolveInnerType(field.node, `${typeName}${toPascalCase(field.key)}`, innerClasses, fieldIndent)
      const javaType = field.optional ? toNullableType(innerType) : innerType
      const safeKey = sanitizeKey(field.key)
      lines.push(`${fieldIndent}@JsonProperty("${safeKey}")`)
      lines.push(`${fieldIndent}private ${javaType} ${javaField};`)
      lines.push('')
    }
    if (node.fields.length === 0) lines.push(`${fieldIndent}// empty class`)

    for (const inner of innerClasses) {
      lines.push('')
      lines.push(inner)
    }

    lines.push(`${indent}}`)
    out.unshift(lines.join('\n'))
    return typeName
  }

  return resolveInnerType(node, name, out, indent)
}

function resolveInnerType(node: JsonNode, name: string, out: string[], indent: string): string {
  if (node.kind === 'object') {
    return resolveType(node, name, out, indent)
  }

  if (node.kind === 'array') {
    if (node.items.kind === 'unknown') return 'List<Object>'
    const inner = resolveInnerType(node.items, name, out, indent)
    return `List<${toBoxedType(inner)}>`
  }

  if (node.kind === 'union') {
    if (node.types.length === 2 && node.types.some((t) => t.kind === 'primitive' && t.type === 'null')) {
      const nonNull = node.types.find((t) => !(t.kind === 'primitive' && t.type === 'null'))!
      return toBoxedType(resolveInnerType(nonNull, name, out, indent))
    }
    return 'Object'
  }

  if (node.kind === 'primitive') {
    switch (node.type) {
      case 'string': return 'String'
      case 'integer': return 'Long'
      case 'float': return 'Double'
      case 'boolean': return 'Boolean'
      case 'null': return 'Object'
    }
  }

  return 'Object'
}

function toBoxedType(t: string): string {
  switch (t) {
    case 'int': return 'Integer'
    case 'long': return 'Long'
    case 'double': return 'Double'
    case 'boolean': return 'Boolean'
    default: return t
  }
}

function toNullableType(t: string): string {
  switch (t) {
    case 'int': return 'Integer'
    case 'long': return 'Long'
    case 'double': return 'Double'
    case 'boolean': return 'Boolean'
    default: return t
  }
}
