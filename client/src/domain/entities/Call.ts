/**
 * Call domain entity
 * Represents a phone call in the chat system
 */

export type CallType = "audio" | "video";

export type CallDirection = "incoming" | "outgoing";

export type CallStatus = "answered" | "missed" | "declined";

export interface Call {
  id: string;
  participantId: string;
  participantName: string;
  type: CallType;
  direction: CallDirection;
  status: CallStatus;
  timestamp: Date;
  duration?: number;
}

export interface CreateCallInput {
  participantId: string;
  participantName: string;
  type: CallType;
  direction: CallDirection;
}