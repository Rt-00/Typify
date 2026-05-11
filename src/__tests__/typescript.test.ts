import { describe, it, expect } from 'vitest'
import { inferNode } from '../core/infer'
import { generateTypeScript } from '../generators/typescript'

function gen(json: unknown): string {
  return generateTypeScript(inferNode(json as Parameters<typeof inferNode>[0]))
}

describe('TypeScript generator', () => {
  it('generates interface for simple object', () => {
    const out = gen({ id: 1, name: 'Alice' })
    expect(out).toContain('export interface Root')
    expect(out).toContain('id: number')
    expect(out).toContain('name: string')
  })

  it('marks optional fields with ?', () => {
    const out = gen({ id: 1, nickname: null })
    expect(out).toContain('nickname?: null')
  })

  it('generates typed array field', () => {
    const out = gen({ tags: ['a', 'b'] })
    expect(out).toContain('string[]')
  })

  it('generates unknown[] for empty array with TODO comment', () => {
    const out = gen({ items: [] })
    expect(out).toContain('unknown[]')
  })

  it('generates nested interface', () => {
    const out = gen({ address: { city: 'Berlin' } })
    expect(out).toContain('export interface RootAddress')
    expect(out).toContain('city: string')
  })

  it('generates union type for mixed array', () => {
    const out = gen({ values: [1, 'hello'] })
    expect(out).toContain('number | string')
  })

  it('generates empty interface with comment', () => {
    const out = gen({})
    expect(out).toContain('// empty object')
  })

  it('sanitizes special char keys', () => {
    const out = gen({ 'my-field': 'value' })
    expect(out).toContain('my_field')
  })

  it('generates deeply nested types', () => {
    const out = gen({ a: { b: { c: { d: 1 } } } })
    expect(out).toContain('export interface Root')
    expect(out).toContain('export interface RootA')
  })

  it('generates array of objects', () => {
    const out = gen([{ id: 1, name: 'Alice' }, { id: 2 }])
    expect(out).toContain('export interface Root')
    expect(out).toContain('id: number')
    expect(out).toContain('name?:')
  })
})
