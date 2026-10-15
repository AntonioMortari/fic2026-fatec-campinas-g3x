import { UniqueConstraintError, type Transaction } from 'sequelize';
import { FaqItem, FaqTheme, sequelize } from '../models';
import { ApiError } from '../utils/api-error';
import { FAQ_LINKS, FAQ_SOURCES } from '../utils/faq-pages';

export interface AdminFaqTheme {
  id: string;
  name: string;
  published: boolean;
  sortOrder: number;
}

export interface AdminFaqItem {
  id: string;
  themeId: string;
  question: string;
  answer: string;
  linkTo: string | null;
  source: string;
  published: boolean;
  sortOrder: number;
}

export interface FaqItemInput {
  question: string;
  answer: string;
  themeId: string;
  linkTo: string | null;
  source: string;
}

export type Direction = 'up' | 'down';

const itemNotFound = () => new ApiError(404, 'faq_item_not_found', 'Não encontramos essa pergunta.');
const themeNotFound = () => new ApiError(404, 'faq_theme_not_found', 'Não encontramos esse tema.');
const nameTaken = () => new ApiError(409, 'theme_name_taken', 'Já existe um tema com esse nome.');

const toItem = (item: FaqItem): AdminFaqItem => ({
  id: item.id,
  themeId: item.themeId,
  question: item.question,
  answer: item.answer,
  linkTo: item.linkTo,
  source: item.source,
  published: item.published,
  sortOrder: item.sortOrder,
});

const toTheme = (theme: FaqTheme): AdminFaqTheme => ({ id: theme.id, name: theme.name, published: theme.published, sortOrder: theme.sortOrder });

// `published` is not here on purpose: saving never publishes, only the publication route does (as in news and events).
const editableColumns = (input: FaqItemInput) => ({ question: input.question, answer: input.answer, themeId: input.themeId, linkTo: input.linkTo, source: input.source });

export function slugify(text: string): string {
  const slug = text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50)
    .replace(/-+$/, '');
  return slug || 'pergunta';
}

async function freeId(exists: (id: string) => Promise<unknown>, text: string): Promise<string> {
  const base = slugify(text);
  for (let suffix = 1; suffix < 1000; suffix += 1) {
    const candidate = suffix === 1 ? base : `${base}-${suffix}`;
    if (!(await exists(candidate))) return candidate;
  }
  throw new ApiError(500, 'internal_error', 'Não foi possível criar o endereço da pergunta.');
}

async function requireTheme(themeId: string): Promise<FaqTheme> {
  const theme = await FaqTheme.findByPk(themeId);
  if (!theme) throw new ApiError(400, 'invalid_theme', 'Escolha um tema que exista.');
  return theme;
}

export async function listAdminFaq() {
  const [themes, items] = await Promise.all([
    FaqTheme.findAll({ order: [['sortOrder', 'ASC']] }),
    FaqItem.findAll({ order: [['sortOrder', 'ASC'], ['id', 'ASC']] }),
  ]);
  return {
    themes: themes.map(toTheme),
    items: items.map(toItem),
    options: { links: FAQ_LINKS.map((link) => ({ ...link })), sources: FAQ_SOURCES.map((source) => ({ ...source })) },
  };
}

export async function createFaqItem(input: FaqItemInput): Promise<AdminFaqItem> {
  await requireTheme(input.themeId);
  const last = (await FaqItem.max<number, FaqItem>('sortOrder', { where: { themeId: input.themeId } })) ?? 0;
  const item = await FaqItem.create({ id: await freeId((candidate) => FaqItem.findByPk(candidate), input.question), ...editableColumns(input), sortOrder: last + 1, published: false });
  return toItem(item);
}

