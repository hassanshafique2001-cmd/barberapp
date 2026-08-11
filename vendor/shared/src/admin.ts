import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

interface CreateBarberInput {
  shopId: string;
  name: string;
  email: string;
  phone?: string;
  password: string;
  barberCode: string;
}

interface CreateBarberResult {
  uid: string;
  email: string;
  password: string;
  barberCode: string;
}

/** Calls the createBarberAccount Cloud Function (super-admin only, enforced server-side). */
export async function createBarberAccount(input: CreateBarberInput): Promise<CreateBarberResult> {
  const fn = httpsCallable<CreateBarberInput, CreateBarberResult>(functions, 'createBarberAccount');
  const res = await fn(input);
  return res.data;
}

interface ResolveBarberCodeResult {
  barberId: string;
  barberName: string;
  shopId: string;
  shopName: string;
}

/** Resolves a barber code to its barber + shop — lets a customer skip picking a shop then a barber. */
export async function resolveBarberCode(barberCode: string): Promise<ResolveBarberCodeResult> {
  const fn = httpsCallable<{ barberCode: string }, ResolveBarberCodeResult>(functions, 'resolveBarberCode');
  const res = await fn({ barberCode });
  return res.data;
}

interface ResolveShopCodeResult {
  shopId: string;
  shopName: string;
}

/** Resolves a shop code to its shop — used by the customer app's sign-up screen, since the
 * customer isn't signed in yet at that point and a direct Firestore read would be denied. */
export async function resolveShopCode(shopCode: string): Promise<ResolveShopCodeResult> {
  const fn = httpsCallable<{ shopCode: string }, ResolveShopCodeResult>(functions, 'resolveShopCode');
  const res = await fn({ shopCode });
  return res.data;
}

interface ShopBarberSummary {
  uid: string;
  name: string;
}

/** Lists the active barbers at a shop — used by the customer app's "Select Your Barber" step. */
export async function listShopBarbers(shopId: string): Promise<ShopBarberSummary[]> {
  const fn = httpsCallable<{ shopId: string }, ShopBarberSummary[]>(functions, 'listShopBarbers');
  const res = await fn({ shopId });
  return res.data;
}

/** Deletes a shop and all its services/availability/bookings (super-admin only). */
export async function deleteShop(shopId: string): Promise<void> {
  const fn = httpsCallable<{ shopId: string }, { success: boolean }>(functions, 'deleteShop');
  await fn({ shopId });
}

/** Permanently deletes a barber's login and profile (super-admin only). */
export async function deleteBarberAccount(uid: string): Promise<void> {
  const fn = httpsCallable<{ uid: string }, { success: boolean }>(functions, 'deleteBarberAccount');
  await fn({ uid });
}

/** Sets a new password for a barber's login (super-admin only). Passwords can never be read back. */
export async function resetBarberPassword(uid: string, newPassword: string): Promise<void> {
  const fn = httpsCallable<{ uid: string; newPassword: string }, { success: boolean }>(
    functions,
    'resetBarberPassword'
  );
  await fn({ uid, newPassword });
}
