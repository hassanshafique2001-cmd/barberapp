/** Turns a raw SDK error into safe, user-facing copy — never the raw `.message` (which for
 * Firebase specifically often literally contains the word "Firebase", handing an attacker a free
 * hint about the backend). Each bucket gets a short internal tag instead ("WB-AUTH"/"WB-DATA"/
 * "WB-GEN") — meaningless to an outsider, but instantly recognizable to us if a user reports it,
 * so we don't need a raw stack trace pasted back to know where to look. */

const AUTH_MESSAGES: Record<string, string> = {
  'auth/invalid-email': 'That email address looks invalid.',
  'auth/user-not-found': 'No account found with that email.',
  'auth/wrong-password': 'Incorrect email or password.',
  'auth/invalid-credential': 'Incorrect email or password.',
  'auth/email-already-in-use': 'An account with that email already exists.',
  'auth/weak-password': 'Please choose a stronger password (6+ characters).',
  'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
  'auth/network-request-failed': 'Network error — check your connection and try again.',
  'auth/user-disabled': 'This account has been disabled.',
  'auth/requires-recent-login': 'Please log out and back in, then try again.',
};

const DATA_MESSAGES: Record<string, string> = {
  'permission-denied': "You don't have permission to do that.",
  'not-found': 'That item could not be found.',
  unavailable: 'Service temporarily unavailable. Please try again.',
  'resource-exhausted': 'Too many requests. Please try again shortly.',
  'deadline-exceeded': 'The request timed out. Please try again.',
  cancelled: 'The request was cancelled.',
};

export function getFriendlyErrorMessage(err: unknown): string {
  const code = (err as { code?: string } | null)?.code;
  const message = (err as { message?: string } | null)?.message;

  // Callable Cloud Function errors (functions/<status>) carry a message we wrote ourselves
  // server-side (see functions/src/index.ts's HttpsError calls) — already safe, show as-is.
  if (code?.startsWith('functions/')) {
    return message || 'Something went wrong. Please try again. (WB-GEN)';
  }

  if (code?.startsWith('auth/')) {
    return `${AUTH_MESSAGES[code] ?? 'Something went wrong. Please try again.'} (WB-AUTH)`;
  }

  // Any other SDK error code (Firestore, Storage, etc.) — sanitize even if we don't have a
  // specific mapping for it, since its raw `.message` comes straight from the SDK.
  if (code) {
    return `${DATA_MESSAGES[code] ?? 'Something went wrong. Please try again.'} (WB-DATA)`;
  }

  // No `.code` at all means this wasn't thrown by a Firebase SDK — almost certainly an error we
  // threw ourselves (e.g. a timeout or a plain validation message), so it's already safe to show.
  if (message) return message;
  return 'Something went wrong. Please try again. (WB-GEN)';
}
