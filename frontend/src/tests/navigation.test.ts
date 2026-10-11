import { BOTTOM_BAR, DESKTOP_NAV, MENU_GROUPS, PROJECTS, SCHOOLS, VOLUNTEER } from '../lib/navigation'
import { SECTORS } from '../lib/sectors'

describe('navigation constants', () => {
  it('names the destinations the about and project pages link to', () => {
    expect(PROJECTS).toEqual({ label: 'Projetos', to: '/projetos' })
    expect(VOLUNTEER).toEqual({ label: 'Voluntariado', to: '/voluntariado' })
    expect(SCHOOLS).toEqual({ label: 'Para escolas', to: '/para-escolas' })
  })

  it('keeps the menus pointing to the same objects', () => {
    expect(BOTTOM_BAR).toContain(PROJECTS)
    expect(DESKTOP_NAV).toContain(PROJECTS)
    expect(MENU_GROUPS.flatMap((group) => group.items)).toEqual(expect.arrayContaining([PROJECTS, VOLUNTEER, SCHOOLS]))
  })
})

describe('sectors', () => {
  it('lists the three sectors with a photo and a description of it', () => {
    expect(SECTORS.map((sector) => sector.key)).toEqual(['literary', 'musical', 'artistic'])
    for (const sector of SECTORS) expect(sector.alt.length).toBeGreaterThan(20)
  })
})
