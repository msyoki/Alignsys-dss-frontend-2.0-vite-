// Email address check for signers (practical subset of RFC 5321/5322, what mail servers accept).
//   name part: letters, digits and ! # $ % & ' * + / = ? ^ _ ` { | } ~ -, dots between them
//              (not first, last or doubled), at most 64 characters
//   domain:    dot-separated labels of letters, digits and inner hyphens (1-63 characters),
//              ending in a top-level domain of 2+ letters (or an xn-- international one)
//   whole:     at most 254 characters, no spaces
const LOCAL_RE = /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*$/;
const LABEL_RE = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?$/;
const TLD_RE = /^(?:[A-Za-z]{2,63}|xn--[A-Za-z0-9-]{2,59})$/;

export function isValidEmail(value) {
  const email = String(value ?? '');
  if (!email || email.length > 254 || /\s/.test(email)) return false;
  const at = email.lastIndexOf('@');
  if (at < 1 || at === email.length - 1) return false;
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  if (local.length > 64 || !LOCAL_RE.test(local)) return false;
  const labels = domain.split('.');
  if (labels.length < 2) return false;
  if (!labels.every((l) => LABEL_RE.test(l))) return false;
  return TLD_RE.test(labels[labels.length - 1]);
}

export default isValidEmail;
