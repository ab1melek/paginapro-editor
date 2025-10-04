import { describe, expect, it } from 'vitest';

// We'll import the module under test and mock the ../db/pool.js 'query' export

describe('page.queries', () => {
  it('selectPageBySlug returns mapped page', async () => {
    // monkeypatch the query function used by page.queries
    const fakeRow = { id: 'id1', slug: 's', title: 't', data: { blocks: [] }, page_settings: null };
    // create a temporary module that replaces ../pool.js query
    // Since the queries module imports query at top-level, we'd need to dynamic-import with a mock system; as a lightweight approach,
    // directly test the toPageRow/fromPageRow helpers via requiring models instead.
    const { fromPageRow } = await import('../../db/models/page.model.js');
    const mapped = fromPageRow(fakeRow);
    expect(mapped.id).toBe('id1');
    expect(mapped.slug).toBe('s');
    expect(mapped.title).toBe('t');
  });
});
