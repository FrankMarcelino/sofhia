'use client';

import { createClient } from '@/lib/supabase/client';
import { useQuery } from '@tanstack/react-query';
import type { User } from '@/types';

/**
 * Hook to get the current authenticated user
 */
export function useAuth() {
  const supabase = createClient();

  return useQuery({
    queryKey: ['auth', 'user'],
    queryFn: async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) throw error;
      if (!user) return null;

      // Fetch full user details from usuarios_sofhia table
      const { data: userData, error: userError } = await supabase
        .from('usuarios_sofhia')
        .select('*')
        .eq('id', user.id)
        .single();

      if (userError) throw userError;

      return userData as User;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });
}

/**
 * Hook to get the current user's company/empresa data
 */
export function useEmpresa() {
  const { data: user } = useAuth();
  const supabase = createClient();

  return useQuery({
    queryKey: ['empresa', user?.id_empresa],
    queryFn: async () => {
      if (!user?.id_empresa) return null;

      const { data, error } = await supabase
        .from('empresa')
        .select('*')
        .eq('id_empresa', user.id_empresa)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id_empresa,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}
