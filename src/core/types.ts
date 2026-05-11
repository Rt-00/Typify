export type PrimitiveType = 'string' | 'integer' | 'float' | 'boolean' | 'null'

export type JsonNode =
  | { kind: 'object'; fields: Field[] }
  | { kind: 'array'; items: JsonNode }
  | { kind: 'union'; types: JsonNode[] }
  | { kind: 'primitive'; type: PrimitiveType }
  | { kind: 'unknown' }

export type Field = {
  key: string
  node: JsonNode
  optional: boolean
}
