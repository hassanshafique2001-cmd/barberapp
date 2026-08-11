import { collection, doc, getDoc, getDocs, getCountFromServer, query, where, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { UserProfile } from './types';

const usersCol = () => collection(db, 'users');

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(usersCol(), uid));
  return snap.exists() ? ({ uid: snap.id, ...snap.data() } as UserProfile) : null;
}

export async function listBarbersForShop(shopId: string): Promise<UserProfile[]> {
  const q = query(usersCol(), where('shopId', '==', shopId), where('role', '==', 'barber'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() } as UserProfile));
}

/** Super-admin only: every barber across every shop (used for dashboard stats/graphs). */
export async function listAllBarbers(): Promise<UserProfile[]> {
  const q = query(usersCol(), where('role', '==', 'barber'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() } as UserProfile));
}

export async function updateUserPushToken(uid: string, expoPushToken: string): Promise<void> {
  await updateDoc(doc(usersCol(), uid), { expoPushToken });
}

/** Super-admin only (enforced by Firestore rules): activate/deactivate a barber account. */
export async function setBarberActive(uid: string, isActive: boolean): Promise<void> {
  await updateDoc(doc(usersCol(), uid), { isActive });
}

/** Super-admin only (enforced by Firestore rules): edit a barber's name/phone. */
export async function updateBarberInfo(uid: string, data: { name?: string; phone?: string }): Promise<void> {
  await updateDoc(doc(usersCol(), uid), data);
}

/** Total barber count across all shops, fetched via a server-side aggregation. */
export async function countBarbers(): Promise<number> {
  const snap = await getCountFromServer(query(usersCol(), where('role', '==', 'barber')));
  return snap.data().count;
}
