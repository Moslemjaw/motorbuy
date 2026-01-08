import { User } from "@server/mongodb";

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

export interface UserType {
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

export interface IAuthStorage {
  getUser(id: string): Promise<UserType | undefined>;
  upsertUser(user: UpsertUser): Promise<UserType>;
}

function toPlainUser(doc: any): UserType | undefined {
  if (!doc) return undefined;
  const obj = doc.toObject ? doc.toObject() : doc;
  return {
    id: obj.id || obj._id?.toString(),
    email: obj.email,
    firstName: obj.firstName,
    lastName: obj.lastName,
    profileImageUrl: obj.profileImageUrl,
    bio: obj.bio,
    phone: obj.phone,
    address: obj.address,
    city: obj.city,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  };
}

class AuthStorage implements IAuthStorage {
  async getUser(id: string): Promise<UserType | undefined> {
    const user = await User.findOne({ id });
    return toPlainUser(user);
  }

  async upsertUser(userData: UpsertUser): Promise<UserType> {
    const user = await User.findOneAndUpdate(
      { id: userData.id },
      { ...userData, updatedAt: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    return toPlainUser(user)!;
  }
}

export const authStorage = new AuthStorage();
