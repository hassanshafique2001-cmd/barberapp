export type UserRole = 'barber' | 'superadmin';

export type BookingStatus = 'pending' | 'confirmed' | 'rejected' | 'completed' | 'cancelled';

export interface Shop {
  id: string;
  name: string;
  address?: string;
  logoUrl?: string;
  primaryColor?: string;
  shopCode: string;
  createdAt: number;
}

export interface UserProfile {
  uid: string;
  role: UserRole;
  shopId: string | null;
  name: string;
  email: string;
  phone?: string;
  barberCode?: string;
  expoPushToken?: string;
  isActive: boolean;
  createdAt?: number;
}

export interface Service {
  id: string;
  shopId: string;
  barberId: string;
  name: string;
  description?: string;
  price: number;
  durationMinutes: number;
  photoUrl?: string;
}

/** A predefined service template (super-admin managed) that barbers can pick from
 * instead of typing every service from scratch. No price here — that's set per-barber. */
export interface ServiceCatalogItem {
  id: string;
  name: string;
  description?: string;
  photoUrl?: string;
  createdAt: number;
}

export interface WorkingHours {
  // 0 = Sunday ... 6 = Saturday
  [weekday: number]: { start: string; end: string } | null;
}

export interface Availability {
  barberId: string;
  shopId: string;
  workingHours: WorkingHours;
  slotDurationMinutes: number;
  blockedDates: string[]; // 'YYYY-MM-DD'
}

export interface Booking {
  id: string;
  shopId: string;
  barberId: string;
  barberName?: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  serviceId: string;
  serviceName: string;
  price: number;
  date: string; // 'YYYY-MM-DD'
  timeSlot: string; // 'HH:mm'
  status: BookingStatus;
  viewedByBarber: boolean;
  /** Set server-side once the day-before reminder push has gone out — never written by clients. */
  reminderSent?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface CustomerProfile {
  id: string;
  name: string;
  email?: string;
  phone: string;
  expoPushToken?: string;
  shopId?: string;
  shopName?: string;
  barberId?: string;
  barberName?: string;
}

export type ChatSenderRole = 'barber' | 'customer';

/** One chat thread between a specific barber and a specific customer. Doc id is
 * deterministic (see getChatId), so there's always exactly one thread per pair. */
export interface Chat {
  id: string;
  barberId: string;
  customerId: string;
  shopId: string;
  barberName: string;
  customerName: string;
  lastMessage: string;
  lastMessageAt: number;
  lastSenderRole: ChatSenderRole;
  unreadForBarber: number;
  unreadForCustomer: number;
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderRole: ChatSenderRole;
  text: string;
  createdAt: number;
}

/** Doc id is always the reviewed booking's id — one review per booking, and Firestore's own
 * create-vs-update distinction (see firestore.rules) makes a second submission structurally
 * impossible without any extra bookkeeping on the booking doc itself. */
export interface Review {
  id: string;
  bookingId: string;
  shopId: string;
  barberId: string;
  barberName: string;
  customerId: string;
  customerName: string;
  serviceName: string;
  rating: number; // 1-5, integer
  comment?: string;
  createdAt: number;
}

export type SenderRole = 'barber' | 'customer';

/** A feature/change request sent by a barber or customer, visible to the super admin. */
export interface Suggestion {
  id: string;
  senderId: string;
  senderRole: SenderRole;
  senderName: string;
  shopId?: string;
  title: string;
  details: string;
  viewedByAdmin: boolean;
  createdAt: number;
}

export type AccountDeletionStatus = 'pending' | 'handled';

/** A request from a barber or customer asking the super admin to delete their account.
 * Submitting this does NOT delete anything automatically — the admin still deletes the
 * account manually (Firebase console / a future admin action) and marks it handled. */
export interface AccountDeletionRequest {
  id: string;
  senderId: string;
  senderRole: SenderRole;
  senderName: string;
  email?: string;
  phone?: string;
  shopId?: string;
  status: AccountDeletionStatus;
  viewedByAdmin: boolean;
  createdAt: number;
}
