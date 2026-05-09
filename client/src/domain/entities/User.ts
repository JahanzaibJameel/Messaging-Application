/**
 * User domain entity
 * Represents a user in the chat system
 */

export interface User {
  id: string;
  name: string;
  phone: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen?: Date;
  status?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  userId: string;
  bio?: string;
  displayName?: string;
  wallpaper?: string;
  settings: UserSettings;
}

export interface UserSettings {
  darkMode: boolean;
  fontSize: "small" | "medium" | "large";
  notifications: boolean;
  soundEnabled: boolean;
  showReadReceipts: boolean;
}

export class UserEntity implements User {
  id: string;
  name: string;
  phone: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen?: Date;
  status?: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(props: User) {
    this.id = props.id;
    this.name = props.name;
    this.phone = props.phone;
    this.avatar = props.avatar;
    this.isOnline = props.isOnline;
    this.lastSeen = props.lastSeen;
    this.status = props.status;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  isActive(): boolean {
    if (!this.lastSeen) return this.isOnline;
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return this.isOnline || this.lastSeen > fiveMinutesAgo;
  }

  getDisplayName(): string {
    return this.name || this.phone;
  }
}
