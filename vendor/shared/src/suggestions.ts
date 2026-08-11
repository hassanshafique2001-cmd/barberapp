import {
  collection,
  doc,
  addDoc,
  updateDoc,
  query,
  orderBy,
  onSnapshot,
  type FirestoreError,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Suggestion, SenderRole } from './types';

const suggestionsCol = () => collection(db, 'suggestions');

export async function submitSuggestion(params: {
  senderId: string;
  senderRole: SenderRole;
  senderName: string;
  shopId?: string;
  title: string;
  details: string;
}): Promise<void> {
  const suggestion: Omit<Suggestion, 'id'> = {
    senderId: params.senderId,
    senderRole: params.senderRole,
    senderName: params.senderName,
    ...(params.shopId ? { shopId: params.shopId } : {}),
    title: params.title.trim(),
    details: params.details.trim(),
    viewedByAdmin: false,
    createdAt: Date.now(),
  };
  await addDoc(suggestionsCol(), suggestion);
}

/** Live list of every suggestion ever sent, newest first — super admin only (see firestore.rules). */
export function subscribeToSuggestions(
  callback: (suggestions: Suggestion[]) => void,
  onError?: (error: FirestoreError) => void
): Unsubscribe {
  const q = query(suggestionsCol(), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Suggestion))), onError);
}

export async function markSuggestionsViewed(ids: string[]): Promise<void> {
  await Promise.all(ids.map((id) => updateDoc(doc(suggestionsCol(), id), { viewedByAdmin: true })));
}
