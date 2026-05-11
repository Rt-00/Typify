import { describe, it, expect } from 'vitest'
import { inferNode } from '../core/infer'
import { generateRust } from '../generators/rust'

function gen(json: unknown): string {
  return generateRust(inferNode(json as Parameters<typeof inferNode>[0]))
}

describe('Rust generator', () => {
  it('generates struct with derives for simple object', () => {
    const out = gen({ id: 1, name: 'Alice' })
    expect(out).toContain('#[derive(Debug, Clone, Serialize, Deserialize)]')
    expect(out).toContain('pub struct Root')
    expect(out).toContain('pub id: i64')
    expect(out).toContain('pub name: String')
  })

  it('wraps nullable fields in Option<T>', () => {
    const out = gen({ id: 1, nickname: null })
    expect(out).toContain('Option<')
  })

  it('generates Vec<T> for arrays', () => {
    const out = gen({ tags: ['a', 'b'] })
    expect(out).toContain('Vec<String>')
  })

  it('adds serde rename for kebab-case keys', () => {
    const out = gen({ 'my-field': 'value' })
    expect(out).toContain('#[serde(rename = "my-field")]')
    expect(out).toContain('pub my_field:')
  })

  it('generates f64 for floats', () => {
    const out = gen({ score: 9.5 })
    expect(out).toContain('pub score: f64')
  })

  it('generates nested struct', () => {
    const out = gen({ address: { city: 'Berlin' } })
    expect(out).toContain('pub struct RootAddress')
    expect(out).toContain('pub city: String')
  })

  it('generates empty struct with comment', () => {
    const out = gen({})
    expect(out).toContain('// empty struct')
  })

  it('uses serde_json::Value for mixed union', () => {
    const out = gen({ val: [1, 'str'] })
    expect(out).toContain('serde_json::Value')
  })

  it('generates Vec<serde_json::Value> for empty array', () => {
    const out = gen({ items: [] })
    expect(out).toContain('Vec<serde_json::Value>')
  })

  it('generates deeply nested structs', () => {
    const out = gen({ a: { b: { c: 1 } } })
    expect(out).toContain('pub struct Root')
    expect(out).toContain('pub struct RootA')
  })
})
