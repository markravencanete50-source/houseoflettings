// services/chat.ts
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocs,
  serverTimestamp,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Chat, Message } from '@/lib/types';

// ── Get or create a chat between tenant and landlord ─────────
export async function getOrCreateChat(
  propertyId: string,
  propertyTitle: string,
  landlordId: string,
  tenantId: string,
  tenantName: string,
  landlordName: string
): Promise<string> {
  // Check if a chat already exists for this property+tenant pair
  const q = query(
    collection(db, 'chats'),
    where('propertyId', '==', propertyId),
    where('tenantId', '==', tenantId)
  );

  const snap = await getDocs(q);
  if (!snap.empty) {
    return snap.docs[0].id;
  }

  // Create new chat
  const chatRef = await addDoc(collection(db, 'chats'), {
    propertyId,
    propertyTitle,
    landlordId,
    tenantId,
    tenantName,
    landlordName,
    createdAt: serverTimestamp(),
    lastMessage: '',
    lastMessageAt: serverTimestamp(),
  });

  return chatRef.id;
}

// ── Send a message ────────────────────────────────────────────
export async function sendMessage(
  chatId: string,
  senderId: string,
  senderName: string,
  text: string
): Promise<void> {
  const messagesRef = collection(db, 'chats', chatId, 'messages');
  await addDoc(messagesRef, {
    senderId,
    senderName,
    text,
    timestamp: serverTimestamp(),
  });

  // Update last message on the chat doc
  await updateDoc(doc(db, 'chats', chatId), {
    lastMessage: text,
    lastMessageAt: serverTimestamp(),
  });
}

// ── Subscribe to messages in a chat ──────────────────────────
export function subscribeToMessages(
  chatId: string,
  callback: (messages: Message[]) => void
) {
  const q = query(
    collection(db, 'chats', chatId, 'messages'),
    orderBy('timestamp', 'asc')
  );

  return onSnapshot(q, (snap) => {
    const msgs: Message[] = snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        senderId: data.senderId,
        senderName: data.senderName,
        text: data.text,
        timestamp: data.timestamp instanceof Timestamp
          ? data.timestamp.toDate()
          : new Date(),
      };
    });
    callback(msgs);
  });
}

// ── Get all chats for a user (landlord inbox) ─────────────────
export function subscribeToChats(
  userId: string,
  role: 'landlord' | 'tenant',
  callback: (chats: Chat[]) => void
) {
  const field = role === 'landlord' ? 'landlordId' : 'tenantId';
  const q = query(
    collection(db, 'chats'),
    where(field, '==', userId),
    orderBy('lastMessageAt', 'desc')
  );

  return onSnapshot(q, (snap) => {
    const chats: Chat[] = snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        propertyId: data.propertyId,
        propertyTitle: data.propertyTitle,
        landlordId: data.landlordId,
        tenantId: data.tenantId,
        tenantName: data.tenantName,
        landlordName: data.landlordName,
        createdAt: data.createdAt instanceof Timestamp
          ? data.createdAt.toDate()
          : new Date(),
        lastMessage: data.lastMessage,
        lastMessageAt: data.lastMessageAt instanceof Timestamp
          ? data.lastMessageAt.toDate()
          : new Date(),
      };
    });
    callback(chats);
  });
}

// ── Get a single chat by ID ───────────────────────────────────
export async function getChat(chatId: string): Promise<Chat | null> {
  const snap = await getDoc(doc(db, 'chats', chatId));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    id: snap.id,
    ...data,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
    lastMessageAt: data.lastMessageAt instanceof Timestamp ? data.lastMessageAt.toDate() : new Date(),
  } as Chat;
}
