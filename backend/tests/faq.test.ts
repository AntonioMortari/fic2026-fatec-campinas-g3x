import request from 'supertest';
import { createApp } from '../src/app';
import { FAQ_INITIAL_ITEMS, FAQ_INITIAL_THEMES } from '../src/database/faq-initial';
import { FaqItem, FaqTheme, User } from '../src/models';
import { slugify } from '../src/services/admin-faq.service';
import { FAQ_LINKS, FAQ_SOURCES } from '../src/utils/faq-pages';
import { signToken } from '../src/utils/token';
import { faqItemBody, faqThemeBody } from '../src/validators/admin-faq.validator';

const app = createApp();
const STAFF_ID = '11111111-1111-4111-8111-111111111111';
const auth = { Authorization: `Bearer ${signToken({ sub: STAFF_ID })}` };

afterEach(() => jest.restoreAllMocks());

describe('slugify', () => {
  it('makes a short address without accents, spaces or punctuation', () => {
    expect(slugify('Preciso autorizar o uso da minha imagem?')).toBe('preciso-autorizar-o-uso-da-minha-imagem');
    expect(slugify('  Ação  &  Memória!! ')).toBe('acao-memoria');
    expect(slugify('???')).toBe('pergunta');
    expect(slugify('a'.repeat(200)).length).toBeLessThanOrEqual(50);
  });
});

describe('the initial content', () => {
  it('puts every question in a known theme, with a known source and only links to pages that exist', () => {
    const themes = new Set(FAQ_INITIAL_THEMES.map((theme) => theme.id));
    const sources = new Set<string>(FAQ_SOURCES.map((source) => source.id));
    const links = new Set<string>(FAQ_LINKS.map((link) => link.to));
    for (const item of FAQ_INITIAL_ITEMS) {
      expect(themes.has(item.theme)).toBe(true);
      expect(sources.has(item.source)).toBe(true);
      if (item.link) expect(links.has(item.link)).toBe(true);
      expect(item.question.endsWith('?')).toBe(true);
    }
    expect(new Set(FAQ_INITIAL_ITEMS.map((item) => item.id)).size).toBe(FAQ_INITIAL_ITEMS.length);
  });
});

describe('the body schemas', () => {
  const valid = { question: 'Tem lanche?', answer: 'Não.', themeId: 'participar', source: 'agenda' };

  it('drops what is not a field, so a hostile body cannot publish or choose the address', () => {
    const parsed = faqItemBody.parse({ ...valid, published: true, id: 'x', sortOrder: 1 });

    expect(parsed).toEqual({ ...valid, linkTo: null });
  });

  it('requires the page where the answer is already written, and only accepts pages from the list', () => {
    expect(faqItemBody.safeParse({ ...valid, source: undefined }).success).toBe(false);
    expect(faqItemBody.safeParse({ ...valid, linkTo: '/qualquer' }).success).toBe(false);
    expect(faqItemBody.safeParse({ ...valid, linkTo: '/agenda' }).success).toBe(true);
    expect(faqItemBody.safeParse({ ...valid, themeId: 'Tem Espaço' }).success).toBe(false);
  });

  it('trims and limits the theme name', () => {
    expect(faqThemeBody.parse({ name: '  Biblioteca  ' }).name).toBe('Biblioteca');
    expect(faqThemeBody.safeParse({ name: 'x'.repeat(41) }).success).toBe(false);
    expect(faqThemeBody.safeParse({ name: '   ' }).success).toBe(false);
  });
});

describe('GET /api/faq', () => {
  it('asks only for what is on air and drops a theme with no question left', async () => {
    const themes = jest.spyOn(FaqTheme, 'findAll').mockResolvedValue([
      { id: 'a', name: 'A' },
      { id: 'b', name: 'B' },
    ] as unknown as FaqTheme[]);
    const items = jest.spyOn(FaqItem, 'findAll').mockResolvedValue([{ id: 'q', themeId: 'a', question: 'Q?', answer: 'R.', linkTo: '/agenda' }] as unknown as FaqItem[]);

    const response = await request(app).get('/api/faq');

    expect(response.body.data).toEqual([{ id: 'a', name: 'A', items: [{ id: 'q', question: 'Q?', answer: 'R.', link: { to: '/agenda', label: 'Agenda' } }] }]);
    expect(themes.mock.calls[0]![0]).toMatchObject({ where: { published: true } });
    expect(items.mock.calls[0]![0]!.where).toMatchObject({ published: true });
  });
});

describe('the admin routes', () => {
  it('refuse someone who is not staff before touching a table', async () => {
    jest.spyOn(User, 'findByPk').mockResolvedValue({ id: STAFF_ID, isStaff: false } as unknown as User);
    const list = jest.spyOn(FaqItem, 'findAll');
    const create = jest.spyOn(FaqItem, 'create');

    expect((await request(app).get('/api/admin/faq').set(auth)).status).toBe(403);
    expect((await request(app).post('/api/admin/faq/items').set(auth).send({})).status).toBe(403);
    expect(list).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });
});
