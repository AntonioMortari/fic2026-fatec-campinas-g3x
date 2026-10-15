import request from 'supertest';
import { createApp } from '../../src/app';
import { FAQ_INITIAL_ITEMS, FAQ_INITIAL_THEMES } from '../../src/database/faq-initial';
import { migrator } from '../../src/database/migrate';
import { FaqItem, FaqTheme, RefreshToken, sequelize, User } from '../../src/models';

const app = createApp();

const ACCOUNT = {
  name: 'Ana Souza',
  email: 'ana@exemplo.com',
  phone: null,
  personType: 'individual',
  password: 'uma-senha-boa',
  wantsToVolunteer: true,
  wantsToDonate: false,
  confirmsAdult: true,
  consent: true,
};

const QUESTION = { question: 'A atividade é gratuita?', answer: 'As atividades da agenda dizem se pedem inscrição.', themeId: 'participar', linkTo: '/agenda', source: 'agenda' };

async function signUp(email: string, isStaff: boolean) {
  const response = await request(app).post('/api/auth/register').send({ ...ACCOUNT, email });
  if (isStaff) await User.update({ isStaff: true }, { where: { id: response.body.user.id } });
  return { Authorization: `Bearer ${response.body.token as string}` };
}
const staff = () => signUp('equipe@exemplo.com', true);

async function restoreInitialContent() {
  await FaqItem.destroy({ where: {} });
  await FaqTheme.destroy({ where: {} });
  const perTheme = new Map<string, number>();
  await FaqTheme.bulkCreate(FAQ_INITIAL_THEMES.map((theme, index) => ({ id: theme.id, name: theme.name, sortOrder: index + 1, published: true })));
  await FaqItem.bulkCreate(
    FAQ_INITIAL_ITEMS.map((item) => {
      const position = (perTheme.get(item.theme) ?? 0) + 1;
      perTheme.set(item.theme, position);
      return { id: item.id, themeId: item.theme, question: item.question, answer: item.answer, linkTo: item.link, source: item.source, sortOrder: position, published: true };
    }),
  );
}

beforeAll(async () => {
  await migrator.up();
});

beforeEach(async () => {
  await restoreInitialContent();
  await RefreshToken.destroy({ where: {} });
  await User.destroy({ where: {} });
});

afterAll(async () => {
  await sequelize.close();
});

const publicIds = async () => ((await request(app).get('/api/faq')).body.data as { items: { id: string }[] }[]).flatMap((theme) => theme.items.map((item) => item.id));

