import { useEffect, useRef, useState } from 'react'
import { codeToHtml } from 'shiki'
import type { Target } from './TargetTabs'

const LANG_MAP: Record<Target, string> = {
  typescript: 'typescript',
  rust: 'rust',
  go: 'go',
  java: 'java',
  zod: 'typescript',
  openapi: 'yaml',
}

const FILE_EXT: Record<Target, string> = {
  typescript: 'types.ts',
  rust: 'types.rs',
  go: 'types.go',
  java: 'Root.java',
  zod: 'schema.ts',
  openapi: 'openapi.yaml',
}

type Props = {
  code: string
  target: Target
}

export function OutputPanel({ code, target }: Props) {
  const [html, setHtml] = useState('')
  const [copied, setCopied] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!code) { setHtml(''); return }
    // Shiki HTML-escapes all token content before wrapping in <span> elements.
    // The code string itself is generator output (sanitized identifiers only),
    // never raw user input — so dangerouslySetInnerHTML below is safe.
    codeToHtml(code, {
      lang: LANG_MAP[target],
      theme: 'github-dark',
    }).then(setHtml)
  }, [code, target])

  function handleCopy() {
    navigator.clipboard.writeText(code)
    setCopied(true)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setCopied(false), 2000)
  }

  function handleDownload() {
    const blob = new Blob([code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = FILE_EXT[target]
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-700">
        <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Output</span>
        {code && (
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="px-2.5 py-1 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 rounded transition-colors"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button
              onClick={handleDownload}
              className="px-2.5 py-1 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 rounded transition-colors"
            >
              Download
            </button>
          </div>
        )}
      </div>
      <div className="flex-1 overflow-auto">
        {html ? (
          <div
            className="min-h-full [&>pre]:min-h-full [&>pre]:px-4 [&>pre]:py-4 [&>pre]:text-sm [&>pre]:font-mono [&>pre]:leading-relaxed"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-zinc-600 text-sm">
            Paste JSON to generate types
          </div>
        )}
      </div>
    </div>
  )
}
