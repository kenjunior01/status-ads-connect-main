import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useReminders = () => {
  const { toast } = useToast();
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("reminders")
        .select("*")
        .eq("user_id", user.id)
        .eq("sent", false)
        .order("trigger_at", { ascending: true });
      (data || []).forEach(rem => {
        const at = new Date(rem.trigger_at).getTime();
        const now = Date.now();
        const wait = Math.max(0, at - now);
        const id = window.setTimeout(async () => {
          try {
            if ("Notification" in window && Notification.permission === "granted") {
              new Notification(rem.title, { body: rem.description || "" });
            } else {
              toast({ title: rem.title, description: rem.description || "" });
            }
            await supabase.from("reminders").update({ sent: true }).eq("id", rem.id);
          } catch { void 0 }
        }, wait);
        timers.current.push(id);
      });
    };
    load().catch(() => undefined);
    return () => {
      timers.current.forEach(id => window.clearTimeout(id));
      timers.current = [];
    };
  }, [toast]);
};
