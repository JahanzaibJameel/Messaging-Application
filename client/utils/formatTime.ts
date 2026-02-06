import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import isToday from "dayjs/plugin/isToday";
import isYesterday from "dayjs/plugin/isYesterday";

dayjs.extend(relativeTime);
dayjs.extend(isToday);
dayjs.extend(isYesterday);

export function formatMessageTime(timestamp: string): string {
  return dayjs(timestamp).format("h:mm A");
}

export function formatChatListTime(timestamp: string): string {
  const date = dayjs(timestamp);
  
  if (date.isToday()) {
    return date.format("h:mm A");
  }
  
  if (date.isYesterday()) {
    return "Yesterday";
  }
  
  const daysAgo = dayjs().diff(date, "day");
  if (daysAgo < 7) {
    return date.format("dddd");
  }
  
  return date.format("M/D/YY");
}

export function formatLastSeen(timestamp: string): string {
  const date = dayjs(timestamp);
  
  if (date.isToday()) {
    return `last seen today at ${date.format("h:mm A")}`;
  }
  
  if (date.isYesterday()) {
    return `last seen yesterday at ${date.format("h:mm A")}`;
  }
  
  return `last seen ${date.format("M/D/YY")} at ${date.format("h:mm A")}`;
}

export function formatCallDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

export function formatStatusTime(timestamp: string): string {
  return dayjs(timestamp).fromNow();
}
