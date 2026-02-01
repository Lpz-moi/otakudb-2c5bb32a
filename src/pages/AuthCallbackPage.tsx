import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const AuthCallbackPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the hash fragment from the URL (for implicit flow) or error
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const queryParams = new URLSearchParams(window.location.search);
        
        const error = hashParams.get('error') || queryParams.get('error');
        const errorDescription = hashParams.get('error_description') || queryParams.get('error_description');

        if (error) {
          console.error('Auth callback error:', error, errorDescription);
          toast.error(errorDescription || 'Erreur de connexion');
          navigate('/auth', { replace: true });
          return;
        }

        // The session should be automatically set by Supabase
        // Wait a moment for the auth state to update
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Session error:', sessionError);
          toast.error('Erreur lors de la récupération de la session');
          navigate('/auth', { replace: true });
          return;
        }

        if (session) {
          toast.success('Connexion réussie !');
          navigate('/', { replace: true });
        } else {
          // No session yet, wait for auth state change
          const timeout = setTimeout(() => {
            navigate('/auth', { replace: true });
          }, 5000);

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
        }
      } catch (err) {
        console.error('Callback error:', err);
        toast.error('Erreur inattendue');
        navigate('/auth', { replace: true });
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-10 h-10 animate-spin text-primary" />
      <p className="text-muted-foreground text-sm">Connexion en cours...</p>
    </div>
  );
};

export default AuthCallbackPage;
