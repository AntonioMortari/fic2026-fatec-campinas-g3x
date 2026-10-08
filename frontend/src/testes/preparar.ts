import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => {
  cleanup()
  localStorage.clear()
  document.documentElement.removeAttribute('data-fonte')
  document.documentElement.removeAttribute('data-contraste')
})

// O jsdom não implementa showModal()/close() do <dialog>. O mínimo para os
// testes: abrir marca `open`, fechar desmarca e dispara "close" como o navegador.
if (typeof HTMLDialogElement !== 'undefined' && !HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '')
  }
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.removeAttribute('open')
    this.dispatchEvent(new Event('close'))
  }
}

// Nem scrollIntoView(), que o menu usa para mostrar os controles de leitura.
if (!Element.prototype.scrollIntoView) Element.prototype.scrollIntoView = function scrollIntoView() {}
