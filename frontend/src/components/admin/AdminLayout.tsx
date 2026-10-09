import { useCallback, useState } from 'react'
import { Outlet, useLocation, useMatches } from 'react-router-dom'
import { Menu, type MenuSection } from '../layout/Menu'
import { SkipLink } from '../layout/SkipLink'
import type { RouteHandle } from '../layout/Layout'
import { useRouteFocus } from '../layout/useRouteFocus'
import { ToastProvider } from '../ui/ToastProvider'
import { AdminBottomBar } from './AdminBottomBar'
import { AdminHeader } from './AdminHeader'
import { AdminSidebar } from './AdminSidebar'

export function AdminLayout() {
  const [menu, setMenu] = useState<{ open: boolean; section: MenuSection }>({ open: false, section: 'start' })
  const openMenu = useCallback((section: MenuSection) => setMenu({ open: true, section }), [])
  const closeMenu = useCallback(() => setMenu((current) => ({ ...current, open: false })), [])
  const { pathname } = useLocation()
  const matches = useMatches()
  const hideBottomBar = matches.some((match) => (match.handle as RouteHandle | undefined)?.hideBottomBar)
  const hideHeaderOnMobile = matches.some((match) => (match.handle as RouteHandle | undefined)?.hideHeaderOnMobile)
  useRouteFocus()

  return (
    <ToastProvider>
      <div className="flex min-h-dvh flex-col pb-[4.5rem] desktop:pb-0">
        <SkipLink />
        <AdminHeader hideOnMobile={hideHeaderOnMobile} />
        <div className="flex-1 desktop:grid desktop:grid-cols-[15rem_minmax(0,1fr)] print:block!">
          <AdminSidebar />
          <main id="content" tabIndex={-1} className="min-w-0 outline-none">
            <div key={pathname} className="animate-page desktop:px-4">
              <Outlet />
            </div>
          </main>
        </div>
        {!hideBottomBar && <AdminBottomBar openMenu={openMenu} menuOpen={menu.open} />}
        <Menu
          accountFirst
          open={menu.open}
          section={menu.section}
          onClose={closeMenu}
          bottomBar={<AdminBottomBar openMenu={openMenu} menuOpen onCloseMenu={closeMenu} />}
        />
      </div>
    </ToastProvider>
  )
}
