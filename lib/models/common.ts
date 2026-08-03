export type EntityId = string;
export type IsoTimestamp = string;
export type CurrencyCode = "MAD" | "USD" | "EUR" | "GBP";
export type LocaleCode = "ar" | "fr" | "en";

export interface Timestamped {
  createdAt?: IsoTimestamp;
  updatedAt?: IsoTimestamp;
}

export interface OwnedEntity {
  ownerId?: EntityId;
  organizationId?: EntityId;
}

export interface ContactInfo {
  person?: string;
  email?: string;
  phone?: string;
  website?: string;
  hours?: string;
}

export interface Address {
  country?: string;
  city?: string;
  location?: string;
}

export type WorkloadStatus = "Low" | "Balanced" | "High" | "Overloaded";
export type VerificationStatus = "Verified" | "Pending" | "Rejected" | "Unverified";
