import {
  collection,
  collectionGroup,
  doc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  type FirestoreError,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Booking, BookingStatus } from './types';

const bookingsCol = (shopId: string) => collection(db, 'shops', shopId, 'bookings');

export async function createBooking(
  shopId: string,
  data: Omit<Booking, 'id' | 'shopId' | 'status' | 'viewedByBarber' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const now = Date.now();
  const ref = await addDoc(bookingsCol(shopId), {
    shopId,
    ...data,
    status: 'pending' as BookingStatus,
    viewedByBarber: false,
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export async function updateBookingStatus(
  shopId: string,
  bookingId: string,
  status: BookingStatus
): Promise<void> {
  await updateDoc(doc(bookingsCol(shopId), bookingId), { status, updatedAt: Date.now() });
}

/** Marks a set of a barber's bookings as seen, so the Bookings tab's "new request" dot clears.
 * Called once the barber actually opens the bookings list — not on every data refresh — otherwise
 * the dot would never get a chance to show. */
export async function markBookingsViewed(shopId: string, bookingIds: string[]): Promise<void> {
  await Promise.all(
    bookingIds.map((id) => updateDoc(doc(bookingsCol(shopId), id), { viewedByBarber: true }))
  );
}

/** Live updates for one barber's bookings within their shop. */
export function subscribeToBarberBookings(
  shopId: string,
  barberId: string,
  callback: (bookings: Booking[]) => void,
  onError?: (error: FirestoreError) => void
): Unsubscribe {
  const q = query(bookingsCol(shopId), where('barberId', '==', barberId), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Booking))),
    onError
  );
}

/** Live updates for which time slots a barber already has booked on a given date — used by the
 * customer app to compute open slots and grey out ones another customer just took, in real time.
 * Reads a small server-maintained doc (`shops/{shopId}/slotAvailability/{barberId}_{date}`,
 * recomputed by a Cloud Function whenever a booking for that barber+date changes) instead of the
 * bookings themselves, since Firestore rules only let a customer read their OWN booking docs —
 * this doc only ever contains `{barberId, date, timeSlots}`, never other customers' info. */
export function subscribeToSlotAvailability(
  shopId: string,
  barberId: string,
  date: string,
  callback: (timeSlots: string[]) => void,
  onError?: (error: FirestoreError) => void
): Unsubscribe {
  const ref = doc(db, 'shops', shopId, 'slotAvailability', `${barberId}_${date}`);
  return onSnapshot(
    ref,
    (snap) => callback((snap.data()?.timeSlots as string[] | undefined) ?? []),
    onError
  );
}

/** Live updates for a customer's bookings across all shops (Firestore collectionGroup query). */
export function subscribeToCustomerBookings(
  customerId: string,
  callback: (bookings: Booking[]) => void,
  onError?: (error: FirestoreError) => void
): Unsubscribe {
  const q = query(
    collectionGroup(db, 'bookings'),
    where('customerId', '==', customerId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Booking))),
    onError
  );
}
