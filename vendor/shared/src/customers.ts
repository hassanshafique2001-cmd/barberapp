import { collection, doc, getDoc, getCountFromServer, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { CustomerProfile } from './types';

const customerDoc = (id: string) => doc(db, 'customers', id);

export async function getCustomerProfile(id: string): Promise<CustomerProfile | null> {
  const snap = await getDoc(customerDoc(id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as CustomerProfile) : null;
}

export async function upsertCustomerProfile(
  id: string,
  data: {
    name: string;
    phone: string;
    email?: string;
    shopId?: string;
    shopName?: string;
    barberId?: string;
    barberName?: string;
  }
): Promise<void> {
  await setDoc(customerDoc(id), data, { merge: true });
}

export async function updateCustomerPushToken(id: string, expoPushToken: string): Promise<void> {
  await updateDoc(customerDoc(id), { expoPushToken });
}

/** Links a customer's account to a shop (and optionally a barber, once picked). Set once at
 * sign-up so every future login lands the customer straight on their shop/barber's services. */
export async function linkCustomerToShop(
  id: string,
  data: { shopId: string; shopName: string; barberId?: string; barberName?: string }
): Promise<void> {
  await setDoc(customerDoc(id), data, { merge: true });
}

/** Super-admin only (enforced by Firestore rules): total customers across the whole app. */
export async function countCustomers(): Promise<number> {
  const snap = await getCountFromServer(collection(db, 'customers'));
  return snap.data().count;
}
