import { describe, it, expect } from 'vitest'
import { inferNode } from '../core/infer'
import { generateJava } from '../generators/java'

function gen(json: unknown): string {
  return generateJava(inferNode(json as Parameters<typeof inferNode>[0]))
}

describe('Java generator', () => {
  it('generates class with Lombok annotations', () => {
    const out = gen({ id: 1, name: 'Alice' })
    expect(out).toContain('@Data')
    expect(out).toContain('@Builder')
    expect(out).toContain('public class Root')
  })

  it('adds @JsonProperty for all fields', () => {
    const out = gen({ id: 1 })
    expect(out).toContain('@JsonProperty("id")')
  })

  it('uses Long for integer fields', () => {
    const out = gen({ id: 42 })
    expect(out).toContain('private Long id')
  })

  it('uses Double for float fields', () => {
    const out = gen({ score: 9.5 })
    expect(out).toContain('private Double score')
  })

  it('uses List<T> for array fields', () => {
    const out = gen({ tags: ['a', 'b'] })
    expect(out).toContain('List<String>')
  })

  it('generates static inner class for nested objects', () => {
    const out = gen({ address: { city: 'Berlin' } })
    expect(out).toContain('public static class RootAddress')
    expect(out).toContain('private String city')
  })

  it('generates empty class with comment', () => {
    const out = gen({})
    expect(out).toContain('// empty class')
  })

  it('uses String for string fields', () => {
    const out = gen({ name: 'Alice' })
    expect(out).toContain('private String name')
  })

  it('uses Boolean for boolean fields', () => {
    const out = gen({ active: true })
    expect(out).toContain('private Boolean active')
  })

  it('handles special char keys in JsonProperty', () => {
    const out = gen({ 'my-field': 'val' })
    expect(out).toContain('@JsonProperty("my_field")')
  })
})
