import { describe, it, expect } from 'vitest'
import { inferNode } from '../core/infer'
import { generateGo } from '../generators/go'

function gen(json: unknown): string {
  return generateGo(inferNode(json as Parameters<typeof inferNode>[0]))
}

describe('Go generator', () => {
  it('generates struct with json tags for simple object', () => {
    const out = gen({ id: 1, name: 'Alice' })
    expect(out).toContain('type Root struct')
    expect(out).toContain('Id int64')
    expect(out).toContain('`json:"id"`')
    expect(out).toContain('Name string')
    expect(out).toContain('`json:"name"`')
  })

  it('adds omitempty for optional fields', () => {
    const out = gen({ id: 1, nickname: null })
    expect(out).toContain('omitempty')
  })

  it('uses pointer type for optional typed fields from merged arrays', () => {
    // role is absent in second item → optional string → *string in Go
    const out = generateGo(inferNode([{ id: 1, role: 'admin' }, { id: 2 }]))
    expect(out).toContain('*string')
  })

  it('uses interface{} without pointer for null-valued fields', () => {
    const out = gen({ id: 1, nickname: null })
    expect(out).toContain('interface{}')
    expect(out).not.toContain('*interface{}')
  })

  it('generates slice type for arrays', () => {
    const out = gen({ tags: ['a', 'b'] })
    expect(out).toContain('[]string')
  })

  it('generates float64 for float values', () => {
    const out = gen({ score: 9.5 })
    expect(out).toContain('float64')
  })

  it('generates nested struct', () => {
    const out = gen({ address: { city: 'Berlin' } })
    expect(out).toContain('type RootAddress struct')
    expect(out).toContain('City string')
  })

  it('generates empty struct with comment', () => {
    const out = gen({})
    expect(out).toContain('// empty struct')
  })

  it('generates interface{} for empty array', () => {
    const out = gen({ items: [] })
    expect(out).toContain('[]interface{}')
  })

  it('generates package declaration', () => {
    const out = gen({ id: 1 })
    expect(out).toContain('package main')
  })

  it('handles special char keys in json tag', () => {
    const out = gen({ 'my-field': 'val' })
    expect(out).toContain('`json:"my_field"')
  })
})