export async function updateFaqItem(id: string, input: FaqItemInput): Promise<AdminFaqItem> {
  const item = await FaqItem.findByPk(id);
  if (!item) throw itemNotFound();
  await requireTheme(input.themeId);
  const moved = input.themeId !== item.themeId;
  const last = moved ? ((await FaqItem.max<number, FaqItem>('sortOrder', { where: { themeId: input.themeId } })) ?? 0) : item.sortOrder - 1;
  await item.update({ ...editableColumns(input), sortOrder: last + 1 }, { fields: ['question', 'answer', 'themeId', 'linkTo', 'source', 'sortOrder'] });
  return toItem(item);
}

export async function setFaqItemPublished(id: string, published: boolean): Promise<AdminFaqItem> {
  const item = await FaqItem.findByPk(id);
  if (!item) throw itemNotFound();
  await item.update({ published }, { fields: ['published'] });
  return toItem(item);
}

type Orderable = { id: string; sortOrder: number; update: (values: { sortOrder: number }, options: { transaction: Transaction; fields: string[] }) => Promise<unknown> };

async function swap(siblings: Orderable[], id: string, direction: Direction, transaction: Transaction): Promise<void> {
  const from = siblings.findIndex((sibling) => sibling.id === id);
  const to = direction === 'up' ? from - 1 : from + 1;
  if (to < 0 || to >= siblings.length) return;
  const order = [...siblings];
  [order[from], order[to]] = [order[to]!, order[from]!];
  for (const [index, sibling] of order.entries()) {
    if (sibling.sortOrder !== index + 1) await sibling.update({ sortOrder: index + 1 }, { transaction, fields: ['sortOrder'] });
  }
}

export async function moveFaqItem(id: string, direction: Direction): Promise<AdminFaqItem> {
  const item = await FaqItem.findByPk(id);
  if (!item) throw itemNotFound();
  await sequelize.transaction(async (transaction) => {
    const siblings = await FaqItem.findAll({ where: { themeId: item.themeId }, order: [['sortOrder', 'ASC'], ['id', 'ASC']], transaction, lock: transaction.LOCK.UPDATE });
    await swap(siblings, id, direction, transaction);
  });
  return toItem((await FaqItem.findByPk(id)) ?? item);
}

export async function createFaqTheme(name: string): Promise<AdminFaqTheme> {
  if (await FaqTheme.findOne({ where: { name } })) throw nameTaken();
  const last = (await FaqTheme.max<number, FaqTheme>('sortOrder')) ?? 0;
  try {
    return toTheme(await FaqTheme.create({ id: await freeId((candidate) => FaqTheme.findByPk(candidate), name), name, sortOrder: last + 1, published: true }));
  } catch (error) {
    if (error instanceof UniqueConstraintError) throw nameTaken();
    throw error;
  }
}

export async function renameFaqTheme(id: string, name: string): Promise<AdminFaqTheme> {
  const theme = await FaqTheme.findByPk(id);
  if (!theme) throw themeNotFound();
  const same = await FaqTheme.findOne({ where: { name } });
  if (same && same.id !== id) throw nameTaken();
  try {
    await theme.update({ name }, { fields: ['name'] });
  } catch (error) {
    if (error instanceof UniqueConstraintError) throw nameTaken();
    throw error;
  }
  return toTheme(theme);
}

export async function setFaqThemePublished(id: string, published: boolean): Promise<AdminFaqTheme> {
  const theme = await FaqTheme.findByPk(id);
  if (!theme) throw themeNotFound();
  await theme.update({ published }, { fields: ['published'] });
  return toTheme(theme);
}

export async function moveFaqTheme(id: string, direction: Direction): Promise<AdminFaqTheme> {
  if (!(await FaqTheme.findByPk(id))) throw themeNotFound();
  await sequelize.transaction(async (transaction) => {
    const siblings = await FaqTheme.findAll({ order: [['sortOrder', 'ASC'], ['id', 'ASC']], transaction, lock: transaction.LOCK.UPDATE });
    await swap(siblings, id, direction, transaction);
  });
  return toTheme((await FaqTheme.findByPk(id))!);
}
