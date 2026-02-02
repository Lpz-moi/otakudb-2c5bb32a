import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const [debug, setDebug] = useState<any>({
    hash: '',
    search: '',
    getSessionFromUrl: null,
    getSession: null,
    setSession: null,
    errors: [],
  });

  const pushError = (msg: any) => setDebug((d: any) => ({ ...d, errors: [...d.errors, msg] }));

  const runParse = async () => {
    try {
      const { data: sessionFromUrl, error: urlError } = await (supabase.auth as any).getSessionFromUrl();
      setDebug((d: any) => ({ ...d, getSessionFromUrl: { sessionFromUrl, urlError } }));
      return { sessionFromUrl, urlError };
    } catch (err) {
      pushError(err);
      return null;
    }
  };

  const runGetSession = async () => {
    try {
      const res = await supabase.auth.getSession();
      setDebug((d: any) => ({ ...d, getSession: res }));
      return res;
    } catch (err) {
      pushError(err);
      return null;
    }
  };

  const runSetSession = async (accessToken?: string, refreshToken?: string) => {
    try {
      const res = await (supabase.auth as any).setSession({ access_token: accessToken, refresh_token: refreshToken });
      setDebug((d: any) => ({ ...d, setSession: res }));
      return res;
    } catch (err) {
      pushError(err);
      return null;
    }
  };

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const hash = window.location.hash || '';
        const search = window.location.search || '';
        setDebug((d: any) => ({ ...d, hash, search }));

        // If there's an explicit error in params/hash, surface it
        const hashParams = new URLSearchParams(hash.substring(1));
        const queryParams = new URLSearchParams(search);
        const error = hashParams.get('error') || queryParams.get('error');
        const errorDescription = hashParams.get('error_description') || queryParams.get('error_description');
        if (error) {
          pushError({ error, errorDescription });
          toast.error(errorDescription || 'Erreur de connexion');
          navigate('/auth', { replace: true });
          return;
        }

        // Try parsing session from URL
        const parsed = await runParse();
        setDebug((d: any) => ({ ...d, getSessionFromUrl: parsed }));

        // Then getSession
        const sessionRes = await runGetSession();
        setDebug((d: any) => ({ ...d, getSession: sessionRes }));

        if (sessionRes?.data?.session) {
          try { window.history.replaceState(null, '', window.location.pathname + window.location.search); } catch (e) {}
          toast.success('Connexion réussie !');
          navigate('/', { replace: true });
          return;
        }

        // Fallback: try to set session from hash tokens
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token') || hashParams.get('provider_refresh_token');
        if (accessToken) {
          const setRes = await runSetSession(accessToken, refreshToken || undefined);
          setDebug((d: any) => ({ ...d, setSession: setRes }));
          if (!setRes?.error) {
            try { window.history.replaceState(null, '', window.location.pathname + window.location.search); } catch (e) {}
            toast.success('Connexion réussie (session manuelle) !');
            navigate('/', { replace: true });
            return;
          }
        }

        // Wait for auth state change short window
        const timeout = setTimeout(() => navigate('/auth', { replace: true }), 5000);
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === 'SIGNED_IN' && session) {
            clearTimeout(timeout);
            toast.success('Connexion réussie !');
            navigate('/', { replace: true });
          }
        });

        return () => {
          clearTimeout(timeout);
          subscription.unsubscribe();
        };
      } catch (err) {
        pushError(err);
        console.error('Callback error:', err);
        toast.error('Erreur inattendue');
        navigate('/auth', { replace: true });
      }
    };

    handleAuthCallback();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-start gap-4 p-6">
      <div className="w-full max-w-2xl bg-card/60 p-4 rounded-lg border">
        <h2 className="text-lg font-semibold">Auth Callback Debug</h2>
        <p className="text-sm text-muted-foreground">Affiche le hash, les résultats de parsing et permet d'exécuter manuellement les actions.</p>

        <div className="mt-3 space-y-2">
          <div>
            <strong>Hash:</strong>
            <pre className="whitespace-pre-wrap text-xs bg-muted p-2 rounded mt-1">{debug.hash || '—'}</pre>
          </div>
          <div>
            <strong>Search:</strong>
            <pre className="whitespace-pre-wrap text-xs bg-muted p-2 rounded mt-1">{debug.search || '—'}</pre>
          </div>
          <div>
            <strong>getSessionFromUrl:</strong>
            <pre className="whitespace-pre-wrap text-xs bg-muted p-2 rounded mt-1">{JSON.stringify(debug.getSessionFromUrl, null, 2) || '—'}</pre>
          </div>
          <div>
            <strong>getSession:</strong>
            <pre className="whitespace-pre-wrap text-xs bg-muted p-2 rounded mt-1">{JSON.stringify(debug.getSession, null, 2) || '—'}</pre>
          </div>
          <div>
            <strong>setSession:</strong>
            <pre className="whitespace-pre-wrap text-xs bg-muted p-2 rounded mt-1">{JSON.stringify(debug.setSession, null, 2) || '—'}</pre>
          </div>
          <div>
            <strong>Errors:</strong>
            <pre className="whitespace-pre-wrap text-xs bg-red-900/40 p-2 rounded mt-1">{JSON.stringify(debug.errors, null, 2) || '—'}</pre>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button className="btn" onClick={() => runParse()}>Rerun parse (getSessionFromUrl)</button>
          <button className="btn" onClick={() => runGetSession()}>Rerun getSession</button>
          <button className="btn" onClick={() => {
            const hashParams = new URLSearchParams((window.location.hash || '').substring(1));
            const a = hashParams.get('access_token');
            const r = hashParams.get('refresh_token') || hashParams.get('provider_refresh_token');
            runSetSession(a || undefined, r || undefined);
          }}>Try setSession from hash</button>
        </div>
      </div>

      <div className="text-sm text-muted-foreground mt-4">Si vous voulez que j'analyse, copiez-collez le contenu ci-dessus.</div>
    </div>
  );
};

export default AuthCallbackPage;
