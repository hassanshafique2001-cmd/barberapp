import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from './firebase';
import type { Service } from './types';

const servicesCol = (shopId: string) => collection(db, 'shops', shopId, 'services');

export async function getService(shopId: string, serviceId: string): Promise<Service | null> {
  const snap = await getDoc(doc(servicesCol(shopId), serviceId));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Service) : null;
}

export async function listServicesForBarber(shopId: string, barberId: string): Promise<Service[]> {
  const q = query(servicesCol(shopId), where('barberId', '==', barberId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Service));
}

export async function createService(
  shopId: string,
  data: {
    barberId: string;
    name: string;
    description?: string;
    price: number;
    durationMinutes: number;
    photoUrl?: string;
  }
): Promise<string> {
  const docRef = await addDoc(servicesCol(shopId), { shopId, ...data });
  return docRef.id;
}

export async function updateService(
  shopId: string,
  serviceId: string,
  data: Partial<Pick<Service, 'name' | 'description' | 'price' | 'durationMinutes' | 'photoUrl'>>
): Promise<void> {
  await updateDoc(doc(servicesCol(shopId), serviceId), data);
}

export async function deleteService(shopId: string, serviceId: string): Promise<void> {
  await deleteDoc(doc(servicesCol(shopId), serviceId));
}

/** Uploads a service photo and returns its public download URL. */
export async function uploadServicePhoto(
  shopId: string,
  barberId: string,
  localUri: string
): Promise<string> {
  const response = await fetch(localUri);
  const blob = await response.blob();
  const fileRef = ref(storage, `service-photos/${shopId}/${barberId}/${Date.now()}.jpg`);
  await uploadBytes(fileRef, blob);
  return getDownloadURL(fileRef);
}

/** Deletes a previously uploaded service photo, given its download URL. */
export async function deleteServicePhoto(photoUrl: string): Promise<void> {
  try {
    await deleteObject(ref(storage, photoUrl));
  } catch {
    // Photo may already be gone (e.g. re-upload) — not fatal.
  }
}
