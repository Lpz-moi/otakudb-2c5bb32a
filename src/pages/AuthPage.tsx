import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Tv, Shield, Users, Sparkles, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useDiscordAuth } from '@/hooks/useDiscordAuth';
import { toast } from 'sonner';

// Discord logo SVG
const DiscordIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
  </svg>
);

const AuthPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { initiateDiscordLogin, handleCallback, isLoading } = useDiscordAuth();
  const [processingCallback, setProcessingCallback] = useState(false);

  // Handle OAuth callback
  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      toast.error('Connexion annulée');
      navigate('/auth', { replace: true });
      return;
    }

    if (code && !processingCallback) {
      setProcessingCallback(true);
      // CSRF PROTECTION: Include state parameter from OAuth response
      handleCallback(code, state || '').then((result) => {
        if (result?.success) {
          toast.success(result.is_new_user ? 'Bienvenue sur OtakuDB !' : 'Connexion réussie');
        }
        setProcessingCallback(false);
      });
    }
  }, [searchParams, handleCallback, navigate, processingCallback]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  const handleDiscordLogin = async () => {
    await initiateDiscordLogin();
  };

  const features = [
    {
      icon: Shield,
      title: 'Données sécurisées',
      description: 'Chiffrement AES-256 et sync cloud',
    },
    {
      icon: Sparkles,
      title: 'Sync automatique',
      description: 'Vos données suivent votre compte',
    },
  ];

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Tv className="w-5 h-5 text-primary" />
          </div>
          <span className="text-xl font-display font-bold text-foreground">
            Otaku<span className="text-primary">DB</span>
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm space-y-8"
        >
          {/* Hero */}
          <div className="text-center space-y-3">
            <h1 className="text-2xl font-display font-bold text-foreground">
              Gérez vos animes
              <br />
              <span className="text-primary">intelligemment</span>
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Suivez votre progression et découvrez de nouveaux animes.
            </p>
          </div>

          {/* Discord Login Button */}
          <motion.button
            onClick={handleDiscordLogin}
            disabled={isLoading || processingCallback}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 px-6 rounded-2xl bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold text-base flex items-center justify-center gap-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#5865F2]/30"
          >
            {isLoading || processingCallback ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <DiscordIcon />
                Se connecter avec Discord
              </>
            )}
          </motion.button>

          {/* Features */}
          <div className="space-y-3 pt-4">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-card/50 border border-border/50"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm text-foreground">{feature.title}</p>
                  <p className="text-xs text-muted-foreground">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Privacy Note */}
          <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
            En vous connectant, vous acceptez que vos données de profil Discord soient utilisées pour créer votre compte. Vos listes restent privées par défaut.
          </p>
        </motion.div>
      </main>
    </div>
  );
};

export default AuthPage;
