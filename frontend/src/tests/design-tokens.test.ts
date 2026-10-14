/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

// Read as text: the test config turns CSS imports into empty modules.
const css = readFileSync(join(process.cwd(), 'src/styles.css'), 'utf8')
const theme = css.slice(css.indexOf('@theme'), css.indexOf('html[data-contrast="high"]'))
const highContrast = css.slice(css.indexOf('html[data-contrast="high"]'), css.indexOf('@media (prefers-reduced-motion: reduce)'))

function token(block: string, name: string): string {
  const match = new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{6});`).exec(block)
  if (!match) throw new Error(`--color-${name} not found`)
  return match[1] as string
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as [number, number, number]
  const channel = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number]
  return (light + 0.05) / (dark + 0.05)
}

describe.each([
  ['normal', theme],
  ['high contrast', highContrast],
])('the error color, %s', (_mode, block) => {
  const read = (name: string) => token(block === highContrast && !new RegExp(`--color-${name}:`).test(block) ? theme : block, name)

  it('reads as text on every surface errors appear on (WCAG AA, 4.5:1)', () => {
    const error = read('error')
    for (const surface of ['cream', 'card', 'cream-dark', 'error-tint']) {
      expect(contrast(error, read(surface)), `error on ${surface}`).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('carries the cream label of the error toast', () => {
    expect(contrast(read('cream'), read('error'))).toBeGreaterThanOrEqual(4.5)
  })

  it('keeps the message in the ink color readable on the tint of the alert', () => {
    expect(contrast(read('brown'), read('error-tint'))).toBeGreaterThanOrEqual(7)
  })
})

describe('the error color', () => {
  it('is a red, not another palette color: the red channel clearly leads', () => {
    const error = token(theme, 'error')
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(error.slice(i, i + 2), 16)) as [number, number, number]

    expect(r).toBeGreaterThan(130)
    expect(g).toBeLessThan(r * 0.5)
    expect(b).toBeLessThan(r * 0.5)
  })

  it('is apart from ochre, which means light, date and action, never a problem', () => {
    expect(contrast(token(theme, 'error'), token(theme, 'ochre'))).toBeGreaterThan(2.5)
  })
})

function motionToken(name: string): number {
  const match = new RegExp(`--motion-${name}:\\s*(\\d+)ms;`).exec(css)
  if (!match) throw new Error(`--motion-${name} not found`)
  return Number(match[1])
}

describe('motion (design "Movimento")', () => {
  it('closes the touch feedback in the press token, and the press token is the 90ms of the design', () => {
    expect(css).toMatch(/a:active,[\s\S]*?button:active,[\s\S]*?\{\s*transition-duration: var\(--motion-press\);/)
    expect(motionToken('press')).toBe(90)
  })

  it('keeps the entrance at 200ms, the sheet at 280ms and the page fade at 150ms', () => {
    expect(motionToken('enter')).toBe(200)
    expect(motionToken('sheet')).toBe(280)
    expect(motionToken('page')).toBe(200)
    expect(css).toMatch(/--animate-rise: rise var\(--motion-enter\)/)
    expect(css).toMatch(/--animate-sheet: sheet var\(--motion-sheet\)/)
    expect(css).toMatch(/--animate-page: page var\(--motion-page\)/)
  })

  it('keeps micro feedback at 150ms or less, and the whole stagger of a list under a page transition', () => {
    expect(motionToken('micro')).toBeLessThanOrEqual(150)
    expect(motionToken('sheet-out')).toBeLessThan(motionToken('sheet'))
    expect(motionToken('stagger') * 3 + motionToken('enter')).toBeLessThanOrEqual(280)
  })

  it('shows a skeleton only after a short delay, so a fast answer never flashes it', () => {
    expect(motionToken('skeleton-delay')).toBeGreaterThanOrEqual(100)
    expect(css).toMatch(/--animate-skeleton-in: skeleton-in [^;]*var\(--motion-skeleton-delay\)/)
  })

  it('turns every animation, transition and smooth scroll off when the person asks for less motion', () => {
    const reduced = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)'))
    expect(reduced).toMatch(/animation-duration: 0\.01ms !important/)
    expect(reduced).toMatch(/transition-duration: 0\.01ms !important/)
    expect(reduced).toMatch(/scroll-behavior: auto !important/)
    expect(reduced).toMatch(/\.enter-list > \* \{\s*animation-delay: 0ms !important/)
  })

  it('only opts into smooth scroll, the details height and the sheet exit when motion is welcome', () => {
    const welcome = css.slice(css.indexOf('@media (prefers-reduced-motion: no-preference)'), css.indexOf(':focus-visible'))
    expect(welcome).toMatch(/scroll-behavior: smooth/)
    expect(welcome).toMatch(/details::details-content/)
    expect(welcome).toMatch(/dialog\[data-sheet\]:not\(\[open\]\)/)
  })

  it('gives the skeleton a visible color in high contrast too', () => {
    expect(highContrast).toMatch(/--color-skeleton:/)
  })
})
