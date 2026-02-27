import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type UserRole = "admin" | "creator" | "advertiser" | null;

interface AuthContextType {
  user: User | null;
  role: UserRole;
  loading: boolean;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true,
  refresh: async () => {},
});

const fetchUserRole = async (userId: string): Promise<UserRole> => {
  try {
    const { data } = await supabase.rpc("get_user_role", { _user_id: userId });
    if (data === "admin" || data === "creator" || data === "advertiser") {
      return data;
    }
    return null;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  const loadSession = async () => {
    setLoading(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const sessionUser = session?.user ?? null;
    setUser(sessionUser);
    if (sessionUser) {
      const userRole = await fetchUserRole(sessionUser.id);
      setRole(userRole);
    } else {
      setRole(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadSession();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const sessionUser = session?.user ?? null;
      setUser(sessionUser);
      if (sessionUser) {
        fetchUserRole(sessionUser.id).then(setRole);
      } else {
        setRole(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        loading,
        refresh: loadSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export const useUserRole = () => {
  const { role, loading } = useAuth();
  return { role, loading };
};
