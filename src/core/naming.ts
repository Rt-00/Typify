export function toPascalCase(str: string): string {
  return sanitizeKey(str)
    .replace(/[-_\s]+(.)/g, (_, c: string) => c.toUpperCase())
    .replace(/^(.)/, (_, c: string) => c.toUpperCase())
}

export function toCamelCase(str: string): string {
  const pascal = toPascalCase(str)
  return pascal.charAt(0).toLowerCase() + pascal.slice(1)
}

export function toSnakeCase(str: string): string {
  return sanitizeKey(str)
    .replace(/([A-Z])/g, '_$1')
    .replace(/[-\s]+/g, '_')
    .replace(/^_/, '')
    .toLowerCase()
    .replace(/_+/g, '_')
}

export function sanitizeKey(key: string): string {
  // Remove leading digits
  const withoutLeadingDigits = key.replace(/^(\d+)/, '_$1')
  // Replace invalid identifier characters with underscore
  return withoutLeadingDigits.replace(/[^a-zA-Z0-9_$]/g, '_')
}

export function needsRename(key: string): boolean {
  return sanitizeKey(key) !== key || /^[0-9]/.test(key)
}
