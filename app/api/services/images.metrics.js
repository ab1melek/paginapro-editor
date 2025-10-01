let counts = { uploads: 0, deletes: 0 };

export function incUpload(n = 1) {
  counts.uploads += n;
  try { console.log(`[images.metrics] uploads=${counts.uploads}`); } catch {}
}

export function incDelete(n = 1) {
  counts.deletes += n;
  try { console.log(`[images.metrics] deletes=${counts.deletes}`); } catch {}
}

export function getMetrics() {
  return { ...counts };
}
