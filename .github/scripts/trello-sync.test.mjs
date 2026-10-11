import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { LISTS, decide, extractCardIds, sync } from './trello-sync.mjs';

const BOARD = 'board1';
const CARD_ID = 'c'.repeat(24);
const OTHER_CARD_ID = 'd'.repeat(24);

const silent = { info() {}, error() {} };

function startTrello({ cardList, extraLists = [], attachments = [], failMove = false, otherBoardList = 'x-list' } = {}) {
  const lists = [
    { id: 'l-todo', name: LISTS.todo },
    { id: 'l-doing', name: LISTS.doing },
    { id: 'l-review', name: LISTS.review },
    { id: 'l-done', name: LISTS.done },
    ...extraLists,
  ];
  const state = { lists, requests: [], cardList, attachments: [...attachments] };

  const server = createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    state.requests.push({ method: req.method, path: url.pathname, query: Object.fromEntries(url.searchParams), auth: req.headers.authorization });
    const send = (status, body) => {
      res.writeHead(status, { 'content-type': 'application/json' });
      res.end(JSON.stringify(body));
    };
    const card = url.pathname.match(/^\/cards\/([^/]+)(\/attachments)?$/);
    if (url.pathname === `/boards/${BOARD}/lists`) return send(200, state.lists);
    if (card && !card[2] && req.method === 'GET') {
      if (card[1] === 'missing1') return send(404, {});
      if (card[1] === 'foreign1') return send(200, { id: OTHER_CARD_ID, name: 'Foreign', idList: otherBoardList, idBoard: 'other' });
      return send(200, { id: CARD_ID, name: 'Contact form', idList: state.cardList, idBoard: BOARD });
    }
    if (card && card[2] && req.method === 'GET') return send(200, state.attachments);
    if (card && card[2] && req.method === 'POST') {
      state.attachments.push({ url: url.searchParams.get('url') });
      return send(200, {});
    }
    if (card && !card[2] && req.method === 'PUT') {
      if (failMove) return send(500, {});
      state.cardList = url.searchParams.get('idList');
      return send(200, {});
    }
    return send(404, {});
  });

  return new Promise((resolve) => {
    server.listen(0, () => resolve({ server, state, url: `http://localhost:${server.address().port}` }));
  });
}

const pullRequest = (overrides = {}) => ({
  number: 25,
  title: 'feat: contact form',
  body: 'Cards:\nhttps://trello.com/c/8cfNHk4X\nhttps://trello.com/c/BU966O4Z',
  html_url: 'https://github.com/org/repo/pull/25',
  head: { ref: 'feat/contact' },
  draft: false,
  merged: false,
  ...overrides,
});

describe('extractCardIds', () => {
  it('finds every card link in the title, body and branch, once each', () => {
    assert.deepEqual(
      extractCardIds('see https://trello.com/c/8cfNHk4X/rf06', 'dup https://trello.com/c/8cfNHk4X and [x](https://trello.com/c/BU966O4Z)', null),
      ['8cfNHk4X', 'BU966O4Z'],
    );
  });

  it('ignores text that is not a card link', () => {
    assert.deepEqual(extractCardIds('https://trello.com/b/0PhAQ03T/board', 'trello.com/c/abc', undefined), []);
  });
});

describe('decide', () => {
  it('sends an open pull request to review and a draft only attaches', () => {
    assert.equal(decide({ action: 'opened' }).move.to, LISTS.review);
    assert.equal(decide({ action: 'ready_for_review' }).move.to, LISTS.review);
    assert.deepEqual(decide({ action: 'opened', draft: true }), { attach: true, move: null });
  });

  it('moves to done when merged and back to doing when closed without merging', () => {
    assert.equal(decide({ action: 'closed', merged: true }).move.to, LISTS.done);
    assert.deepEqual(decide({ action: 'closed', merged: false }).move, { to: LISTS.doing, from: [LISTS.review] });
  });

  it('does nothing for other actions', () => {
    assert.deepEqual(decide({ action: 'labeled' }), { attach: false, move: null });
  });
});

