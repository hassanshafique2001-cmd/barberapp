import { collection, doc, getDoc, getDocs, addDoc, deleteDoc, orderBy, query } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from './firebase';
import type { ServiceCatalogItem } from './types';

const catalogCol = () => collection(db, 'serviceCatalog');

export async function listServiceCatalog(): Promise<ServiceCatalogItem[]> {
  const snap = await getDocs(query(catalogCol(), orderBy('name')));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ServiceCatalogItem));
}

export async function getCatalogItem(itemId: string): Promise<ServiceCatalogItem | null> {
  const snap = await getDoc(doc(catalogCol(), itemId));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as ServiceCatalogItem) : null;
}

/** Super-admin only (enforced by Firestore rules): add a new catalog template. */
export async function createCatalogItem(data: {
  name: string;
  description?: string;
  photoUrl?: string;
}): Promise<string> {
  const docRef = await addDoc(catalogCol(), { ...data, createdAt: Date.now() });
  return docRef.id;
}

/** Super-admin only: remove a catalog template. */
export async function deleteCatalogItem(itemId: string): Promise<void> {
  await deleteDoc(doc(catalogCol(), itemId));
}

/** Uploads a catalog item's photo and returns its public download URL. */
export async function uploadCatalogPhoto(itemId: string, localUri: string): Promise<string> {
  const response = await fetch(localUri);
  const blob = await response.blob();
  const fileRef = ref(storage, `service-catalog-photos/${itemId}.jpg`);
  await uploadBytes(fileRef, blob);
  return getDownloadURL(fileRef);
}

export async function deleteCatalogPhoto(photoUrl: string): Promise<void> {
  try {
    await deleteObject(ref(storage, photoUrl));
  } catch {
    // Already gone — not fatal.
  }
}
