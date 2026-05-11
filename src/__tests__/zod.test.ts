import { describe, it, expect } from 'vitest'
import { inferNode } from '../core/infer'
import { generateZod } from '../generators/zod'

function gen(json: unknown): string {
  return generateZod(inferNode(json as Parameters<typeof inferNode>[0]))
}

describe('Zod generator', () => {
  it('generates z.object schema for simple object', () => {
    const out = gen({ id: 1, name: 'Alice' })
    expect(out).toContain('z.object(')
    expect(out).toContain('id: z.number()')
    expect(out).toContain('name: z.string()')
  })

  it('exports schema and inferred type', () => {
    const out = gen({ id: 1 })
    expect(out).toContain('export const RootSchema')
    expect(out).toContain('export type Root = z.infer<typeof RootSchema>')
  })

  it('marks optional fields with .optional()', () => {
    const out = gen({ id: 1, nickname: null })
    expect(out).toContain('.optional()')
  })

  it('generates z.array() for array fields', () => {
    const out = gen({ tags: ['a', 'b'] })
    expect(out).toContain('z.array(z.string())')
  })

  it('generates z.unknown() for empty array', () => {
    const out = gen({ items: [] })
    expect(out).toContain('z.array(z.unknown())')
  })

  it('generates z.union for mixed arrays', () => {
    const out = gen({ vals: [1, 'hello'] })
    expect(out).toContain('z.union([')
  })

  it('generates z.boolean()', () => {
    const out = gen({ active: true })
    expect(out).toContain('z.boolean()')
  })

  it('generates empty z.object({})', () => {
    const out = gen({})
    expect(out).toContain('z.object({})')
  })

  it('includes zod import', () => {
    const out = gen({ id: 1 })
    expect(out).toContain("import { z } from 'zod'")
  })

  it('generates nested schema name for nested objects', () => {
    const out = gen({ address: { city: 'Berlin' } })
    expect(out).toContain('RootAddressSchema')
  })
})
