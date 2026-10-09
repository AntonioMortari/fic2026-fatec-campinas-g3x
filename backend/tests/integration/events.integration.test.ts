import { migrator } from '../../src/database/migrate';
import { Event, sequelize } from '../../src/models';
import { listPublishedEvents } from '../../src/services/events.service';

const NOW = new Date('2026-10-10T15:00:00Z');
const HOUR = 60 * 60 * 1000;

function event(title: string, startsAt: Date, overrides: Partial<{ endsAt: Date | null; published: boolean }> = {}) {
  return Event.create({
    title,
    description: null,
    category: null,
    startsAt,
    endsAt: overrides.endsAt ?? null,
    location: null,
    ageRange: null,
    capacity: null,
    published: overrides.published ?? true,
  });
}

beforeAll(async () => {
  await migrator.up();
});

beforeEach(async () => {
  await Event.destroy({ where: {}, truncate: true });
});

afterAll(async () => {
  await sequelize.close();
});

describe('events against a real MySQL', () => {
  it('never returns an unpublished event, in either period', async () => {
    await event('rascunho futuro', new Date(NOW.getTime() + 24 * HOUR), { published: false });
    await event('rascunho passado', new Date(NOW.getTime() - 24 * HOUR), { published: false });

    expect(await listPublishedEvents({ period: 'upcoming', now: NOW })).toEqual([]);
    expect(await listPublishedEvents({ period: 'past', now: NOW })).toEqual([]);
  });

  it('puts every published event in exactly one period, including those without an end time', async () => {
    await event('futuro sem fim', new Date(NOW.getTime() + 24 * HOUR));
    await event('passado sem fim', new Date(NOW.getTime() - 24 * HOUR));
    await event('passado com fim', new Date(NOW.getTime() - 48 * HOUR), { endsAt: new Date(NOW.getTime() - 46 * HOUR) });
    await event('futuro com fim', new Date(NOW.getTime() + 48 * HOUR), { endsAt: new Date(NOW.getTime() + 50 * HOUR) });

    const upcoming = (await listPublishedEvents({ period: 'upcoming', now: NOW })).map((e) => e.title);
    const past = (await listPublishedEvents({ period: 'past', now: NOW })).map((e) => e.title);

    expect(upcoming).toEqual(['futuro sem fim', 'futuro com fim']);
    expect(past).toEqual(['passado sem fim', 'passado com fim']);
  });

  it('keeps an event that already started but has not ended in the upcoming list', async () => {
    await event('em andamento', new Date(NOW.getTime() - HOUR), { endsAt: new Date(NOW.getTime() + HOUR) });

    expect((await listPublishedEvents({ period: 'upcoming', now: NOW })).map((e) => e.title)).toEqual(['em andamento']);
    expect(await listPublishedEvents({ period: 'past', now: NOW })).toEqual([]);
  });

  it('respects the limit and the order', async () => {
    await event('c', new Date(NOW.getTime() + 3 * HOUR));
    await event('a', new Date(NOW.getTime() + 1 * HOUR));
    await event('b', new Date(NOW.getTime() + 2 * HOUR));

    expect((await listPublishedEvents({ period: 'upcoming', limit: 2, now: NOW })).map((e) => e.title)).toEqual(['a', 'b']);
  });

  it('round-trips the instant, which is stored in UTC', async () => {
    await event('horário', new Date('2026-10-17T17:00:00Z'));

    const [found] = await listPublishedEvents({ period: 'upcoming', now: NOW });

    expect(found?.startsAt).toBe('2026-10-17T17:00:00.000Z');
  });

  it('stores and returns accents and emoji without corruption', async () => {
    const title = 'Contação: pequenos ouvintes 🎶 — vivência brincante';
    await Event.create({
      title, description: 'Uma viagem às fazendas de café, em linguagem acessível.', category: 'Contação de história',
      startsAt: new Date(NOW.getTime() + HOUR), endsAt: null, location: 'Sede, Vila Romero', ageRange: null, capacity: null, published: true,
    });

    const [found] = await listPublishedEvents({ period: 'upcoming', now: NOW });

    expect(found).toMatchObject({
      title,
      description: 'Uma viagem às fazendas de café, em linguagem acessível.',
      category: 'Contação de história',
      location: 'Sede, Vila Romero',
    });
  });

  it('rejects an event that ends before it starts, and a zero capacity, at the database', async () => {
    await expect(event('invertido', new Date('2026-10-17T17:00:00Z'), { endsAt: new Date('2026-10-17T16:00:00Z') })).rejects.toThrow();
    await expect(
      Event.create({
        title: 'sem vagas', description: null, category: null, startsAt: NOW, endsAt: null, location: null, ageRange: null, capacity: 0,
      }),
    ).rejects.toThrow();
  });
});
