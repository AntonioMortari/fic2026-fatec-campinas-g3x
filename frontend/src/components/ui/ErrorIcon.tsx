export function ErrorIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" width="1em" height="1em" className={className} fill="none" stroke="currentColor" strokeWidth="1.75">
      <circle cx="8" cy="8" r="6.5" />
      <path d="M8 4.5v4M8 11v.5" strokeLinecap="round" />
    </svg>
  )
}
