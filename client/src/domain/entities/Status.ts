/**
 * Status domain entity
 * Represents a user's status update
 */

export interface Status {
  id: string;
  userId: string;
  imageUrl?: string;
  timestamp: Date;
  viewed: boolean;
  expiresAt: Date;
}

export interface StatusUpdate {
  imageUrl?: string;
  expiresAt?: Date;
}