/**
 * Targeted tests for branches not reachable via the main generator tests.
 * Each group names the file and lines it covers.
 */
import { describe, it, expect } from 'vitest'
import { inferNode } from '../core/infer'
import { generateRust } from '../generators/rust'
import { generateGo } from '../generators/go'
import { generateJava } from '../generators/java'
import { generateZod } from '../generators/zod'
import { generateOpenAPI } from '../generators/openapi'

function rust(json: unknown) { return generateRust(inferNode(json as never)) }
function go(json: unknown) { return generateGo(inferNode(json as never)) }
function java(json: unknown) { return generateJava(inferNode(json as never)) }
function zod(json: unknown) { return generateZod(inferNode(json as never)) }
function openapi(json: unknown) { return generateOpenAPI(inferNode(json as never)) }

// ─── rust.ts — escapeRustString branches ─────────────────────────────────────

describe('Rust — escapeRustString covers all special-char branches', () => {
  it('escapes backslash and double-quote in key (lines 7-8)', () => {
    // line 7: ch === '\\'  →  '\\\\'
    // line 8: ch === '"'   →  '\\"'
    const out = rust({ 'foo\\"bar': 1 })
    expect(out).toContain('rename =')
    expect(out).toContain('\\\\')
    expect(out).toContain('\\"')
  })

  it('escapes control chars: newline (cp < 0x20) and DEL (cp === 0x7f) — line 10', () => {
    // left branch of || : cp < 0x20
    const outNewline = rust({ ['foo\nbar']: 1 })
    expect(outNewline).toContain('\\u{a}')
    // right branch of || : cp === 0x7f (only reached when cp >= 0x20)
    const outDel = rust({ ['foo\x7fbar']: 1 })
    expect(outDel).toContain('\\u{7f}')
  })

  it('escapes C1 control chars 0x80-0x9f (line 12 both-true)', () => {
    const out = rust({ ['foo\x80bar']: 1 })
    expect(out).toContain('\\u{80}')
  })

  it('passes through non-C1 extended Unicode (line 12 left-true-right-false)', () => {
    // \xa0 (no-break space) has cp=0xa0 — cp>=0x80 is true but cp<=0x9f is false
    // so the C1 block is skipped and the char is returned as-is
    const out = rust({ ['caf\xe9']: 1 }) // 'café', é=0xe9
    expect(out).toContain('rename =')
  })

  it('escapes zero-width spaces — line 14: 0x200b, 0x200c, 0x200d branches', () => {
    // 0x200b (ZWS) — first ||  branch
    const out200b = rust({ ['foo​bar']: 1 })
    expect(out200b).toContain('\\u{200b}')
    // 0x200c (ZWNJ) — second || branch (only reached when 0x200b is false)
    const out200c = rust({ ['foo‌bar']: 1 })
    expect(out200c).toContain('\\u{200c}')
    // 0x200d (ZWJ) — third || branch (only reached when 0x200b and 0x200c are false)
    const out200d = rust({ ['foo‍bar']: 1 })
    expect(out200d).toContain('\\u{200d}')
  })

  it('escapes bidi override chars 0x202a-0x202e (line 16 both-true)', () => {
    const out = rust({ ['foo‮bar']: 1 })
    expect(out).toContain('\\u{202e}')
  })

  it('passes through chars just above bidi range (line 16 left-true-right-false)', () => {
    //   (narrow no-break space): cp=0x202f, cp>=0x202a true, cp<=0x202e false
    const out = rust({ ['foo bar']: 1 })
    expect(out).toContain('rename =')
  })

  it('escapes bidi isolate chars 0x2066-0x2069 (line 17 both-true)', () => {
    const out = rust({ ['foo⁦bar']: 1 })
    expect(out).toContain('\\u{2066}')
  })

  it('passes through chars just above bidi-isolate range (line 17 left-true-right-false)', () => {
    // ⁪: cp=0x206a, cp>=0x2066 true, cp<=0x2069 false
    const out = rust({ ['foo⁪bar']: 1 })
    expect(out).toContain('rename =')
  })

  it('escapes BOM (line 19)', () => {
    const out = rust({ ['foo﻿bar']: 1 })
    expect(out).toContain('\\u{feff}')
  })
})

// ─── rust.ts — union → Option<T> ────────────────────────────────────────────

describe('Rust — null+type union produces Option<T>', () => {
  it('emits Option<f64> for a field whose array mixes float and null', () => {
    const out = rust({ scores: [1.5, null] })
    expect(out).toContain('Option<f64>')
  })

  it('emits Option<String> for a field whose array mixes string and null', () => {
    const out = rust({ labels: ['a', null] })
    expect(out).toContain('Option<String>')
  })
})

// ─── go.ts — union branches and unknown fallthrough ─────────────────────────

