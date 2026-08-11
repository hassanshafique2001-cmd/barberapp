import { doc, getDoc, setDoc, collection } from 'firebase/firestore';
import { db } from './firebase';
import type { Availability } from './types';

const availabilityCol = (shopId: string) => collection(db, 'shops', shopId, 'availability');

export async function getAvailability(shopId: string, barberId: string): Promise<Availability | null> {
  const snap = await getDoc(doc(availabilityCol(shopId), barberId));
  return snap.exists() ? (snap.data() as Availability) : null;
}

export async function setAvailability(shopId: string, barberId: string, data: Availability): Promise<void> {
  await setDoc(doc(availabilityCol(shopId), barberId), data);
}
