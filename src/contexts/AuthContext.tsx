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
    const { data, error } = await supabase.rpc("get_user_role", { _user_id: userId });
    if (error) {
      console.warn("Failed to fetch user role:", error.message);
      return null;
    }
    if (data === "admin" || data === "creator" || data === "advertiser") {
      return data;
    }
    return null;
  } catch (err) {
    console.warn("Error fetching user role:", err);
    return null;
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  const loadSession = async () => {
    try {
      setLoading(true);
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      
      if (error) {
        console.warn("Failed to get session:", error.message);
        setLoading(false);
        return;
      }
      
      const sessionUser = session?.user ?? null;
      setUser(sessionUser);
      if (sessionUser) {
        const userRole = await fetchUserRole(sessionUser.id);
        setRole(userRole);
      } else {
        setRole(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSession();
    
    try {
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
      return () => subscription?.unsubscribe();
    } catch (err) {
      console.warn("Failed to setup auth listener:", err);
    }
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
