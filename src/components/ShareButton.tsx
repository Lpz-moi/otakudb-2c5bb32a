import { Download, Share2, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useAnimeListStore } from '@/stores/animeListStore';
import { motion } from 'framer-motion';

/**
 * 📱 ShareButton - Partage simple
 * 
 * 1. Click → Toast notification
 * 2. Affiche message de partage
 */
export const ShareButton = () => {
  const { user } = useAuth();
  const { items } = useAnimeListStore();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleShare = async () => {
    if (!user) {
      toast.error('❌ Connectez-vous pour partager');
      return;
    }

    if (Object.keys(items).length === 0) {
      toast.error('📭 Ajouter des animes d\'abord');
      return;
    }

    try {
      setIsGenerating(true);
      console.log('📤 Partage en construction...');

      // Future: Image generation
      toast.success('✅ Prêt pour partager!');
    } catch (err) {
      console.error('❌ Erreur:', err);
      toast.error('❌ Erreur lors du partage');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleShare}
      disabled={isGenerating || Object.keys(items).length === 0}
      className="relative inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary/80 to-primary text-primary-foreground font-medium text-sm shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
    >
      {isGenerating ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Partage...</span>
        </>
      ) : (
        <>
          <Share2 className="w-4 h-4" />
          <span>Partager</span>
        </>
      )}
    </motion.button>
  );
};
