/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

// Read as text: the test config turns CSS imports into empty modules.
const css = readFileSync(join(process.cwd(), 'src/styles.css'), 'utf8')
const theme = css.slice(css.indexOf('@theme'), css.indexOf('html[data-contrast="high"]'))
const highContrast = css.slice(css.indexOf('html[data-contrast="high"]'), css.indexOf('@media (prefers-reduced-motion'))

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
