import { useCallback, useState, type ReactNode } from 'react'
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
  hideHeaderOnMobile?: boolean
  backTo?: string
  backLabel?: string
  wide?: boolean
  genericBack?: boolean
}

export function Layout({ children, hideHeaderOnMobile: forceHideHeader = false, hideBottomBar: forceHideBottomBar = false }: { children?: ReactNode; hideHeaderOnMobile?: boolean; hideBottomBar?: boolean }) {
  const [menu, setMenu] = useState<{ open: boolean; section: MenuSection }>({ open: false, section: 'start' })
  const openMenu = useCallback((section: MenuSection) => setMenu({ open: true, section }), [])
  const closeMenu = useCallback(() => setMenu((current) => (current.open ? { ...current, open: false } : current)), [])
  const { pathname } = useLocation()
  const matches = useMatches()
  const hideBottomBar = forceHideBottomBar || matches.some((match) => (match.handle as RouteHandle | undefined)?.hideBottomBar)
  const hideHeaderOnMobile = forceHideHeader || matches.some((match) => (match.handle as RouteHandle | undefined)?.hideHeaderOnMobile)
  useRouteFocus()

  return (
    <ToastProvider>
      <div className="flex min-h-dvh flex-col pb-[4.5rem] desktop:pb-0">
        <SkipLink />
        <Header openMenu={openMenu} menuOpen={menu.open} hideOnMobile={hideHeaderOnMobile} />
        <main id="content" tabIndex={-1} className="flex-1 outline-none">
          <div key={pathname} className="animate-page">
            {children ?? <Outlet />}
          </div>
        </main>
        <Footer />
        {!hideBottomBar && <BottomBar openMenu={openMenu} menuOpen={menu.open} />}
        <Menu
          open={menu.open}
          section={menu.section}
          onClose={closeMenu}
          onOpen={() => openMenu('start')}
          bottomBar={<BottomBar openMenu={openMenu} menuOpen onCloseMenu={closeMenu} />}
        />
      </div>
    </ToastProvider>
  )
}
