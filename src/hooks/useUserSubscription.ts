import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type SubscriptionStatus = "active" | "past_due" | "canceled";

export const useUserSubscription = () => {
  const [subscribed, setSubscribed] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setSubscribed(false);
          setLoading(false);
          return;
        }
        const { data, error } = await supabase
          .from("user_subscriptions")
          .select("*")
          .eq("user_id", user.id)
          .order("current_period_end", { ascending: false })
          .limit(1);
        if (error) throw error;
        const sub = (data || [])[0];
        const now = Date.now();
        const ok = sub && sub.status === "active" && sub.current_period_end && new Date(sub.current_period_end).getTime() > now;
        setSubscribed(Boolean(ok));
      } catch {
        setSubscribed(false);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  return { subscribed, loading };
}
