import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderRoute } from './render'

const wrapper = () => document.querySelector('main#content > div')!

describe('arriving on a page (round 22j)', () => {
  it('makes title, text and the band rise one after the other, only the first time the page is opened in the session', async () => {
    const user = userEvent.setup()
    renderRoute('/quem-somos')

    expect(wrapper()).toHaveClass('arrive')
    expect(wrapper()).not.toHaveClass('animate-page')
    expect(JSON.parse(sessionStorage.getItem('af-arrived') ?? '[]')).toContain('/quem-somos')

    await user.click(screen.getAllByRole('link', { name: 'Agenda' })[0]!)
    await screen.findByRole('heading', { level: 1, name: /Agenda/ })
    expect(wrapper()).toHaveClass('arrive')

    await user.click(screen.getAllByRole('link', { name: 'Quem somos' })[0]!)
    await screen.findByRole('heading', { level: 1 })
    expect(wrapper()).toHaveClass('animate-page')
    expect(wrapper()).not.toHaveClass('arrive')
  })

  it('has no arrival at all on a page that was already seen, so it never repeats on the way back', () => {
    sessionStorage.setItem('af-arrived', JSON.stringify(['/quem-somos']))
    renderRoute('/quem-somos')

    expect(wrapper()).toHaveClass('animate-page')
  })

  it('still opens when the storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    renderRoute('/quem-somos')

    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })
})
