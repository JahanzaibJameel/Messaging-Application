import { useAuthStore } from "./authStore";

/**
 * Identity helpers.
 *
 * These exist because three call sites used to compare participant ids against
 * the literal string "currentUser", which only ever matches seeded/mock data —
 * in a real session it silently resolved to the wrong person. Always resolve the
 * signed-in id from the auth store instead.
 */

/**
 * The signed-in user's id, or `null` when signed out.
 *
 * Never returns a placeholder: a fallback string would let an unauthenticated
 * caller "match" a participant that happens to be named that way.
 */
export const getCurrentUserId = (): string | null =>
  useAuthStore.getState().currentUser?.id ?? null;

/** True only when `userId` is the signed-in user. False when signed out. */
export const isCurrentUser = (userId: string): boolean => {
  const currentId = getCurrentUserId();
  return currentId !== null && userId === currentId;
};

/**
 * The other participant of a private chat.
 *
 * Returns `""` when it cannot be determined. When signed in, falls back to the
 * first listed participant so a self-chat or a malformed record still resolves
 * to something rather than `undefined`.
 */
export const getOtherParticipantId = (participantIds: readonly string[]): string => {
  const currentId = getCurrentUserId();
  const other =
    currentId === null
      ? undefined
      : participantIds.find((participantId) => participantId !== currentId);
  return other ?? participantIds[0] ?? "";
};
