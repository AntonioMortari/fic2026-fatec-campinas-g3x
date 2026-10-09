import { cn } from '../../lib/cn'

const BASE = 'flex items-center min-h-13 bg-card rounded-control focus-within:shadow-focus'
const NORMAL = 'border border-line-strong focus-within:border-[1.5px] focus-within:border-brown'
// Not layered on top of NORMAL: two border-color utilities on one element are decided by the order Tailwind emits
// them, not by the order of the class names (measured: the error border lost and the field stayed grey).
const INVALID = 'border-2 border-error'

export const fieldBox = (invalid: boolean, className?: string) => cn(BASE, invalid ? INVALID : NORMAL, className)
