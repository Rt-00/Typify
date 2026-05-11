import { describe, it, expect } from 'vitest'
import { inferNode } from '../core/infer'

describe('inferNode', () => {
  it('infers string primitive', () => {
    const node = inferNode('hello')
    expect(node).toEqual({ kind: 'primitive', type: 'string' })
  })

  it('infers integer primitive', () => {
    const node = inferNode(42)
    expect(node).toEqual({ kind: 'primitive', type: 'integer' })
  })

  it('infers float primitive', () => {
    const node = inferNode(3.14)
    expect(node).toEqual({ kind: 'primitive', type: 'float' })
  })

  it('infers boolean primitive', () => {
    const node = inferNode(true)
    expect(node).toEqual({ kind: 'primitive', type: 'boolean' })
  })

  it('infers null primitive', () => {
    const node = inferNode(null)
    expect(node).toEqual({ kind: 'primitive', type: 'null' })
  })

  it('infers object', () => {
    const node = inferNode({ id: 1, name: 'Alice' })
    expect(node.kind).toBe('object')
    if (node.kind === 'object') {
      expect(node.fields).toHaveLength(2)
      expect(node.fields[0]!.key).toBe('id')
      expect(node.fields[1]!.key).toBe('name')
    }
  })

  it('marks null fields as optional', () => {
    const node = inferNode({ id: 1, nickname: null })
    if (node.kind === 'object') {
      const nickname = node.fields.find((f) => f.key === 'nickname')
      expect(nickname?.optional).toBe(true)
    }
  })

  it('infers uniform array', () => {
    const node = inferNode([1, 2, 3])
    expect(node.kind).toBe('array')
    if (node.kind === 'array') {
      expect(node.items).toEqual({ kind: 'primitive', type: 'integer' })
    }
  })

  it('infers empty array as unknown', () => {
    const node = inferNode([])
    expect(node.kind).toBe('array')
    if (node.kind === 'array') expect(node.items.kind).toBe('unknown')
  })

  it('infers mixed array as union', () => {
    const node = inferNode([1, 'hello'])
    expect(node.kind).toBe('array')
    if (node.kind === 'array') expect(node.items.kind).toBe('union')
  })

  it('merges array of objects with missing keys as optional', () => {
    const node = inferNode([{ id: 1, role: 'admin' }, { id: 2 }])
    expect(node.kind).toBe('array')
    if (node.kind === 'array') {
      const merged = node.items
      expect(merged.kind).toBe('object')
      if (merged.kind === 'object') {
        const role = merged.fields.find((f) => f.key === 'role')
        expect(role?.optional).toBe(true)
      }
    }
  })

  it('infers nested objects', () => {
    const node = inferNode({ user: { name: 'Alice' } })
    if (node.kind === 'object') {
      const user = node.fields[0]!
      expect(user.node.kind).toBe('object')
    }
  })
})
