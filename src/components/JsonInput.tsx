import Editor from '@monaco-editor/react'

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

type Props = {
  value: string
  onChange: (v: string) => void
  onFormat: () => void
  onClear: () => void
  hasError: boolean
}

export function JsonInput({ value, onChange, onFormat, onClear, hasError }: Props) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-700">
        <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">JSON Input</span>
        <div className="flex gap-2">
          <button
            onClick={onFormat}
            title="Format JSON (Ctrl+Shift+F)"
            className="px-2.5 py-1 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 rounded transition-colors"
          >
            Format
          </button>
          <button
            onClick={onClear}
            className="px-2.5 py-1 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 rounded transition-colors"
          >
            Clear
          </button>
        </div>
      </div>
      <div className={`flex-1 border-r ${hasError ? 'border-red-800' : 'border-zinc-700'} transition-colors`}>
        <Editor
          height="100%"
          defaultLanguage="json"
          value={value}
          defaultValue={PLACEHOLDER}
          theme="vs-dark"
          onChange={(v) => onChange(v ?? '')}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            tabSize: 2,
            formatOnPaste: true,
            automaticLayout: true,
          }}
        />
      </div>
    </div>
  )
}
