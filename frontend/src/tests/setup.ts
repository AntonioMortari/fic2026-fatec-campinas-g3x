import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'
import { api } from '../services/api'

beforeEach(() => {
  vi.spyOn(api, 'get').mockResolvedValue({ data: { data: [] } })
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  localStorage.clear()
  document.documentElement.removeAttribute('data-font-scale')
  document.documentElement.removeAttribute('data-contrast')
})

// jsdom implements neither <dialog>.showModal()/close() nor scrollIntoView().
if (typeof HTMLDialogElement !== 'undefined' && !HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '')
  }
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.removeAttribute('open')
    this.dispatchEvent(new Event('close'))
  }
}
if (!Element.prototype.scrollIntoView) Element.prototype.scrollIntoView = function scrollIntoView() {}