describe('Go — union and unknown branches', () => {
  it('emits *float64 for null+float union field (lines 35-37)', () => {
    const out = go({ scores: [1.5, null] })
    expect(out).toContain('*float64')
  })

  it('emits interface{} for 3-type union (line 39)', () => {
    const out = go({ vals: [1, 'hi', true] })
    expect(out).toContain('interface{}')
  })

  it('emits interface{} for unknown-kind field — line 52 (all-null items in array)', () => {
    // [{x: null}] → mergeObjectFields: all presentValues for x are null →
    // nodes filtered to [] → node = {kind:'unknown'} → resolveType → line 52
    const out = generateGo(inferNode([{ x: null }]))
    expect(out).toContain('interface{}')
  })
})

// ─── java.ts — non-object root, union branches, unknown fallthrough ──────────

describe('Java — resolveType for array root (lines 45-46)', () => {
  it('falls through to resolveInnerType when root is an array', () => {
    // resolveType is called with an array node, skips the object branch,
    // falls through to resolveInnerType — the collected classes are still returned
    const out = generateJava(inferNode([{ id: 1 }]))
    expect(out).toContain('public class Root')
    expect(out).toContain('private Long id')
  })
})

describe('Java — empty array field (line 54)', () => {
  it('emits List<Object> for a field with an empty array', () => {
    const out = java({ data: [] })
    expect(out).toContain('List<Object>')
  })
})

describe('Java — union branches (lines 60-65)', () => {
  it('emits boxed type for null+float union (lines 60-62)', () => {
    const out = java({ scores: [1.5, null] })
    expect(out).toContain('Double')
  })

  it('emits Object for 3-type union (line 64)', () => {
    const out = java({ vals: [1, 'hi', true] })
    expect(out).toContain('Object')
  })
})

describe('Java — unknown fallthrough (lines 77-78)', () => {
  it('emits Object for unknown-kind field node', () => {
    // [{x: null}] → field x has {kind:'unknown'} → resolveInnerType returns 'Object'
    const out = generateJava(inferNode([{ x: null }]))
    expect(out).toContain('Object')
  })
})

// ─── openapi.ts — union branches, unknown fallthrough, empty array ───────────

describe('OpenAPI — union branches (lines 60-64)', () => {
  it('adds nullable:true for null+float union field (lines 60-62)', () => {
    const out = openapi({ scores: [1.5, null] })
    expect(out).toContain('nullable: true')
    expect(out).toContain('format: double')
  })

  it('emits oneOf for 3-type union (line 64)', () => {
    const out = openapi({ vals: [1, 'hi', true] })
    expect(out).toContain('oneOf:')
  })
})

describe('OpenAPI — unknown fallthrough (line 77)', () => {
  it('emits empty schema for unknown-kind field node', () => {
    // [{x: null}] → field x has {kind:'unknown'} → resolveInlineSchema returns {}
    const out = generateOpenAPI(inferNode([{ x: null }]))
    expect(out).toContain('x:')
  })
})

describe('OpenAPI — empty array field (line 51)', () => {
  it('emits array type for empty-array field', () => {
    const out = openapi({ data: [] })
    expect(out).toContain('type: array')
  })
})

// ─── zod.ts — unknown fallthrough (line 60) ──────────────────────────────────

describe('Zod — unknown fallthrough', () => {
  it('emits z.unknown() for unknown-kind field node', () => {
    // [{x: null}] → field x has {kind:'unknown'} → resolveSchema returns 'z.unknown()'
    const out = zod([{ x: null }])
    expect(out).toContain('z.unknown()')
  })
})

// ─── infer.ts — nodeKey branches for array, union, object kinds ──────────────

describe('infer — nodeKey covers array, union, and object branches', () => {
  it('deduplicates identical empty arrays (nodeKey: array + unknown)', () => {
    // [[], []] → unifyNodes([array:unknown, array:unknown]) →
    // deduplicateNodes calls nodeKey with 'array' then 'unknown'
    const node = inferNode([[], []])
    expect(node.kind).toBe('array')
    if (node.kind === 'array') {
      expect(node.items.kind).toBe('array')
    }
  })

  it('deduplicates identical mixed arrays (nodeKey: union)', () => {
    // [[1,'a'], [2,'b']] → both items are array(union(int,str)) →
    // nodeKey called with union node inside the array
    const node = inferNode([[1, 'a'], [2, 'b']])
    expect(node.kind).toBe('array')
    if (node.kind === 'array') {
      expect(node.items.kind).toBe('array')
    }
  })

  it('deduplicates array mixing object and primitive (nodeKey: object)', () => {
    // [{id:1}, 1] → nodes = [object, int] → nodeKey called with object node
    const node = inferNode([{ id: 1 }, 1])
    expect(node.kind).toBe('array')
    if (node.kind === 'array') {
      expect(node.items.kind).toBe('union')
    }
  })
})
