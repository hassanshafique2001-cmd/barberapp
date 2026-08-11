import {
  collection,
  doc,
  getDoc,
  getDocs,
  getCountFromServer,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Shop } from './types';

const shopsCol = () => collection(db, 'shops');

// Auto-assigned per shop so each card in the admin panel is visually distinct
// without the super-admin having to pick a color manually.
const SHOP_COLOR_PALETTE = [
  '#c0392b',
  '#2980b9',
  '#27ae60',
  '#8e44ad',
  '#d35400',
  '#16a085',
  '#b8860b',
  '#34495e',
];

function pickShopColor(): string {
  return SHOP_COLOR_PALETTE[Math.floor(Math.random() * SHOP_COLOR_PALETTE.length)];
}

export async function getShop(shopId: string): Promise<Shop | null> {
  const snap = await getDoc(doc(shopsCol(), shopId));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Shop) : null;
}

export async function findShopByCode(shopCode: string): Promise<Shop | null> {
  const q = query(shopsCol(), where('shopCode', '==', shopCode.trim().toUpperCase()), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as Shop;
}

const PREFIX_UPPER_BOUND_SUFFIX = '';

/** Simple case-sensitive prefix search on shop name (Firestore has no full-text search). */
export async function searchShopsByName(nameQuery: string): Promise<Shop[]> {
  const trimmed = nameQuery.trim();
  if (!trimmed) return [];
  const q = query(
    shopsCol(),
    orderBy('name'),
    where('name', '>=', trimmed),
    where('name', '<=', trimmed + PREFIX_UPPER_BOUND_SUFFIX),
    limit(20)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Shop));
}

export async function listShops(): Promise<Shop[]> {
  const snap = await getDocs(query(shopsCol(), orderBy('name')));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Shop));
}

export async function createShop(data: {
  name: string;
  shopCode: string;
  address?: string;
  logoUrl?: string;
}): Promise<Shop> {
  const existing = await findShopByCode(data.shopCode);
  if (existing) {
    throw new Error(`Shop code "${data.shopCode.trim().toUpperCase()}" is already used by another shop.`);
  }

  const ref = doc(shopsCol());
  const shop: Omit<Shop, 'id'> = {
    name: data.name,
    shopCode: data.shopCode.trim().toUpperCase(),
    createdAt: Date.now(),
    primaryColor: pickShopColor(),
    ...(data.address ? { address: data.address } : {}),
    ...(data.logoUrl ? { logoUrl: data.logoUrl } : {}),
  };
  await setDoc(ref, shop);
  return { id: ref.id, ...shop };
}

export async function updateShop(
  shopId: string,
  data: Partial<Pick<Shop, 'name' | 'address' | 'logoUrl' | 'primaryColor'>>
): Promise<void> {
  await updateDoc(doc(shopsCol(), shopId), data);
}

/** Total shop count, fetched via a server-side aggregation (doesn't download every document). */
export async function countShops(): Promise<number> {
  const snap = await getCountFromServer(query(shopsCol()));
  return snap.data().count;
}
