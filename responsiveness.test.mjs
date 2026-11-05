import assert from 'node:assert/strict';
import test from 'node:test';
import { writeFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
const { mountToolGrouping } = await import(process.env.MINUS_GROUP_SOURCE ?? './group-tools.ts');
import { QUOTES } from './quotes.ts';

const measurements = [];
test.after(() => {
  if (process.env.MINUS_RESPONSIVENESS_REPORT) {
    writeFileSync(process.env.MINUS_RESPONSIVENESS_REPORT, JSON.stringify(measurements, null, 2) + '\n');
  }
});

async function fixture(run) {
  const dom = new JSDOM('<!doctype html><html><head></head><body><aside>sidebar</aside><main></main></body></html>', { pretendToBeVisual: true });
  const { window } = dom, { document } = window;
  const previous = new Map(), frames = new Map(), panes = new Map(), fetches = new Map(), reads = new Map(), icons = new Set();
  let sequence = 0, fullScans = 0, notify, dispose;
  const query = document.querySelectorAll.bind(document);
  document.querySelectorAll = selector => {
    if (selector === '[data-timeline-items]') fullScans++;
    return query(selector);
  };
  const children = Object.getOwnPropertyDescriptor(window.Element.prototype, 'children');
  Object.defineProperty(window.Element.prototype, 'children', { configurable: true, get() {
    if (reads.has(this)) reads.set(this, reads.get(this) + 1);
    return children.get.call(this);
  } });
  for (const [name, value] of Object.entries({ document, Element: window.Element, HTMLElement: window.HTMLElement,
    MutationObserver: window.MutationObserver,
    IntersectionObserver: class {
      observe(icon) { icons.add(icon); }
      unobserve(icon) { icons.delete(icon); }
      disconnect() { icons.clear(); }
    },
    requestAnimationFrame: callback => { frames.set(++sequence, callback); return sequence; },
    cancelAnimationFrame: id => frames.delete(id),
  })) {
    previous.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
    Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
  }
  const tick = () => new Promise(resolve => setImmediate(resolve));
  async function drain() {
    await tick();
    // Same finite fixture budget as the existing observer/lifecycle regression:
    // ten two-frame transitions; no wall-clock performance threshold or polling.
    for (let i = 0; i < 20 && frames.size; i++) {
      const callbacks = [...frames.values()]; frames.clear();
      for (const callback of callbacks) callback(performance.now());
      await tick();
    }
    assert.equal(frames.size, 0, 'finite updates settle');
  }
  function pane(id) {
    const list = document.createElement('section'), items = document.createElement('div'), row = document.createElement('div');
    list.dataset.timelineRowList = 'top-level'; items.dataset.timelineItems = '';
    row.dataset.timelineRowId = id + ':tool:first'; row.textContent = 'native work';
    items.append(row); list.append(items); document.querySelector('main').append(list);
    const data = { list, items, row, rows: [{ id: row.dataset.timelineRowId, kind: 'work', status: 'completed' }] };
    panes.set(id, data); reads.set(items, 0); return data;
  }
  const alpha = pane('thr_alpha'), beta = pane('thr_beta');
  function snapshot() {
    return { alpha: reads.get(alpha.items), beta: reads.get(beta.items), fullScans,
      alphaFetches: fetches.get('thr_alpha') ?? 0, betaFetches: fetches.get('thr_beta') ?? 0 };
  }
  try {
    dispose = mountToolGrouping(async id => {
      fetches.set(id, (fetches.get(id) ?? 0) + 1); return panes.get(id)?.rows ?? [];
    }, () => QUOTES[0], undefined, callback => { notify = callback; return () => {}; });
    await drain();
    await run({ window, document, alpha, beta, pane, drain, snapshot, icons, notify: (...args) => notify(...args) });
  } finally {
    try {
      dispose?.();
      assert.equal(frames.size, 0, 'dispose cancels own frames');
      assert.equal(icons.size, 0, 'dispose disconnects all animation observations');
      assert.equal(query('[data-bb-minus-group], [data-bb-minus-hidden]').length, 0, 'dispose restores native presentation');
    } finally {
      for (const [name, descriptor] of previous) {
        if (descriptor) Object.defineProperty(globalThis, name, descriptor); else delete globalThis[name];
      }
      window.close();
    }
  }
}

test('Minus-owned feedback and animation changes do not reprocess native timelines', async () => {
  await fixture(async ({ alpha, beta, drain, snapshot }) => {
    const before = snapshot(), marker = alpha.items.querySelector('[data-bb-minus-group]');
    marker.querySelector('[data-like-status]').textContent = 'Saving';
    marker.querySelector('[data-minus-icon]').style.animationPlayState = 'paused';
    await drain();
    const after = snapshot(); measurements.push({ name: 'owned-feedback', before, after });
    assert.deepEqual(after, before, 'plugin-owned presentation cannot start another grouping pass');
    assert.equal(beta.items.querySelector('[data-count]').textContent, '1 tool');
  });
});

test('finite streaming and API updates only process their own conversation', async () => {
  await fixture(async ({ alpha, beta, drain, snapshot, notify }) => {
    const marker = beta.items.querySelector('[data-bb-minus-group]'), focused = marker.querySelector('[data-metrics]');
    focused.focus(); const before = snapshot();
    // Three distinct deliveries, matching a finite native work-title stream.
    for (const text of ['reading', 'checking', 'done']) { alpha.row.firstChild.data = text; await drain(); }
    alpha.rows[0].status = 'error'; notify('thr_alpha', true); await drain();
    const after = snapshot(); measurements.push({ name: 'stream-and-api', before, after });
    assert(after.alpha > before.alpha, 'changed conversation updates');
    assert.equal(after.beta, before.beta, 'unrelated conversation is not traversed');
    assert.equal(after.fullScans, before.fullScans, 'known-root updates need no body discovery');
    assert.equal(after.betaFetches, before.betaFetches, 'API cadence of other panes is unchanged');
    assert.equal(beta.items.querySelector('[data-bb-minus-group]'), marker);
    assert.equal(beta.items.ownerDocument.activeElement, focused);
    assert.equal(alpha.items.querySelector('[data-activity-label]').textContent, 'Completed with errors');
  });
});

test('scoped updates retain mount, nested discovery, identity changes and teardown', async () => {
  await fixture(async ({ window, document, alpha, beta, pane, drain, snapshot, icons, notify }) => {
    const before = snapshot();
    const gamma = pane('thr_gamma'); await drain();
    assert.equal(gamma.items.querySelector('[data-count]').textContent, '1 tool');
    beta.list.remove(); await drain();
    assert([...icons].every(icon => icon.isConnected), 'unmounted panes release intersection observations');
    document.querySelector('main').append(beta.list); await drain();
    assert(icons.has(beta.items.querySelector('[data-minus-icon]')), 'remounted marker resumes observation');
    assert.equal(beta.items.querySelectorAll('[data-bb-minus-group]').length, 1);
    const extra = document.createElement('div'); extra.dataset.timelineRowId = 'thr_alpha:tool:second';
    alpha.rows.push({ id: extra.dataset.timelineRowId, kind: 'work', status: 'completed' });
    alpha.items.append(extra); notify('thr_alpha', true); await drain();
    assert.equal(alpha.items.querySelector('[data-count]').textContent, '2 tools');
    const turn = document.createElement('div'); turn.dataset.timelineRowId = 'thr_gamma:t1:turn:0';
    const root = document.createElement('div'), header = document.createElement('div');
    header.className = 'group/timeline-row';
    const button = document.createElement('button'); button.setAttribute('aria-expanded', 'true');
    header.append(button); root.append(header); turn.append(root);
    const child = document.createElement('div'); child.dataset.timelineRowList = 'nested';
    const items = document.createElement('div'); items.dataset.timelineItems = '';
    const work = document.createElement('div'); work.dataset.timelineRowId = 'thr_gamma:tool:first';
    items.append(work); child.append(items); root.append(child); gamma.items.append(turn); await drain();
    assert.equal(items.querySelector('[data-count]').textContent, '1 tool');
    work.dataset.timelineRowId = 'thr_gamma:assistant:message'; await drain();
    assert.equal(items.querySelector('[data-bb-minus-group]'), null);
    assert.equal(work.hasAttribute('data-bb-minus-hidden'), false);
    gamma.list.remove(); await drain();
    assert([...icons].every(icon => icon.isConnected), 'removed nested panes release observations');
    measurements.push({ name: 'lifecycle', before, after: snapshot() });
    assert.equal(document.querySelectorAll('[data-bb-minus-group]').length, 2);
  });
});