describe('sync', () => {
  let trello;
  const env = (url) => ({ TRELLO_KEY: 'k', TRELLO_TOKEN: 't', TRELLO_BOARD: BOARD, TRELLO_API_URL: url });
  afterEach(() => trello?.server.close());

  it('does nothing and does not fail when the secrets are not configured', async () => {
    const result = await sync({ env: {}, event: { action: 'opened', pull_request: pullRequest() }, log: silent });
    assert.deepEqual(result, { skipped: true, failures: 0 });
  });

  it('does not call Trello when there is no card link', async () => {
    trello = await startTrello({ cardList: 'l-doing' });
    const event = { action: 'opened', pull_request: pullRequest({ body: 'no link', head: { ref: 'feat/x' } }) };
    const result = await sync({ env: env(trello.url), event, log: silent });
    assert.equal(result.skipped, true);
    assert.equal(trello.state.requests.length, 0);
  });

  describe('when a pull request is opened', () => {
    beforeEach(async () => {
      trello = await startTrello({ cardList: 'l-doing' });
    });

    it('attaches the pull request and moves the card from doing to review', async () => {
      const event = { action: 'opened', pull_request: pullRequest({ body: 'https://trello.com/c/8cfNHk4X' }) };
      const result = await sync({ env: env(trello.url), event, log: silent });

      assert.equal(result.failures, 0);
      assert.deepEqual(trello.state.attachments, [{ url: 'https://github.com/org/repo/pull/25' }]);
      assert.equal(trello.state.cardList, 'l-review');
    });

    it('sends the credentials in the header, never in the address', async () => {
      const event = { action: 'opened', pull_request: pullRequest({ body: 'https://trello.com/c/8cfNHk4X' }) };
      await sync({ env: env(trello.url), event, log: silent });

      for (const request of trello.state.requests) {
        assert.match(request.auth, /oauth_consumer_key="k", oauth_token="t"/);
        assert.equal(request.query.key, undefined);
        assert.equal(request.query.token, undefined);
      }
    });

    it('does not attach twice when it is already attached', async () => {
      trello.state.attachments.push({ url: 'https://github.com/org/repo/pull/25' });
      const event = { action: 'edited', pull_request: pullRequest({ body: 'https://trello.com/c/8cfNHk4X' }) };
      await sync({ env: env(trello.url), event, log: silent });

      assert.equal(trello.state.attachments.length, 1);
      assert.equal(trello.state.requests.filter((request) => request.method === 'POST').length, 0);
    });

    it('keeps a draft where it is and only attaches', async () => {
      const event = { action: 'opened', pull_request: pullRequest({ body: 'https://trello.com/c/8cfNHk4X', draft: true }) };
      await sync({ env: env(trello.url), event, log: silent });

      assert.equal(trello.state.attachments.length, 1);
      assert.equal(trello.state.cardList, 'l-doing');
    });
  });

  it('never drags a card that is already done back to review', async () => {
    trello = await startTrello({ cardList: 'l-done' });
    const event = { action: 'edited', pull_request: pullRequest({ body: 'https://trello.com/c/8cfNHk4X' }) };
    await sync({ env: env(trello.url), event, log: silent });
    assert.equal(trello.state.cardList, 'l-done');
  });

  it('moves the card to done when the pull request is merged', async () => {
    trello = await startTrello({ cardList: 'l-review' });
    const event = { action: 'closed', pull_request: pullRequest({ body: 'https://trello.com/c/8cfNHk4X', merged: true }) };
    const result = await sync({ env: env(trello.url), event, log: silent });

    assert.equal(result.failures, 0);
    assert.equal(trello.state.cardList, 'l-done');
    assert.equal(trello.state.requests.filter((request) => request.method === 'POST').length, 0);
  });

  it('puts the card back to doing when the pull request is closed without merging', async () => {
    trello = await startTrello({ cardList: 'l-review' });
    const event = { action: 'closed', pull_request: pullRequest({ body: 'https://trello.com/c/8cfNHk4X', merged: false }) };
    await sync({ env: env(trello.url), event, log: silent });
    assert.equal(trello.state.cardList, 'l-doing');
  });

  it('ignores a card that is on another board', async () => {
    trello = await startTrello({ cardList: 'l-doing' });
    const event = { action: 'opened', pull_request: pullRequest({ body: 'https://trello.com/c/foreign1' }) };
    const result = await sync({ env: env(trello.url), event, log: silent });

    assert.equal(result.failures, 0);
    assert.equal(trello.state.attachments.length, 0);
    assert.equal(trello.state.requests.filter((request) => request.method !== 'GET').length, 0);
  });

  it('reports a failure, and still handles the other cards, when one card cannot be read', async () => {
    trello = await startTrello({ cardList: 'l-doing' });
    const event = { action: 'opened', pull_request: pullRequest({ body: 'https://trello.com/c/missing1 https://trello.com/c/8cfNHk4X' }) };
    const result = await sync({ env: env(trello.url), event, log: silent });

    assert.equal(result.failures, 1);
    assert.equal(trello.state.cardList, 'l-review');
  });

  it('reports a failure when the review list does not exist on the board', async () => {
    trello = await startTrello({ cardList: 'l-doing' });
    trello.state.lists = trello.state.lists.filter((list) => list.name !== LISTS.review);
    const event = { action: 'opened', pull_request: pullRequest({ body: 'https://trello.com/c/8cfNHk4X' }) };
    const messages = [];
    const result = await sync({ env: env(trello.url), event, log: { info() {}, error: (message) => messages.push(message) } });

    assert.equal(result.failures, 1);
    assert.match(messages[0], /Em revisão/);
    assert.equal(trello.state.cardList, 'l-doing');
  });

  it('reports a failure when Trello refuses the move', async () => {
    trello = await startTrello({ cardList: 'l-doing', failMove: true });
    const event = { action: 'opened', pull_request: pullRequest({ body: 'https://trello.com/c/8cfNHk4X' }) };
    const result = await sync({ env: env(trello.url), event, log: silent });
    assert.equal(result.failures, 1);
  });

  it('reports a failure when the board cannot be read', async () => {
    trello = await startTrello({ cardList: 'l-doing' });
    const event = { action: 'opened', pull_request: pullRequest({ body: 'https://trello.com/c/8cfNHk4X' }) };
    const result = await sync({ env: { ...env(trello.url), TRELLO_BOARD: 'unknown' }, event, log: silent });

    assert.equal(result.failures, 1);
    assert.equal(trello.state.attachments.length, 0);
  });
});
