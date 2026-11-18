// Colour of each signer's signature boxes, by signing position (signer 1, 2, 3 ...).
// Fixed rather than random, so a signer keeps the same colour every time and on the
// signing page (the colour is saved with each box). Distinct from each other and
// never green (green means "signed" elsewhere in the app).
export const SIGNER_COLORS = [
  '#d97706', // amber
  '#7c3aed', // purple
  '#0891b2', // cyan
  '#db2777', // pink
  '#2563eb', // blue
  '#c2410c', // burnt orange
  '#4f46e5', // indigo
  '#be123c', // rose
  '#0369a1', // sky
  '#9333ea', // violet
];

export const signerColor = (index) => SIGNER_COLORS[((index % SIGNER_COLORS.length) + SIGNER_COLORS.length) % SIGNER_COLORS.length];
