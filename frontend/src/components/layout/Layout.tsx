import { useCallback, useState } from 'react'
import { Outlet, useLocation, useMatches } from 'react-router-dom'
import { BottomBar } from './BottomBar'
import { Footer } from './Footer'
import { Header } from './Header'
import { Menu, type MenuSection } from './Menu'
import { SkipLink } from './SkipLink'
import { ToastProvider } from '../ui/ToastProvider'
import { useRouteFocus } from './useRouteFocus'

export interface RouteHandle {
  hideBottomBar?: boolean
}

export function Layout() {
  const [menu, setMenu] = useState<{ open: boolean; section: MenuSection }>({ open: false, section: 'start' })
  const openMenu = useCallback((section: MenuSection) => setMenu({ open: true, section }), [])
  const closeMenu = useCallback(() => setMenu((current) => ({ ...current, open: false })), [])
  const { pathname } = useLocation()
  const hideBottomBar = useMatches().some((match) => (match.handle as RouteHandle | undefined)?.hideBottomBar)
  useRouteFocus()

  return (
    <ToastProvider>
      <div className="flex min-h-dvh flex-col pb-[4.5rem] desktop:pb-0">
        <SkipLink />
        <Header openMenu={openMenu} />
        <main id="content" tabIndex={-1} className="flex-1 outline-none">
          <div key={pathname} className="animate-page">
            <Outlet />
          </div>
        </main>
        <Footer />
        {!hideBottomBar && <BottomBar openMenu={openMenu} menuOpen={menu.open} />}
        <Menu
          open={menu.open}
          section={menu.section}
          onClose={closeMenu}
          bottomBar={<BottomBar openMenu={openMenu} menuOpen onCloseMenu={closeMenu} />}
        />
      </div>
    </ToastProvider>
  )
}
