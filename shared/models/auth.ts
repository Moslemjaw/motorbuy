export interface User {
  id: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  profileImageUrl?: string | null;
  bio?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export interface UpsertUser {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  bio?: string;
  phone?: string;
  address?: string;
  city?: string;
}

export interface Session {
  sid: string;
  sess: any;
  expire: Date;
}
