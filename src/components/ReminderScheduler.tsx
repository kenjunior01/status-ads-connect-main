import { useEffect } from "react";
import { useReminders } from "@/hooks/useReminders";

export const ReminderScheduler = () => {
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);
  useReminders();
  return null;
}
