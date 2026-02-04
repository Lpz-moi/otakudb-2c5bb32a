import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useLoadingState, LoadingState } from '@/hooks/useLoadingState';
import { loadingStages } from '@/lib/loading-messages';
import { InitialLoadingScreen } from '@/components/ui/InitialLoadingScreen';

interface AuthContextType {
  user: any | null;
  authLoading: LoadingState;
  signInWithDiscord: () => Promise<void>;
  signOut: () => Promise<void>;
  viewUserList: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const { state: authLoading, startLoading, updateProgress, completeLoading, failLoading } = useLoadingState();
  const loadingSequenceRef = useRef(false);

  // Séquence de chargement unifiée
  const runDemoLoad = useCallback(async () => {
    if (loadingSequenceRef.current) return;
    loadingSequenceRef.current = true;

    startLoading("Démarrage de l'application...");
    await wait(2000);
    updateProgress(20, "Initialisation du moteur...");
    await wait(3000);
    updateProgress(45, "Chargement des modules...");
    await wait(3000);
    updateProgress(70, "Vérification de la session...");
    await wait(3000);
    updateProgress(90, "Préparation de l'interface...");
    await wait(2000);
    completeLoading();
    loadingSequenceRef.current = false;
  }, [startLoading, updateProgress, completeLoading]);

  // GESTION DU CYCLE DE VIE (Démarrage + Retour Mobile/Tab)
  useEffect(() => {
    runDemoLoad();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        runDemoLoad();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [runDemoLoad]);

  // Simulation de la connexion pour la démo
  const signInWithDiscord = async () => {
    try {
      startLoading(loadingStages.auth);
      updateProgress(5, loadingStages.auth);

      // 1. Auth Simulation
      await wait(3000);
      updateProgress(30, loadingStages.profile);

      // 2. Profile Fetch Simulation
      await wait(4000);
      updateProgress(60, loadingStages.sync);

      // 3. Sync Simulation
      await wait(3000);
      updateProgress(85, loadingStages.ready);

      // 4. Finalize
      await wait(2000);
      
      setUser({ id: '1', name: 'OtakuUser', avatar: 'https://github.com/shadcn.png' });
      completeLoading();
    } catch (error) {
      failLoading("Erreur lors de la connexion.");
      console.error(error);
    }
  };

  const signOut = async () => {
    startLoading("Déconnexion en cours...");
    await wait(2000);
    updateProgress(30, "Sauvegarde des préférences...");
    await wait(3000);
    updateProgress(60, "Nettoyage du cache...");
    await wait(3000);
    updateProgress(90, "Fermeture de la session...");
    await wait(2000);
    setUser(null);
    completeLoading();
  };

  const viewUserList = async () => {
    startLoading("Chargement de vos listes...");
    await wait(2000);
    updateProgress(20, "Récupération des animes...");
    await wait(3000);
    updateProgress(50, "Traitement des images...");
    await wait(3000);
    updateProgress(80, "Organisation de la grille...");
    await wait(3000);
    completeLoading();
  };

  return (
    <AuthContext.Provider value={{ user, authLoading, signInWithDiscord, signOut, viewUserList }}>
      {authLoading.isLoading && (
        <InitialLoadingScreen 
          stage={authLoading.currentStep}
          progress={authLoading.progress}
          message={authLoading.currentStep}
        />
      )}
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}