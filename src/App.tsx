import { useCallback, useEffect, useRef, useState } from 'react'
import { JsonInput } from './components/JsonInput'
import { TargetTabs, type Target } from './components/TargetTabs'
import { OutputPanel } from './components/OutputPanel'
import { ErrorBanner } from './components/ErrorBanner'
import { parse } from './core/parse'
import { generateTypeScript } from './generators/typescript'
import { generateRust } from './generators/rust'
import { generateGo } from './generators/go'
import { generateJava } from './generators/java'
import { generateZod } from './generators/zod'
import { generateOpenAPI } from './generators/openapi'
import type { JsonNode } from './core/types'

const GENERATORS: Record<Target, (node: JsonNode) => string> = {
  typescript: generateTypeScript,
  rust: generateRust,
  go: generateGo,
  java: generateJava,
  zod: generateZod,
  openapi: generateOpenAPI,
}

const PLACEHOLDER = `{
  "id": 1,
  "name": "Alice",
  "active": true,
  "score": 9.5,
  "tags": ["admin", "user"],
  "address": {
    "city": "Berlin",
    "zip": "10115"
  },
  "nickname": null
}`

export default function App() {
  const [input, setInput] = useState(PLACEHOLDER)
  const [target, setTarget] = useState<Target>('typescript')
  const [parseError, setParseError] = useState<string | null>(null)
  const [astCache, setAstCache] = useState<JsonNode | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const processInput = useCallback((raw: string) => {
    const result = parse(raw)
    if (result.ok) {
      setParseError(null)
      setAstCache(result.node)
    } else {
      setParseError(result.error)
      setAstCache(null)
    }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => processInput(input), 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [input, processInput])

  // seed from placeholder on mount
  useEffect(() => { processInput(PLACEHOLDER) }, [processInput])

  function handleFormat() {
    try {
      setInput(JSON.stringify(JSON.parse(input), null, 2))
    } catch {
      // invalid JSON, leave as-is
    }
  }

  function handleClear() {
    setInput('')
    setParseError(null)
    setAstCache(null)
  }

  const output = astCache ? GENERATORS[target](astCache) : ''

  return (
    <div className="h-screen flex flex-col bg-zinc-900 text-zinc-100 font-sans">
      {/* Header */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-zinc-700 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold tracking-tight">
            <span className="text-blue-400">{'{'}</span>
            <span className="text-white"> Typify </span>
            <span className="text-blue-400">{'}'}</span>
          </span>
          <span className="hidden sm:inline text-zinc-500 text-xs">JSON → Types</span>
        </div>
        <a
          href="https://github.com/Rt-00/Typify"
          target="_blank"
          rel="noopener noreferrer"
          className="text-zinc-500 hover:text-zinc-300 text-xs transition-colors"
        >
          GitHub
        </a>
      </header>

      {/* Main split — vertical on mobile, horizontal on md+ */}
      <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden">
        {/* Top / Left: JSON Input */}
        <div className="flex-1 min-h-0 min-w-0 flex flex-col border-b md:border-b-0 md:border-r border-zinc-700">
          <div className="flex-1 min-h-0">
            <JsonInput
              value={input}
              onChange={setInput}
              onFormat={handleFormat}
              onClear={handleClear}
              hasError={!!parseError}
            />
          </div>
          {parseError && (
            <div className="px-3 sm:px-4 py-2 border-t border-zinc-700 shrink-0">
              <ErrorBanner message={parseError} />
            </div>
          )}
        </div>

        {/* Bottom / Right: Output */}
        <div className="flex-1 min-h-0 min-w-0 flex flex-col">
          <TargetTabs active={target} onChange={setTarget} />
          <div className="flex-1 min-h-0 border-t border-zinc-600">
            <OutputPanel code={output} target={target} />
          </div>
        </div>
      </div>
    </div>
  )
}