describe('frequently asked questions against a real MySQL', () => {
  it('ships with the nine questions of the site in four themes, in order, and the public list shows them', async () => {
    const response = await request(app).get('/api/faq');

    expect(response.status).toBe(200);
    expect(response.body.data.map((theme: { id: string }) => theme.id)).toEqual(['participar', 'escolas', 'voluntariado-e-apoio', 'dados-e-contato']);
    expect(await publicIds()).toEqual(FAQ_INITIAL_ITEMS.map((item) => item.id));
    expect(response.body.data[0].items[0]).toEqual({
      id: 'conta-para-inscrever',
      question: 'Preciso criar conta para me inscrever numa atividade?',
      answer: expect.stringContaining('não é preciso criar conta'),
      link: { to: '/agenda', label: 'Agenda' },
    });
    expect(response.body.data[0].items[1].link).toBeNull();
  });

  it('keeps the accents in the stored answers', async () => {
    const answer = (await FaqItem.findByPk('onde-fica'))!.answer;

    expect(answer).toContain('Vila Romero');
    expect(answer).not.toMatch(/Ã/);
  });

  it('answers 401 without a token and 403 to someone who is not staff, on every admin route', async () => {
    const plain = await signUp('comum@exemplo.com', false);
    const calls: [string, string][] = [
      ['get', '/api/admin/faq'],
      ['post', '/api/admin/faq/items'],
      ['put', '/api/admin/faq/items/imagem'],
      ['patch', '/api/admin/faq/items/imagem/publication'],
      ['patch', '/api/admin/faq/items/imagem/position'],
      ['post', '/api/admin/faq/themes'],
      ['put', '/api/admin/faq/themes/participar'],
      ['patch', '/api/admin/faq/themes/participar/publication'],
      ['patch', '/api/admin/faq/themes/participar/position'],
    ];

    for (const [method, url] of calls) {
      const call = (request(app) as unknown as Record<string, (path: string) => request.Test>)[method]!;
      expect((await call(url).send(QUESTION)).status).toBe(401);
      expect((await call(url).set(plain).send(QUESTION)).status).toBe(403);
    }
    expect((await FaqItem.findByPk('imagem'))!.published).toBe(true);
  });

  it('lists everything for the staff, drafts included, with the pages the form can choose', async () => {
    const headers = await staff();
    await FaqItem.update({ published: false }, { where: { id: 'imagem' } });

    const response = await request(app).get('/api/admin/faq').set(headers);

    expect(response.status).toBe(200);
    expect(response.headers['cache-control']).toBe('no-store');
    expect(response.body.items).toHaveLength(9);
    expect(response.body.items.find((item: { id: string }) => item.id === 'imagem').published).toBe(false);
    expect(response.body.options.links.map((link: { to: string }) => link.to)).toContain('/agenda');
    expect(response.body.options.sources.map((source: { id: string }) => source.id)).toContain('registration-form');
  });

  it('a new question starts as a draft at the end of its theme, with an address made from the question, and saving never publishes', async () => {
    const headers = await staff();

    const created = await request(app).post('/api/admin/faq/items').set(headers).send({ ...QUESTION, published: true, sortOrder: 0, id: 'imagem' });

    expect(created.status).toBe(201);
    expect(created.body.item).toMatchObject({ id: 'a-atividade-e-gratuita', published: false, sortOrder: 6, themeId: 'participar', linkTo: '/agenda', source: 'agenda' });
    expect(await publicIds()).not.toContain('a-atividade-e-gratuita');

    const edited = await request(app).put('/api/admin/faq/items/a-atividade-e-gratuita').set(headers).send({ ...QUESTION, answer: 'Outra resposta.', published: true });
    expect(edited.body.item).toMatchObject({ answer: 'Outra resposta.', published: false });

    await request(app).patch('/api/admin/faq/items/a-atividade-e-gratuita/publication').set(headers).send({ published: true });
    expect((await publicIds()).at(5)).toBe('a-atividade-e-gratuita');
  });

  it('two questions with the same words get different addresses', async () => {
    const headers = await staff();

    const first = await request(app).post('/api/admin/faq/items').set(headers).send(QUESTION);
    const second = await request(app).post('/api/admin/faq/items').set(headers).send(QUESTION);

    expect(first.body.item.id).toBe('a-atividade-e-gratuita');
    expect(second.body.item.id).toBe('a-atividade-e-gratuita-2');
  });

  it('refuses a question without a source page, with a link outside the list, or in a theme that does not exist', async () => {
    const headers = await staff();
    const post = (body: Record<string, unknown>) => request(app).post('/api/admin/faq/items').set(headers).send({ ...QUESTION, ...body });

    expect((await post({ source: undefined })).status).toBe(400);
    expect((await post({ source: 'privacy' })).status).toBe(400);
    expect((await post({ linkTo: '/doar' })).status).toBe(400);
    expect((await post({ question: '   ' })).status).toBe(400);
    expect((await post({ answer: 'x'.repeat(2001) })).status).toBe(400);
    const missingTheme = await post({ themeId: 'nao-existe' });
    expect(missingTheme.status).toBe(400);
    expect(missingTheme.body.error.code).toBe('invalid_theme');
    expect(await FaqItem.count()).toBe(9);
  });

  it('takes a question down and back, and the public list follows; the question stays stored', async () => {
    const headers = await staff();
    const toggle = (published: boolean) => request(app).patch('/api/admin/faq/items/imagem/publication').set(headers).send({ published });

    await toggle(false);
    expect(await publicIds()).not.toContain('imagem');
    expect(await FaqItem.findByPk('imagem')).not.toBeNull();

    await toggle(true);
    expect(await publicIds()).toContain('imagem');
  });

  it('moves a question up and down inside its theme only, and does nothing at the ends', async () => {
    const headers = await staff();
    const move = (id: string, direction: string) => request(app).patch(`/api/admin/faq/items/${id}/position`).set(headers).send({ direction });
    const themeOrder = async () => (await FaqItem.findAll({ where: { themeId: 'participar' }, order: [['sortOrder', 'ASC']] })).map((item) => item.id);

    await move('menores', 'up');
    expect((await themeOrder()).slice(0, 3)).toEqual(['conta-para-inscrever', 'menores', 'imagem']);
    await move('conta-para-inscrever', 'up');
    await move('onde-fica', 'down');
    expect(await themeOrder()).toEqual(['conta-para-inscrever', 'menores', 'imagem', 'para-quem', 'onde-fica']);
    expect((await FaqItem.findByPk('escola-duracao'))!.sortOrder).toBe(1);
    expect(await publicIds()).toEqual(['conta-para-inscrever', 'menores', 'imagem', 'para-quem', 'onde-fica', ...FAQ_INITIAL_ITEMS.slice(5).map((item) => item.id)]);
  });

  it('moving a question to another theme puts it last there', async () => {
    const headers = await staff();

    const response = await request(app).put('/api/admin/faq/items/para-quem').set(headers).send({ ...QUESTION, question: 'Para quem são as atividades?', themeId: 'escolas' });

    expect(response.body.item).toMatchObject({ themeId: 'escolas', sortOrder: 3 });
    expect((await FaqItem.findAll({ where: { themeId: 'participar' }, order: [['sortOrder', 'ASC']] })).map((item) => item.id)).toEqual(['conta-para-inscrever', 'imagem', 'menores', 'onde-fica']);
  });

  it('a theme taken down hides all its questions without deleting them, and a theme with none on air does not show', async () => {
    const headers = await staff();

    await request(app).patch('/api/admin/faq/themes/escolas/publication').set(headers).send({ published: false });
    expect(await publicIds()).not.toContain('escola-duracao');
    expect(await FaqItem.count({ where: { themeId: 'escolas' } })).toBe(2);

    await request(app).patch('/api/admin/faq/themes/escolas/publication').set(headers).send({ published: true });
    expect(await publicIds()).toContain('escola-duracao');

    await FaqItem.update({ published: false }, { where: { themeId: 'escolas' } });
    expect(((await request(app).get('/api/faq')).body.data as { id: string }[]).map((theme) => theme.id)).not.toContain('escolas');
  });

  it('creates, renames and reorders themes; a name that exists, ignoring case and accent, is a 409', async () => {
    const headers = await staff();

    const created = await request(app).post('/api/admin/faq/themes').set(headers).send({ name: 'Biblioteca digital' });
    expect(created.status).toBe(201);
    expect(created.body.theme).toMatchObject({ id: 'biblioteca-digital', published: true, sortOrder: 5 });

    const clash = await request(app).post('/api/admin/faq/themes').set(headers).send({ name: 'SEUS DADOS E CONTATO' });
    expect(clash.status).toBe(409);
    expect(clash.body.error.code).toBe('theme_name_taken');
    expect((await request(app).put('/api/admin/faq/themes/escolas').set(headers).send({ name: 'participar das atividades' })).status).toBe(409);

    const renamed = await request(app).put('/api/admin/faq/themes/escolas').set(headers).send({ name: 'Escolas e instituições' });
    expect(renamed.body.theme.name).toBe('Escolas e instituições');
    expect((await request(app).put('/api/admin/faq/themes/escolas').set(headers).send({ name: 'Escolas e instituições' })).status).toBe(200);

    await request(app).patch('/api/admin/faq/themes/escolas/position').set(headers).send({ direction: 'up' });
    expect((await FaqTheme.findAll({ order: [['sortOrder', 'ASC']] })).map((theme) => theme.id)).toEqual(['escolas', 'participar', 'voluntariado-e-apoio', 'dados-e-contato', 'biblioteca-digital']);
  });

  it('a theme with no question on air is saved but does not appear in the public list', async () => {
    const headers = await staff();

    await request(app).post('/api/admin/faq/themes').set(headers).send({ name: 'Biblioteca digital' });

    expect(((await request(app).get('/api/faq')).body.data as unknown[]).length).toBe(4);
  });

  it('has no way to delete, and an unknown address is a 404', async () => {
    const headers = await staff();

    expect((await request(app).delete('/api/admin/faq/items/imagem').set(headers)).status).toBe(404);
    expect((await request(app).delete('/api/admin/faq/themes/escolas').set(headers)).status).toBe(404);
    expect((await request(app).put('/api/admin/faq/items/nao-existe').set(headers).send(QUESTION)).status).toBe(404);
    expect((await request(app).patch('/api/admin/faq/themes/nao-existe/publication').set(headers).send({ published: false })).status).toBe(404);
    expect(await FaqItem.count()).toBe(9);
  });

  it('the database refuses to delete a theme that still has questions', async () => {
    await expect(FaqTheme.destroy({ where: { id: 'escolas' } })).rejects.toThrow();
  });

  it('saves emoji and accents in a question', async () => {
    const headers = await staff();

    const created = await request(app).post('/api/admin/faq/items').set(headers).send({ ...QUESTION, question: 'Tem lanche? 🍎', answer: 'Não é oferecido — veja a agenda.' });

    expect(created.status).toBe(201);
    expect((await FaqItem.findByPk(created.body.item.id as string))!.question).toBe('Tem lanche? 🍎');
  });
});
