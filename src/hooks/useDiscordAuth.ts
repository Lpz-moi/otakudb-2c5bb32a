import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const DISCORD_CLIENT_ID = import.meta.env.VITE_DISCORD_CLIENT_ID;

interface DiscordAuthResult {
  success: boolean;
  user?: {
    id: string;
    discord_id: string;
    username: string;
    avatar: string | null;
    email: string;
  };
  magic_link?: string;
  is_new_user?: boolean;
  error?: string;
}

export const useDiscordAuth = () => {
  const [isLoading, setIsLoading] = useState(false);

  const getRedirectUri = useCallback(() => {
    // Allow overriding the OAuth redirect with an env var (useful for tunnels)
    const override = import.meta.env.VITE_OAUTH_REDIRECT;
    if (override && override.length > 0) return override;
    const baseUrl = window.location.origin;
    return `${baseUrl}/auth/callback`;
  }, []);

  const initiateDiscordLogin = useCallback(async () => {
    setIsLoading(true);
    
    try {
      const redirectUri = getRedirectUri();
      
      // Use Supabase OAuth with Discord provider
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'discord',
        options: {
          redirectTo: redirectUri,
          scopes: 'identify email guilds',
        },
      });

      if (error) {
        console.error('Discord OAuth error:', error);
        toast.error('Erreur de connexion Discord');
        return null;
      }

      return data;
    } catch (err) {
      console.error('Discord login error:', err);
      toast.error('Erreur lors de la connexion');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [getRedirectUri]);

  const handleCallback = useCallback(async (code: string, state: string): Promise<DiscordAuthResult | null> => {
    setIsLoading(true);
    
    try {
      // CSRF PROTECTION: Include state parameter from OAuth response
      const { data, error } = await supabase.functions.invoke('discord-auth', {
        body: {
          code,
          redirect_uri: getRedirectUri(),
          state, // Send state back to verify CSRF token
        },
      });

      if (error) {
        console.error('Callback error:', error);
        toast.error('Erreur lors de l\'authentification');
        return null;
      }

      if (data.magic_link) {
        // Navigate to magic link to complete auth
        window.location.href = data.magic_link;
      }

      return data as DiscordAuthResult;
    } catch (err) {
      console.error('Callback error:', err);
      toast.error('Erreur lors de l\'authentification');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [getRedirectUri]);

  return {
    isLoading,
    initiateDiscordLogin,
    handleCallback,
    getRedirectUri,
  };
};
