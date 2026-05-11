import { describe, it, expect } from 'vitest'
import { parse } from '../core/parse'

describe('parse', () => {
  it('parses a simple object', () => {
    const result = parse('{"id": 1, "name": "Alice"}')
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.node.kind).toBe('object')
  })

  it('parses an array', () => {
    const result = parse('[{"id": 1}, {"id": 2}]')
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.node.kind).toBe('array')
  })

  it('returns error for invalid JSON', () => {
    const result = parse('{invalid}')
    expect(result.ok).toBe(false)
  })

  it('returns error for empty input', () => {
    const result = parse('')
    expect(result.ok).toBe(false)
  })

  it('returns error for primitive root', () => {
    const result = parse('"just a string"')
    expect(result.ok).toBe(false)
  })

  it('returns error for null root', () => {
    const result = parse('null')
    expect(result.ok).toBe(false)
  })

  it('parses empty object', () => {
    const result = parse('{}')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.node.kind).toBe('object')
      if (result.node.kind === 'object') expect(result.node.fields).toHaveLength(0)
    }
  })

  it('parses empty array', () => {
    const result = parse('[]')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.node.kind).toBe('array')
      if (result.node.kind === 'array') expect(result.node.items.kind).toBe('unknown')
    }
  })

  it('rejects input exceeding the size limit', () => {
    const huge = '{"a":"' + 'x'.repeat(500_001) + '"}'
    const result = parse(huge)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toMatch(/too large/i)
  })
})
