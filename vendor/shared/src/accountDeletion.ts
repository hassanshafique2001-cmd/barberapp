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
import type { AccountDeletionRequest, SenderRole } from './types';

const requestsCol = () => collection(db, 'accountDeletionRequests');

export async function submitAccountDeletionRequest(params: {
  senderId: string;
  senderRole: SenderRole;
  senderName: string;
  email?: string;
  phone?: string;
  shopId?: string;
}): Promise<void> {
  const request: Omit<AccountDeletionRequest, 'id'> = {
    senderId: params.senderId,
    senderRole: params.senderRole,
    senderName: params.senderName,
    ...(params.email ? { email: params.email } : {}),
    ...(params.phone ? { phone: params.phone } : {}),
    ...(params.shopId ? { shopId: params.shopId } : {}),
    status: 'pending',
    viewedByAdmin: false,
    createdAt: Date.now(),
  };
  await addDoc(requestsCol(), request);
}

/** Live list of every account-deletion request ever sent, newest first — super admin only. */
export function subscribeToAccountDeletionRequests(
  callback: (requests: AccountDeletionRequest[]) => void,
  onError?: (error: FirestoreError) => void
): Unsubscribe {
  const q = query(requestsCol(), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as AccountDeletionRequest))),
    onError
  );
}

export async function markDeletionRequestsViewed(ids: string[]): Promise<void> {
  await Promise.all(ids.map((id) => updateDoc(doc(requestsCol(), id), { viewedByAdmin: true })));
}

export async function markDeletionRequestHandled(id: string): Promise<void> {
  await updateDoc(doc(requestsCol(), id), { status: 'handled' });
}
