// Utilities shared between client and server EditorRender implementations

export function extractPageSettingsFromBlocks(blocks) {
  if (!Array.isArray(blocks)) return {};
  const psBlock = blocks.find(b => b?.type === 'pageSettings' && b?.data && typeof b.data === 'object');
  if (!psBlock) return {};
  const d = psBlock.data;
  const out = {};
  if (d.backgroundColor) out.backgroundColor = d.backgroundColor;
  if (d.containerBackgroundColor) out.containerBackgroundColor = d.containerBackgroundColor;
  if (typeof d.containerOpacity === 'number') out.containerOpacity = d.containerOpacity;
  if (typeof d.maxWidth === 'number') out.maxWidth = d.maxWidth;
  return out;
}

export function normalize(data) {
  // Resultado por defecto compatible
  const fallback = { blocks: [], pageSettings: {} };
  if (!data) return fallback;

  // Si ya viene con blocks (objeto raíz)
  if (data.blocks) {
    const blocks = data.blocks || [];
    // Si no hay pageSettings en root, intenta inferirlo desde un bloque 'pageSettings' legado
    const pageSettings = (data.pageSettings && Object.keys(data.pageSettings).length)
      ? data.pageSettings
      : extractPageSettingsFromBlocks(blocks);
    return { blocks, pageSettings };
  }

  // Si nos pasan el array wrapper [obj]
  if (Array.isArray(data)) {
    const first = data[0];
    if (first?.blocks) {
      const blocks = first.blocks || [];
      const pageSettings = (first.pageSettings && Object.keys(first.pageSettings).length)
        ? first.pageSettings
        : extractPageSettingsFromBlocks(blocks);
      return { blocks, pageSettings };
    }
  }

  return fallback;
}

export function getNonEmptyColumns(nested) {
  if (!Array.isArray(nested)) return [];
  let nonEmptyColumns = nested
    .map(col => (Array.isArray(col) ? col : (col?.blocks || [])))
    .filter(arr => Array.isArray(arr) && arr.length);
  if (nonEmptyColumns.length > 4) {
    const extra = nonEmptyColumns.slice(4).flat();
    nonEmptyColumns = nonEmptyColumns.slice(0,4);
    if (extra.length) nonEmptyColumns[3] = [...nonEmptyColumns[3], ...extra];
  }
  return nonEmptyColumns;
}

export function calcWeights(block, nonEmptyColumns) {
  let weights = [];
  if (typeof block.data?.ratio === 'string') {
    weights = block.data.ratio.split(':').map(n => {
      const v = parseFloat(n.trim());
      return Number.isFinite(v) && v > 0 ? v : 1;
    });
  }
  if (weights.length !== nonEmptyColumns.length) {
    if (weights.length > nonEmptyColumns.length) {
      weights = weights.slice(0, nonEmptyColumns.length);
    } else if (weights.length < nonEmptyColumns.length) {
      const diff = nonEmptyColumns.length - weights.length;
      weights = [...weights, ...new Array(diff).fill(1)];
    }
  }
  const total = weights.reduce((a,b)=>a+b,0) || 1;
  return { weights, total };
}

export function makeContainerClass(blockId) {
  return `editor-columns-${blockId}`;
}

export function hasFourColumnsInBlocks(blocks) {
  if (!Array.isArray(blocks)) return false;
  return blocks.some(b => {
    if (!b || b.type !== 'columns') return false;
    const nested = b.data?.blocks;
    if (!Array.isArray(nested)) return false;
    const nonEmpty = getNonEmptyColumns(nested);
    return nonEmpty.length === 4;
  });
}

// Devuelve el máximo número de columnas no vacías (limitadas a 4) presente en los bloques
export function getMaxColumnsInBlocks(blocks) {
  if (!Array.isArray(blocks)) return 0;
  let maxCols = 0;
  for (const b of blocks) {
    if (!b || b.type !== 'columns') continue;
    const nested = b.data?.blocks;
    if (!Array.isArray(nested)) continue;
    const nonEmpty = getNonEmptyColumns(nested);
    if (nonEmpty.length > maxCols) maxCols = nonEmpty.length;
  }
  return maxCols; // 0..4
}
