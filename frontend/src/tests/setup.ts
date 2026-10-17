import '@testing-library/jest-dom/vitest'
import { cleanup, configure } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'
import { api } from '../services/api'
import { setToken } from '../services/session'

// The whole suite runs in parallel; 1s (the default) is not enough for the first render of a file on a busy machine.
configure({ asyncUtilTimeout: 5000 })

beforeEach(() => {
  vi.spyOn(api, 'get').mockResolvedValue({ data: { data: [] } })
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  localStorage.clear()
  sessionStorage.clear()
  setToken(null)
  document.documentElement.removeAttribute('data-font-scale')
  document.documentElement.removeAttribute('data-contrast')
  document.documentElement.removeAttribute('data-motion')
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
if (typeof window !== 'undefined') window.scrollTo = () => undefined
