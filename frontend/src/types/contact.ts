export type ContactEntry = {
  id: string;
  name: string;
  phone: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
};

export const CONTACT_ENTRIES_KEY = 'aus-visa-contact-entries';
