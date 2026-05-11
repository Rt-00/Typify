import { describe, it, expect } from 'vitest'
import { parse } from '../core/parse'
import type { JsonNode } from '../core/types'
import { generateTypeScript } from '../generators/typescript'
import { generateRust } from '../generators/rust'
import { generateGo } from '../generators/go'
import { generateJava } from '../generators/java'
import { generateZod } from '../generators/zod'
import { generateOpenAPI } from '../generators/openapi'
import simpleFixture from '../__fixtures__/simple.json'
import usersFixture from '../__fixtures__/users.json'

function pipeline(json: unknown, gen: (node: JsonNode) => string): string {
  const result = parse(JSON.stringify(json))
  if (!result.ok) throw new Error(result.error)
  return gen(result.node)
}

describe('Integration: simple fixture', () => {
  it('TypeScript pipeline produces valid output', () => {
    const out = pipeline(simpleFixture, generateTypeScript)
    expect(out).toContain('export interface Root')
    expect(out).toContain('id: number')
    expect(out).toContain('nickname?:')
    expect(out).toContain('export interface RootAddress')
  })

  it('Rust pipeline produces valid output', () => {
    const out = pipeline(simpleFixture, generateRust)
    expect(out).toContain('pub struct Root')
    expect(out).toContain('pub id: i64')
    expect(out).toContain('pub struct RootAddress')
  })

  it('Go pipeline produces valid output', () => {
    const out = pipeline(simpleFixture, generateGo)
    expect(out).toContain('type Root struct')
    expect(out).toContain('package main')
  })

  it('Java pipeline produces valid output', () => {
    const out = pipeline(simpleFixture, generateJava)
    expect(out).toContain('@Data')
    expect(out).toContain('public class Root')
  })

  it('Zod pipeline produces valid output', () => {
    const out = pipeline(simpleFixture, generateZod)
    expect(out).toContain("import { z } from 'zod'")
    expect(out).toContain('export const RootSchema')
    expect(out).toContain('export type Root')
  })

  it('OpenAPI pipeline produces valid output', () => {
    const out = pipeline(simpleFixture, generateOpenAPI)
    expect(out).toContain('components:')
    expect(out).toContain('schemas:')
    expect(out).toContain('Root:')
  })
})

describe('Integration: users array fixture', () => {
  it('TypeScript marks missing role as optional', () => {
    const out = pipeline(usersFixture, generateTypeScript)
    expect(out).toContain('role?:')
  })

  it('Rust marks missing role as Option<T>', () => {
    const out = pipeline(usersFixture, generateRust)
    expect(out).toContain('Option<String>')
  })

  it('Go marks missing role with omitempty', () => {
    const out = pipeline(usersFixture, generateGo)
    expect(out).toContain('omitempty')
  })
})
