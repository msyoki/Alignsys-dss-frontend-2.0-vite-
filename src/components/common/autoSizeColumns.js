import React from 'react';

/*
 * Size DataGrid columns to their content: the widest of the header text and the
 * cell values (as displayed), plus padding. MUI's own autosize is Pro-only in
 * v6, so this measures text with a canvas instead.
 *
 *   <DataGrid columns={autoSizeColumns(columns, rows)} ... />
 *
 * Per column you can still set:
 *   minWidth  - never narrower (e.g. a switch + label)
 *   maxWidth  - never wider (default MAX_WIDTH; longer text shows "…")
 *   autoSize: false - keep the declared width as-is
 */

const MAX_WIDTH = 480;
const MIN_WIDTH = 64;
const CELL_PADDING = 32; // 16px each side (DataTable.css)
const HEADER_EXTRA = 30; // sort arrow / column-menu icon
const SAMPLE_ROWS = 300;
// Document titles are the main column: a little extra room, and never too narrow.
const TITLE_FIELDS = ['title'];
const TITLE_EXTRA = 96;
const TITLE_MIN = 280;

let ctx = null;
const cache = new Map();
const font = () => {
  if (typeof document === 'undefined') return 'sans-serif';
  return getComputedStyle(document.body).fontFamily || 'sans-serif';
};
const measure = (text, size, weight = 400, letterSpacingEm = 0, upper = false) => {
  const t = upper ? String(text).toUpperCase() : String(text);
  const key = `${size}|${weight}|${letterSpacingEm}|${t}`;
  if (cache.has(key)) return cache.get(key);
  if (!ctx) ctx = document.createElement('canvas').getContext('2d');
  ctx.font = `${weight} ${size}px ${font()}`;
  const w = ctx.measureText(t).width + t.length * letterSpacingEm * size;
  if (cache.size > 5000) cache.clear();
  cache.set(key, w);
  return w;
};

// Text a rendered cell shows. Plain function components without hooks (dates,
// expiry, chips) are called to get their output; library components (icons,
// buttons, switches) contribute only their text children.
const textOf = (node, depth = 0) => {
  if (node == null || typeof node === 'boolean' || depth > 8) return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map((n) => textOf(n, depth + 1)).join('');
  if (React.isValidElement(node)) {
    const { type, props } = node;
    if (typeof type === 'function' && !(type.prototype && type.prototype.isReactComponent)) {
      try {
        return textOf(type(props), depth + 1);
      } catch {
        return textOf(props?.children, depth + 1);
      }
    }
    return textOf(props?.children, depth + 1);
  }
  return '';
};

const cellText = (col, row) => {
  const value = row?.[col.field];
  try {
    if (col.renderCell) return textOf(col.renderCell({ row, value, field: col.field, id: row?.id, colDef: col }));
    if (col.valueGetter) {
      const v = col.valueGetter({ row, value, field: col.field, id: row?.id, colDef: col });
      return v == null ? '' : String(v);
    }
  } catch {
    return '';
  }
  return value == null ? '' : String(value);
};

export default function autoSizeColumns(columns, rows = []) {
  const sample = Array.isArray(rows) ? rows.slice(0, SAMPLE_ROWS) : [];
  return columns.map((col) => {
    if (col.autoSize === false) return col;
    const header = measure(col.headerName ?? col.field ?? '', 11, 600, 0.06, true) + CELL_PADDING + HEADER_EXTRA;
    let widest = 0;
    for (const row of sample) {
      const text = cellText(col, row);
      if (text) widest = Math.max(widest, measure(text, 13));
    }
    const isTitle = TITLE_FIELDS.includes(col.field);
    const cells = widest ? widest + CELL_PADDING + (isTitle ? TITLE_EXTRA : 0) : 0;
    const max = col.maxWidth ?? MAX_WIDTH;
    const min = Math.max(MIN_WIDTH, col.minWidth ?? 0, isTitle ? TITLE_MIN : 0);
    const width = Math.ceil(Math.min(max, Math.max(min, header, cells)));
    const { flex, ...rest } = col; // a fixed content width replaces any flex
    return { ...rest, width };
  });
}
