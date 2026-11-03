// Shared class strings. Keep every class name written out in full so
// Tailwind can see it at build time.

// Primary action: a gold gradient that slides across on hover.
export const goldButton = [
  'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5',
  'text-sm font-semibold text-forest-950',
  'bg-linear-to-r from-gold-400 via-gold-200 to-gold-500',
  'bg-[length:220%_100%] bg-left',
  'shadow-[inset_0_1px_0_0_rgba(255,255,255,0.55),0_8px_20px_-8px_rgba(227,182,42,0.65)]',
  'transition-[background-position,box-shadow,transform] duration-500',
  'hover:bg-right',
  'hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.65),0_12px_28px_-8px_rgba(227,182,42,0.85)]',
  'active:translate-y-px',
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-200',
  'disabled:cursor-not-allowed disabled:opacity-50',
  'motion-reduce:transition-none',
].join(' ')

// Quiet secondary action on dark glass.
export const ghostButton = [
  'inline-flex items-center justify-center rounded-xl px-4 py-2.5',
  'text-sm font-medium text-forest-100',
  'transition-colors hover:bg-white/10 hover:text-white',
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-300',
  'disabled:cursor-not-allowed disabled:opacity-50',
].join(' ')