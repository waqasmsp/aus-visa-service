import { CONTACT_ENTRIES_KEY, ContactEntry } from '../types/contact';

const readRawEntries = (): ContactEntry[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  const raw = window.localStorage.getItem(CONTACT_ENTRIES_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as ContactEntry[];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((item) => {
      if (!item || typeof item !== 'object') {
        return false;
      }

      return (
        typeof item.id === 'string' &&
        typeof item.name === 'string' &&
        typeof item.phone === 'string' &&
        typeof item.email === 'string' &&
        typeof item.subject === 'string' &&
        typeof item.message === 'string' &&
        typeof item.createdAt === 'string'
      );
    });
  } catch {
    return [];
  }
};

const writeEntries = (entries: ContactEntry[]): void => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(CONTACT_ENTRIES_KEY, JSON.stringify(entries));
};

export const getContactEntries = (): ContactEntry[] =>
  readRawEntries().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

export const addContactEntry = (payload: Omit<ContactEntry, 'id' | 'createdAt'>): ContactEntry => {
  const entry: ContactEntry = {
    id: `contact-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    ...payload
  };

  const existing = readRawEntries();
  writeEntries([entry, ...existing]);
  return entry;
};
