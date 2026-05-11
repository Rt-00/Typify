export type Target = 'typescript' | 'rust' | 'go' | 'java' | 'zod' | 'openapi'

const TABS: { id: Target; label: string; icon: string }[] = [
  { id: 'typescript', label: 'TypeScript', icon: 'TS' },
  { id: 'rust', label: 'Rust', icon: 'RS' },
  { id: 'go', label: 'Go', icon: 'GO' },
  { id: 'java', label: 'Java', icon: 'JV' },
  { id: 'zod', label: 'Zod', icon: 'ZD' },
  { id: 'openapi', label: 'OpenAPI', icon: 'OA' },
]

type Props = {
  active: Target
  onChange: (t: Target) => void
}

export function TargetTabs({ active, onChange }: Props) {
  return (
    <div className="flex gap-1 px-3 sm:px-4 pt-3 overflow-x-auto scrollbar-none shrink-0">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`shrink-0 flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-t text-xs font-medium transition-colors ${
            active === tab.id
              ? 'bg-zinc-800 text-white border-t border-x border-zinc-600'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
          }`}
        >
          <span
            className={`text-[10px] font-bold px-1 py-0.5 rounded ${
              active === tab.id ? 'bg-zinc-600 text-zinc-200' : 'bg-zinc-700 text-zinc-400'
            }`}
          >
            {tab.icon}
          </span>
          <span className="hidden sm:inline">{tab.label}</span>
        </button>
      ))}
    </div>
  )
}
