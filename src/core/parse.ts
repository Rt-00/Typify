import { inferNode } from './infer'
import type { JsonNode } from './types'

export type ParseResult =
  | { ok: true; node: JsonNode }
  | { ok: false; error: string }

const MAX_INPUT_BYTES = 500_000 // 500 KB

export function parse(input: string): ParseResult {
  const trimmed = input.trim()
  if (!trimmed) return { ok: false, error: 'Input is empty' }
  if (trimmed.length > MAX_INPUT_BYTES) {
    return { ok: false, error: `Input too large (max ${MAX_INPUT_BYTES / 1000} KB)` }
  }

  let value: unknown
  try {
    value = JSON.parse(trimmed)
  } catch (e) {
    return { ok: false, error: (e as SyntaxError).message }
  }

  if (typeof value !== 'object' || value === null) {
    return { ok: false, error: 'Root value must be an object or array' }
  }

  return { ok: true, node: inferNode(value as Parameters<typeof inferNode>[0]) }
}
