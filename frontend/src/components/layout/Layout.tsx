import { useCallback, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { BottomBar } from './BottomBar'
import { Footer } from './Footer'
import { Header } from './Header'
import { Menu, type MenuSection } from './Menu'
import { SkipLink } from './SkipLink'
import { useRouteFocus } from './useRouteFocus'

export function Layout() {
  const [menu, setMenu] = useState<{ open: boolean; section: MenuSection }>({ open: false, section: 'start' })
  const openMenu = useCallback((section: MenuSection) => setMenu({ open: true, section }), [])
  const closeMenu = useCallback(() => setMenu((current) => ({ ...current, open: false })), [])
  useRouteFocus()

  return (
    <div className="flex min-h-dvh flex-col pb-[4.5rem] desktop:pb-0">
      <SkipLink />
      <Header openMenu={openMenu} />
      <main id="content" tabIndex={-1} className="mx-auto w-full max-w-page flex-1 px-4 pb-12 outline-none desktop:px-8">
        <Outlet />
      </main>
      <Footer />
      <BottomBar openMenu={openMenu} menuOpen={menu.open} />
      <Menu open={menu.open} section={menu.section} onClose={closeMenu} />
    </div>
  )
}
