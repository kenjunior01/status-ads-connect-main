import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Profile {
  id: string;
  profile_id: string;
  display_name: string;
  niche: string | null;
  price_range: string | null;
  rating: number;
  total_reviews: number;
  total_campaigns: number;
  is_verified: boolean;
  badge_level: string;
  referral_level: string | null;
  latitude: number | null;
  longitude: number | null;
  country_code: string | null;
  created_at: string;
  updated_at: string;
  trust_score?: number | null;
  primary_niche?: string | null;
  user_id?: string | null;
  contacts_count?: number | null;
}

export const useProfiles = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Prefer RPC ordered by trust score, fallback to direct select
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_top_creators_by_trust', { _limit: 50 });
      
      if (!rpcError && rpcData) {
        const mapped = ((rpcData as unknown[]) || []).map((p) => {
          const row = p as {
            id: string;
            display_name: string;
            niche: string | null;
            price_range: string | null;
            rating?: number | null;
            total_reviews?: number | null;
            total_campaigns?: number | null;
            is_verified?: boolean | null;
            badge_level?: string | null;
            created_at: string;
            trust_score?: number | null;
            primary_niche?: string | null;
          };
          return {
          id: row.id,
          profile_id: row.id,
          display_name: row.display_name,
          niche: row.niche,
          price_range: row.price_range,
          rating: Number(row.rating ?? 0),
          total_reviews: Number(row.total_reviews ?? 0),
          total_campaigns: Number(row.total_campaigns ?? 0),
          is_verified: Boolean(row.is_verified),
          badge_level: row.badge_level || 'bronze',
          created_at: row.created_at,
          updated_at: row.created_at,
          trust_score: row.trust_score ?? null,
          primary_niche: row.primary_niche ?? row.niche ?? null,
          user_id: null,
          contacts_count: null,
        } as Profile;
        });
        setProfiles(mapped);
      } else {
        const { data, error } = await supabase
          .from('creator_listings')
          .select('*, profiles(user_id, trust_score, primary_niche, contacts_count)')
          .not('display_name', 'is', null)
          .order('rating', { ascending: false })
          .limit(50);

        if (error) {
          console.error('Error fetching profiles:', error);
          throw error;
        }

        const mapped = (data || []).map((p) => {
          const row = p as Profile & {
            profiles?: { user_id?: string | null; trust_score?: number | null; primary_niche?: string | null; contacts_count?: number | null };
          };
          return {
            ...row,
            trust_score: row.profiles?.trust_score ?? null,
            primary_niche: row.profiles?.primary_niche ?? row.niche ?? null,
            user_id: row.profiles?.user_id ?? null,
            contacts_count: row.profiles?.contacts_count ?? null,
          } as Profile;
        });
        setProfiles(mapped);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar perfis';
      setError(errorMessage);
      console.error('Error fetching profiles:', err);
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const getFeaturedProfiles = () => {
    return profiles
      .filter(p => p.is_verified || (p.trust_score ?? 0) >= 70 || p.rating >= 4.5)
      .slice(0, 24);
  };

  const getNewProfiles = () => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    return profiles
      .filter(p => new Date(p.created_at) > oneWeekAgo)
      .slice(0, 12);
  };

  const getDiscoverProfiles = () => {
    return profiles
      .filter(p => !getFeaturedProfiles().includes(p) && !getNewProfiles().includes(p))
      .slice(0, 12);
  };

  return {
    profiles,
    loading,
    error,
    refetch: fetchProfiles,
    getFeaturedProfiles,
    getNewProfiles,
    getDiscoverProfiles
  };
};
