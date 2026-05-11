import type { JsonNode, Field, PrimitiveType } from './types'

type JsonValue = string | number | boolean | null | JsonValue[] | { [k: string]: JsonValue }

export function inferNode(value: JsonValue): JsonNode {
  if (value === null) return { kind: 'primitive', type: 'null' }
  if (typeof value === 'boolean') return { kind: 'primitive', type: 'boolean' }
  if (typeof value === 'string') return { kind: 'primitive', type: 'string' }
  if (typeof value === 'number') {
    const type: PrimitiveType = Number.isInteger(value) ? 'integer' : 'float'
    return { kind: 'primitive', type }
  }
  if (Array.isArray(value)) return inferArray(value)
  return inferObject(value)
}

function inferArray(arr: JsonValue[]): JsonNode {
  if (arr.length === 0) return { kind: 'array', items: { kind: 'unknown' } }

  const allObjects = arr.every((v) => v !== null && typeof v === 'object' && !Array.isArray(v))
  if (allObjects) {
    const merged = mergeObjectFields(arr as { [k: string]: JsonValue }[])
    return { kind: 'array', items: merged }
  }

  const nodes = arr.map(inferNode)
  const unified = unifyNodes(nodes)
  return { kind: 'array', items: unified }
}

function inferObject(obj: { [k: string]: JsonValue }): JsonNode {
  const fields: Field[] = Object.entries(obj).map(([key, val]) => ({
    key,
    node: val === null ? resolveNull() : inferNode(val),
    optional: val === null,
  }))
  return { kind: 'object', fields }
}

function resolveNull(): JsonNode {
  return { kind: 'primitive', type: 'null' }
}

function mergeObjectFields(objects: { [k: string]: JsonValue }[]): JsonNode {
  const allKeys = new Set<string>()
  for (const obj of objects) Object.keys(obj).forEach((k) => allKeys.add(k))

  const fields: Field[] = []
  for (const key of allKeys) {
    const values = objects.map((obj) => (key in obj ? obj[key] : undefined))
    const presentValues = values.filter((v) => v !== undefined) as JsonValue[]
    const optional = values.some((v) => v === undefined || v === null)

    const nodes = presentValues.filter((v) => v !== null).map(inferNode)
    const node = nodes.length === 0 ? { kind: 'unknown' as const } : unifyNodes(nodes)

    fields.push({ key, node, optional })
  }
  return { kind: 'object', fields }
}

function unifyNodes(nodes: JsonNode[]): JsonNode {
  if (nodes.length === 0) return { kind: 'unknown' }
  if (nodes.length === 1) return nodes[0]!

  const unique = deduplicateNodes(nodes)
  if (unique.length === 1) return unique[0]!
  return { kind: 'union', types: unique }
}

function deduplicateNodes(nodes: JsonNode[]): JsonNode[] {
  const seen = new Set<string>()
  const result: JsonNode[] = []
  for (const node of nodes) {
    const key = nodeKey(node)
    if (!seen.has(key)) {
      seen.add(key)
      result.push(node)
    }
  }
  return result
}

function nodeKey(node: JsonNode): string {
  switch (node.kind) {
    case 'primitive': return `primitive:${node.type}`
    case 'unknown': return 'unknown'
    case 'array': return `array:${nodeKey(node.items)}`
    case 'union': return `union:${node.types.map(nodeKey).sort().join('|')}`
    case 'object': return `object:${node.fields.map((f) => f.key).sort().join(',')}`
  }
}
