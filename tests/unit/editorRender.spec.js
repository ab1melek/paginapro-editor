import { describe, expect, it } from 'vitest';
import { extractPageSettingsFromBlocks, normalize } from '../../components/utils/editorRender.js';

describe('editorRender utils', () => {
  it('normalize accepts root object with blocks', () => {
    const data = { blocks: [ { type: 'header', id: 'h1', data: { text: 'hi' } } ], pageSettings: { layout: 'landing' } };
    const res = normalize(data);
    expect(res.blocks.length).toBe(1);
    expect(res.pageSettings.layout).toBe('landing');
  });

  it('normalize accepts wrapper array', () => {
    const data = [ { blocks: [ { type: 'paragraph', id: 'p1', data: { text: 'ok' } } ] } ];
    const res = normalize(data);
    expect(res.blocks.length).toBe(1);
  });

  it('extractPageSettingsFromBlocks returns settings object', () => {
    const blocks = [ { type: 'pageSettings', data: { backgroundColor: '#fff', maxWidth: 800 } } ];
    const out = extractPageSettingsFromBlocks(blocks);
    expect(out.backgroundColor).toBe('#fff');
    expect(out.maxWidth).toBe(800);
  });
});
