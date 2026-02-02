import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const DISCORD_CLIENT_ID = Deno.env.get('DISCORD_CLIENT_ID');
const DISCORD_CLIENT_SECRET = Deno.env.get('DISCORD_CLIENT_SECRET');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// Validate required environment variables
const validateEnv = (): string[] => {
  const missing: string[] = [];
  if (!DISCORD_CLIENT_ID) missing.push('DISCORD_CLIENT_ID');
  if (!DISCORD_CLIENT_SECRET) missing.push('DISCORD_CLIENT_SECRET');
  if (!SUPABASE_URL) missing.push('SUPABASE_URL');
  if (!SUPABASE_SERVICE_ROLE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  return missing;
};

interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  global_name: string | null;
  avatar: string | null;
  email: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Validate environment first
    const missingEnv = validateEnv();
    if (missingEnv.length > 0) {
      console.error('Missing environment variables:', missingEnv);
      return new Response(
        JSON.stringify({ error: 'Server configuration error', details: `Missing: ${missingEnv.join(', ')}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    // Action: Get Discord OAuth URL
    if (action === 'get_auth_url') {
      const redirectUri = url.searchParams.get('redirect_uri') || `${url.origin}/discord-auth?action=callback`;
      const state = crypto.randomUUID();
      
      const discordAuthUrl = new URL('https://discord.com/api/oauth2/authorize');
      discordAuthUrl.searchParams.set('client_id', DISCORD_CLIENT_ID!);
      discordAuthUrl.searchParams.set('redirect_uri', redirectUri);
      discordAuthUrl.searchParams.set('response_type', 'code');
      discordAuthUrl.searchParams.set('scope', 'identify email guilds');
      discordAuthUrl.searchParams.set('state', state);

      return new Response(
        JSON.stringify({ 
          url: discordAuthUrl.toString(),
          state 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Action: Exchange code for token and create/update user
    if (action === 'callback' || req.method === 'POST') {
      const body = await req.json();
      const { code, redirect_uri } = body;

      if (!code) {
        return new Response(
          JSON.stringify({ error: 'Missing authorization code' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Exchange code for access token
      const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: DISCORD_CLIENT_ID!,
          client_secret: DISCORD_CLIENT_SECRET!,
          grant_type: 'authorization_code',
          code,
          redirect_uri,
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('Discord token exchange failed:', errorText);
        return new Response(
          JSON.stringify({ error: 'Failed to exchange code for token' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const tokens = await tokenResponse.json();

      // Get Discord user info
      const userResponse = await fetch('https://discord.com/api/users/@me', {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      });

      if (!userResponse.ok) {
        console.error('Failed to fetch Discord user');
        return new Response(
          JSON.stringify({ error: 'Failed to fetch user info' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const discordUser: DiscordUser = await userResponse.json();

      // Create Supabase admin client
      const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

      // Check if user exists
      const { data: existingUsers } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('discord_id', discordUser.id)
        .limit(1);

      let userId: string;
      let isNewUser = false;

      if (existingUsers && existingUsers.length > 0) {
        // Existing user - update profile
        userId = existingUsers[0].user_id;
        
        await supabase
          .from('profiles')
          .update({
            discord_username: discordUser.global_name || discordUser.username,
            discord_avatar: discordUser.avatar 
              ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
              : null,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);

      } else {
        // New user - create auth user and profile
        isNewUser = true;
        
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
          email: discordUser.email || `${discordUser.id}@discord.user`,
          email_confirm: true,
          user_metadata: {
            provider: 'discord',
            provider_id: discordUser.id,
            full_name: discordUser.global_name || discordUser.username,
            avatar_url: discordUser.avatar 
              ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
              : null,
          },
        });

        if (authError) {
          // User might exist with same email - try to find and link
          const { data: existingAuth } = await supabase.auth.admin.listUsers();
          const matchingUser = existingAuth?.users?.find(u => u.email === discordUser.email);
          
          if (matchingUser) {
            userId = matchingUser.id;
            
            // Update profile with Discord info
            await supabase
              .from('profiles')
              .update({
                discord_id: discordUser.id,
                discord_username: discordUser.global_name || discordUser.username,
                discord_avatar: discordUser.avatar 
                  ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
                  : null,
              })
              .eq('user_id', userId);
          } else {
            console.error('Auth error:', authError);
            return new Response(
              JSON.stringify({ error: 'Failed to create user' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        } else {
          userId = authUser.user.id;
        }
      }

      // Generate a session for the user
      const { data: session, error: sessionError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: discordUser.email || `${discordUser.id}@discord.user`,
        options: {
          redirectTo: redirect_uri?.split('?')[0] || '/',
        },
      });

      if (sessionError) {
        console.error('Session error:', sessionError);
        return new Response(
          JSON.stringify({ error: 'Failed to create session' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Log session for audit
      await supabase
        .from('session_logs')
        .insert({
          user_id: userId,
          action: isNewUser ? 'signup_discord' : 'login_discord',
          metadata: {
            discord_id: discordUser.id,
            discord_username: discordUser.global_name || discordUser.username,
          },
        });

      return new Response(
        JSON.stringify({
          success: true,
          user: {
            id: userId,
            discord_id: discordUser.id,
            username: discordUser.global_name || discordUser.username,
            avatar: discordUser.avatar 
              ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
              : null,
            email: discordUser.email,
          },
          magic_link: session.properties?.action_link,
          is_new_user: isNewUser,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Discord auth error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});