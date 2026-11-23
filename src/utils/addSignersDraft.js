// Keeps the open "Send for signing" (Add signers) dialog in this browser tab's own storage,
// so a reload of the same tab brings you back to where you were. Removed as soon as the
// dialog closes (sent, cancelled or closed). sessionStorage: it never leaves the tab, and
// is gone when the tab is closed (it holds signer emails and phone numbers).
const KEY = 'dss_add_signers_draft';

export function readDraft() {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// The draft for one document (or null).
export function readDraftFor(file) {
  const d = readDraft();
  return d && file && d.file === file ? d : null;
}

export function writeDraft(draft) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ ...draft, savedAt: Date.now() }));
  } catch {
    /* storage full or unavailable: nothing to restore later, nothing breaks now */
  }
}

export function clearDraft() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
