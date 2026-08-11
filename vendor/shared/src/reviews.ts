import {
  collection,
  doc,
  setDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  type FirestoreError,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Review } from './types';

const reviewsCol = () => collection(db, 'reviews');

/** Submits a review for a completed booking. Uses the booking's own id as the review's doc id —
 * combined with firestore.rules only allowing `create` (never `update`) here, this makes
 * double-reviewing the same booking structurally impossible rather than something the UI has to
 * prevent on its own. */
export async function submitReview(params: {
  bookingId: string;
  shopId: string;
  barberId: string;
  barberName: string;
  customerId: string;
  customerName: string;
  serviceName: string;
  rating: number;
  comment?: string;
}): Promise<void> {
  const review: Omit<Review, 'id'> = {
    bookingId: params.bookingId,
    shopId: params.shopId,
    barberId: params.barberId,
    barberName: params.barberName,
    customerId: params.customerId,
    customerName: params.customerName,
    serviceName: params.serviceName,
    rating: Math.round(params.rating),
    ...(params.comment?.trim() ? { comment: params.comment.trim() } : {}),
    createdAt: Date.now(),
  };
  await setDoc(doc(reviewsCol(), params.bookingId), review);
}

/** Live list of every review a barber has received, newest first. */
export function subscribeToBarberReviews(
  barberId: string,
  callback: (reviews: Review[]) => void,
  onError?: (error: FirestoreError) => void
): Unsubscribe {
  const q = query(reviewsCol(), where('barberId', '==', barberId), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Review))), onError);
}

/** Live list of every review a customer has submitted — used to know which of their completed
 * bookings still need the "Rate this appointment" prompt. */
export function subscribeToCustomerReviews(
  customerId: string,
  callback: (reviews: Review[]) => void,
  onError?: (error: FirestoreError) => void
): Unsubscribe {
  const q = query(reviewsCol(), where('customerId', '==', customerId));
  return onSnapshot(q, (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Review))), onError);
}

export function getRatingStats(reviews: Review[]): { average: number; count: number } {
  if (reviews.length === 0) return { average: 0, count: 0 };
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return { average: sum / reviews.length, count: reviews.length };
}
