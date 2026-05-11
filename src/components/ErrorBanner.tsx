type Props = { message: string }

export function ErrorBanner({ message }: Props) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-red-900/40 border border-red-700 rounded text-red-300 text-xs font-mono">
      <span className="text-red-400">⚠</span>
      {message}
    </div>
  )
}
