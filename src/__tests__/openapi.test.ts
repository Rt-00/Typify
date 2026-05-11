import { describe, it, expect } from 'vitest'
import { inferNode } from '../core/infer'
import { generateOpenAPI } from '../generators/openapi'

function gen(json: unknown): string {
  return generateOpenAPI(inferNode(json as Parameters<typeof inferNode>[0]))
}

describe('OpenAPI generator', () => {
  it('generates components/schemas block', () => {
    const out = gen({ id: 1 })
    expect(out).toContain('components:')
    expect(out).toContain('schemas:')
    expect(out).toContain('Root:')
  })

  it('generates required array for non-optional fields', () => {
    const out = gen({ id: 1, name: 'Alice' })
    expect(out).toContain('required:')
    expect(out).toContain('- id')
    expect(out).toContain('- name')
  })

  it('excludes optional fields from required', () => {
    const out = gen({ id: 1, nickname: null })
    const lines = out.split('\n')
    const reqIdx = lines.findIndex((l) => l.includes('required:'))
    if (reqIdx >= 0) {
      // collect only the list items under required:
      const reqItems: string[] = []
      for (let i = reqIdx + 1; i < lines.length; i++) {
        const line = lines[i]!
        if (line.trim().startsWith('- ')) reqItems.push(line)
        else break
      }
      expect(reqItems.join('\n')).not.toContain('nickname')
    }
  })

  it('adds nullable: true for null fields', () => {
    const out = gen({ id: 1, nickname: null })
    expect(out).toContain('nullable: true')
  })

  it('uses integer type for integer values', () => {
    const out = gen({ id: 42 })
    expect(out).toContain('type: integer')
    expect(out).toContain('format: int64')
  })

  it('uses number type for floats', () => {
    const out = gen({ score: 9.5 })
    expect(out).toContain('type: number')
    expect(out).toContain('format: double')
  })

  it('generates array type with items', () => {
    const out = gen({ tags: ['a', 'b'] })
    expect(out).toContain('type: array')
    expect(out).toContain('items:')
  })

  it('generates $ref for nested objects', () => {
    const out = gen({ address: { city: 'Berlin' } })
    expect(out).toContain('$ref: "#/components/schemas/RootAddress"')
  })

  it('generates empty object with no properties', () => {
    const out = gen({})
    expect(out).toContain('type: object')
  })

  it('generates string type for string fields', () => {
    const out = gen({ name: 'Alice' })
    expect(out).toContain('type: string')
  })
})
