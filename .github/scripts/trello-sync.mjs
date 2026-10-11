import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export const LISTS = { todo: 'A fazer', doing: 'Fazendo', review: 'Em revisão', done: 'Feito' };

const CARD_URL = /https:\/\/trello\.com\/c\/([A-Za-z0-9]{8})/g;

export function extractCardIds(...texts) {
  const ids = new Set();
  for (const text of texts) {
    for (const match of String(text ?? '').matchAll(CARD_URL)) ids.add(match[1]);
  }
  return [...ids];
}

export function decide({ action, merged = false, draft = false }) {
  if (action === 'closed') {
    return merged
      ? { attach: false, move: { to: LISTS.done, from: [LISTS.todo, LISTS.doing, LISTS.review] } }
      : { attach: false, move: { to: LISTS.doing, from: [LISTS.review] } };
  }
  if (['opened', 'reopened', 'ready_for_review', 'edited'].includes(action)) {
    return draft
      ? { attach: true, move: null }
      : { attach: true, move: { to: LISTS.review, from: [LISTS.todo, LISTS.doing] } };
  }
  return { attach: false, move: null };
}

function client({ key, token, apiUrl, fetchImpl }) {
  const headers = { Authorization: `OAuth oauth_consumer_key="${key}", oauth_token="${token}"`, Accept: 'application/json' };

  async function call(method, path, params = {}) {
    const url = new URL(`${apiUrl}${path}`);
    for (const [name, value] of Object.entries(params)) url.searchParams.set(name, value);
    const response = await fetchImpl(url, { method, headers });
    if (!response.ok) throw new Error(`${method} ${path} answered ${response.status}`);
    return response.json();
  }

  return {
    card: (id) => call('GET', `/cards/${id}`, { fields: 'name,idList,idBoard' }),
    lists: (board) => call('GET', `/boards/${board}/lists`, { fields: 'name', filter: 'open' }),
    attachments: (id) => call('GET', `/cards/${id}/attachments`, { fields: 'url' }),
    attach: (id, url, name) => call('POST', `/cards/${id}/attachments`, { url, name }),
    move: (id, listId) => call('PUT', `/cards/${id}`, { idList: listId }),
  };
}

export async function sync({ env, event, fetchImpl = fetch, log = console }) {
  const { TRELLO_KEY: key, TRELLO_TOKEN: token, TRELLO_BOARD: board } = env;
  if (!key || !token || !board) {
    log.info('Trello secrets are not configured, nothing to do');
    return { skipped: true, failures: 0 };
  }

  const pr = event.pull_request;
  const ids = extractCardIds(pr.title, pr.body, pr.head?.ref);
  if (ids.length === 0) {
    log.info('No Trello card link in the pull request title, description or branch');
    return { skipped: true, failures: 0 };
  }

  const plan = decide({ action: event.action, merged: pr.merged, draft: pr.draft });
  if (!plan.attach && !plan.move) {
    log.info(`Nothing to do for action ${event.action}`);
    return { skipped: true, failures: 0 };
  }

  const trello = client({ key, token, apiUrl: env.TRELLO_API_URL ?? 'https://api.trello.com/1', fetchImpl });
  let lists;
  try {
    lists = await trello.lists(board);
  } catch (error) {
    log.error(`Board ${board}: ${error.message}`);
    return { skipped: false, failures: 1 };
  }
  const listByName = new Map(lists.map((list) => [list.name, list.id]));
  const nameById = new Map(lists.map((list) => [list.id, list.name]));

  let failures = 0;
  for (const id of ids) {
    try {
      const card = await trello.card(id);
      if (!nameById.has(card.idList)) {
        log.info(`Card ${id} is not on the configured board, ignored`);
        continue;
      }

      if (plan.attach) {
        const attached = await trello.attachments(card.id);
        if (!attached.some((attachment) => attachment.url === pr.html_url)) {
          await trello.attach(card.id, pr.html_url, `PR #${pr.number}: ${pr.title}`);
          log.info(`Attached the pull request to "${card.name}"`);
        }
      }

      if (plan.move) {
        const target = listByName.get(plan.move.to);
        if (!target) throw new Error(`List "${plan.move.to}" does not exist on the board`);
        const current = nameById.get(card.idList);
        if (current !== plan.move.to && plan.move.from.includes(current)) {
          await trello.move(card.id, target);
          log.info(`Moved "${card.name}" from "${current}" to "${plan.move.to}"`);
        }
      }
    } catch (error) {
      failures += 1;
      log.error(`Card ${id}: ${error.message}`);
    }
  }
  return { skipped: false, failures };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
  const { failures } = await sync({ env: process.env, event });
  if (failures > 0) process.exit(1);
}
