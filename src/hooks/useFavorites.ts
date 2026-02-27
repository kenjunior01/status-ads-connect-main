import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

interface FavoriteCreator {
  id: string;
  profile_id: string;
  display_name: string;
  niche: string | null;
  price_range: string | null;
  rating: number;
  is_verified: boolean;
  created_at: string;
}

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<FavoriteCreator[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUserId(session?.user?.id || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchFavorites = useCallback(async () => {
    if (!userId) {
      const stored = localStorage.getItem('statusads_favorites');
      if (stored) {
        try { setFavorites(JSON.parse(stored)); } catch (e) { console.error(e); }
      }
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_favorites')
        .select('id, profile_id, created_at, profiles:profile_id (display_name, niche, price_range, rating, is_verified)')
        .eq('user_id', userId);

      if (error) throw error;

      type Row = {
        id: string;
        profile_id: string;
        created_at: string;
        profiles?: {
          display_name?: string | null;
          niche?: string | null;
          price_range?: string | null;
          rating?: number | null;
          is_verified?: boolean | null;
        } | null;
      };
      const rows = (data || []) as Row[];
      setFavorites(rows.map((fav) => ({
        id: fav.id,
        profile_id: fav.profile_id,
        display_name: fav.profiles?.display_name || 'Unknown',
        niche: fav.profiles?.niche ?? null,
        price_range: fav.profiles?.price_range ?? null,
        rating: fav.profiles?.rating ?? 0,
        is_verified: fav.profiles?.is_verified ?? false,
        created_at: fav.created_at,
      })));
    } catch (err) {
      console.error('Error fetching favorites:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchFavorites(); }, [fetchFavorites]);

  const addFavorite = useCallback(async (profile: { id: string; profile_id?: string; display_name: string; niche: string | null; price_range: string | null; rating: number; is_verified: boolean; }) => {
    const profileId = profile.profile_id || profile.id;
    if (favorites.some(f => f.profile_id === profileId)) return false;

    if (userId) {
      try {
        const { data, error } = await supabase.from('user_favorites').insert({ user_id: userId, profile_id: profileId }).select().single();
        if (error) throw error;
        setFavorites(prev => [...prev, { id: data.id, profile_id: profileId, display_name: profile.display_name, niche: profile.niche, price_range: profile.price_range, rating: profile.rating, is_verified: profile.is_verified, created_at: data.created_at }]);
      } catch (err) { console.error(err); return false; }
    } else {
      const newFav = { id: `local-${Date.now()}`, profile_id: profileId, display_name: profile.display_name, niche: profile.niche, price_range: profile.price_range, rating: profile.rating, is_verified: profile.is_verified, created_at: new Date().toISOString() };
      const updated = [...favorites, newFav];
      setFavorites(updated);
      localStorage.setItem('statusads_favorites', JSON.stringify(updated));
    }
    toast({ title: t('favorites.added'), description: profile.display_name });
    return true;
  }, [favorites, userId, toast, t]);

  const removeFavorite = useCallback(async (profileId: string) => {
    if (userId) {
      try {
        await supabase.from('user_favorites').delete().eq('user_id', userId).eq('profile_id', profileId);
        setFavorites(prev => prev.filter(f => f.profile_id !== profileId));
      } catch (err) { console.error(err); return; }
    } else {
      const updated = favorites.filter(f => f.profile_id !== profileId);
      setFavorites(updated);
      localStorage.setItem('statusads_favorites', JSON.stringify(updated));
    }
    toast({ title: t('favorites.removed') });
  }, [favorites, userId, toast, t]);

  const toggleFavorite = useCallback(async (profile: { id: string; profile_id?: string; display_name: string; niche: string | null; price_range: string | null; rating: number; is_verified: boolean; }) => {
    const profileId = profile.profile_id || profile.id;
    if (favorites.some(f => f.profile_id === profileId)) await removeFavorite(profileId);
    else await addFavorite(profile);
  }, [favorites, addFavorite, removeFavorite]);

  const isFavorite = useCallback((profileId: string) => favorites.some(f => f.profile_id === profileId), [favorites]);
  const getFavoriteCount = useCallback(() => favorites.length, [favorites]);

  return { favorites, loading, addFavorite, removeFavorite, toggleFavorite, isFavorite, getFavoriteCount, refetch: fetchFavorites };
};
