export default function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'rounded-xl px-3 py-2 text-sm transition',
        active
          ? 'bg-[rgba(29,158,117,0.14)] text-text shadow-[0_0_0_1px_rgba(29,158,117,0.35)_inset]'
          : 'bg-transparent text-muted hover:text-text hover:bg-[rgba(255,255,255,0.04)]',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

