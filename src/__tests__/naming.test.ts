import { describe, it, expect } from 'vitest'
import { toPascalCase, toCamelCase, toSnakeCase, sanitizeKey, needsRename } from '../core/naming'

describe('toPascalCase', () => {
  it('converts simple word', () => expect(toPascalCase('hello')).toBe('Hello'))
  it('converts camelCase', () => expect(toPascalCase('helloWorld')).toBe('HelloWorld'))
  it('converts kebab-case', () => expect(toPascalCase('hello-world')).toBe('HelloWorld'))
  it('converts snake_case', () => expect(toPascalCase('hello_world')).toBe('HelloWorld'))
  it('handles already PascalCase', () => expect(toPascalCase('HelloWorld')).toBe('HelloWorld'))
  it('handles special chars', () => expect(toPascalCase('my-field!')).toBe('MyField_'))
})

describe('toCamelCase', () => {
  it('converts snake_case', () => expect(toCamelCase('hello_world')).toBe('helloWorld'))
  it('converts kebab-case', () => expect(toCamelCase('hello-world')).toBe('helloWorld'))
  it('lowercases first char', () => expect(toCamelCase('HelloWorld')).toBe('helloWorld'))
})

describe('toSnakeCase', () => {
  it('converts camelCase', () => expect(toSnakeCase('helloWorld')).toBe('hello_world'))
  it('converts PascalCase', () => expect(toSnakeCase('HelloWorld')).toBe('hello_world'))
  it('handles already snake', () => expect(toSnakeCase('hello_world')).toBe('hello_world'))
  it('converts kebab', () => expect(toSnakeCase('hello-world')).toBe('hello_world'))
  it('handles special chars', () => expect(toSnakeCase('my-field')).toBe('my_field'))
})

describe('sanitizeKey', () => {
  it('leaves valid key unchanged', () => expect(sanitizeKey('myField')).toBe('myField'))
  it('replaces hyphens', () => expect(sanitizeKey('my-field')).toBe('my_field'))
  it('replaces spaces', () => expect(sanitizeKey('my field')).toBe('my_field'))
  it('prefixes leading digit', () => expect(sanitizeKey('123abc')).toBe('_123abc'))
  it('replaces special chars', () => expect(sanitizeKey('field@name')).toBe('field_name'))
  it('returns _ for empty string', () => expect(sanitizeKey('')).toBe('_'))
})

describe('needsRename', () => {
  it('returns false for valid key', () => expect(needsRename('myField')).toBe(false))
  it('returns true for hyphen key', () => expect(needsRename('my-field')).toBe(true))
  it('returns true for leading digit', () => expect(needsRename('123')).toBe(true))
  it('returns true for space', () => expect(needsRename('my field')).toBe(true))
})
