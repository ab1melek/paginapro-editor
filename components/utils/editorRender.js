// Utilities shared between client and server EditorRender implementations

export function normalize(data) {
  if (!data) return { blocks: [] };
  if (data.blocks) return data;
  if (Array.isArray(data)) {
    const first = data[0];
    if (first?.blocks) return first;
  }
  return { blocks: [] };
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
