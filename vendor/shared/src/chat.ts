import {
  collection,
  doc,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  increment,
  query,
  where,
  orderBy,
  onSnapshot,
  type FirestoreError,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Chat, ChatMessage, ChatSenderRole } from './types';

const chatsCol = () => collection(db, 'chats');
const messagesCol = (chatId: string) => collection(db, 'chats', chatId, 'messages');

/** Deterministic id so a barber and customer always share exactly one thread. */
export function getChatId(barberId: string, customerId: string): string {
  return `${barberId}_${customerId}`;
}

/** Creates the chat thread on first contact; a no-op if it already exists. */
export async function ensureChat(params: {
  barberId: string;
  customerId: string;
  shopId: string;
  barberName: string;
  customerName: string;
}): Promise<string> {
  const chatId = getChatId(params.barberId, params.customerId);
  const ref = doc(chatsCol(), chatId);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    const chat: Omit<Chat, 'id'> = {
      barberId: params.barberId,
      customerId: params.customerId,
      shopId: params.shopId,
      barberName: params.barberName,
      customerName: params.customerName,
      lastMessage: '',
      lastMessageAt: Date.now(),
      lastSenderRole: 'customer',
      unreadForBarber: 0,
      unreadForCustomer: 0,
      createdAt: Date.now(),
    };
    await setDoc(ref, chat);
  }
  return chatId;
}

export async function sendChatMessage(params: {
  chatId: string;
  senderId: string;
  senderRole: ChatSenderRole;
  text: string;
}): Promise<void> {
  const trimmed = params.text.trim();
  if (!trimmed) return;
  const now = Date.now();

  await addDoc(messagesCol(params.chatId), {
    senderId: params.senderId,
    senderRole: params.senderRole,
    text: trimmed,
    createdAt: now,
  });

  await updateDoc(doc(chatsCol(), params.chatId), {
    lastMessage: trimmed,
    lastMessageAt: now,
    lastSenderRole: params.senderRole,
    ...(params.senderRole === 'barber' ? { unreadForCustomer: increment(1) } : { unreadForBarber: increment(1) }),
  });
}

export function subscribeToChatMessages(
  chatId: string,
  callback: (messages: ChatMessage[]) => void,
  onError?: (error: FirestoreError) => void
): Unsubscribe {
  const q = query(messagesCol(chatId), orderBy('createdAt', 'asc'));
  return onSnapshot(q, (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ChatMessage))), onError);
}

/** Live list of every conversation a barber is part of, most recent first. */
export function subscribeToBarberChats(
  barberId: string,
  callback: (chats: Chat[]) => void,
  onError?: (error: FirestoreError) => void
): Unsubscribe {
  const q = query(chatsCol(), where('barberId', '==', barberId), orderBy('lastMessageAt', 'desc'));
  return onSnapshot(q, (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Chat))), onError);
}

/** Live list of every conversation a customer is part of, most recent first. */
export function subscribeToCustomerChats(
  customerId: string,
  callback: (chats: Chat[]) => void,
  onError?: (error: FirestoreError) => void
): Unsubscribe {
  const q = query(chatsCol(), where('customerId', '==', customerId), orderBy('lastMessageAt', 'desc'));
  return onSnapshot(q, (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Chat))), onError);
}

export async function markChatRead(chatId: string, role: ChatSenderRole): Promise<void> {
  await updateDoc(doc(chatsCol(), chatId), role === 'barber' ? { unreadForBarber: 0 } : { unreadForCustomer: 0 });
}
