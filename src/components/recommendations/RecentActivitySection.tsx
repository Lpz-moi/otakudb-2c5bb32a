import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Check, Zap, Star, Clock } from 'lucide-react';
import { useRecentActivity, type ActivityLogEntry } from '@/hooks/useRecentActivity';

/**
 * Composant: Recent Activity Section
 * Affiche les 5-10 dernières actions avec timestamps relatifs et icônes
 */
export const RecentActivitySection = () => {
  const { activities, loading } = useRecentActivity(5);

  // Fonction pour obtenir l'icône et la couleur selon le type d'action
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'added':
        return { icon: Plus, color: 'text-blue-500', label: 'Ajouté' };
      case 'completed':
        return { icon: Check, color: 'text-green-500', label: 'Terminé' };
      case 'status_changed':
        return { icon: Zap, color: 'text-yellow-500', label: 'Statut changé' };
      case 'rating_changed':
        return { icon: Star, color: 'text-purple-500', label: 'Note changée' };
      default:
        return { icon: Clock, color: 'text-gray-500', label: 'Activité' };
    }
  };

  // Formater le timestamp relatif (il y a X heures/jours)
  const formatTimeAgo = (dateString: string): string => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'à l\'instant';
    if (diffInSeconds < 3600) return `il y a ${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `il y a ${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 604800) return `il y a ${Math.floor(diffInSeconds / 86400)}j`;
    
    return date.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' });
  };

  // Formater le message de l'activité
  const formatActivityMessage = (activity: ActivityLogEntry): string => {
    switch (activity.action_type) {
      case 'added':
        return `a ajouté "${activity.anime_title}"`;
      case 'completed':
        return `a terminé "${activity.anime_title}"`;
      case 'status_changed':
        return `${activity.anime_title}: ${activity.old_value} → ${activity.new_value}`;
      case 'rating_changed':
        return `a noté "${activity.anime_title}": ${activity.new_value}/10`;
      default:
        return `a mis à jour "${activity.anime_title}"`;
    }
  };

  if (loading) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <h2 className="section-title text-lg sm:text-xl flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          Activité récente
        </h2>
        
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 bg-muted/50 rounded-lg animate-pulse" />
          ))}
        </div>
      </motion.section>
    );
  }

  if (activities.length === 0) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <h2 className="section-title text-lg sm:text-xl flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          Activité récente
        </h2>
        
        <div className="text-center py-6 bg-secondary/30 rounded-xl border border-border/30">
          <Clock className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Aucune activité pour le moment</p>
        </div>
      </motion.section>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="space-y-4"
    >
      <h2 className="section-title text-lg sm:text-xl flex items-center gap-2">
        <Clock className="w-5 h-5 text-primary" />
        Activité récente
      </h2>

      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {activities.map((activity, index) => {
            const { icon: IconComponent, color, label } = getActionIcon(activity.action_type);
            const timeAgo = formatTimeAgo(activity.created_at);
            const message = formatActivityMessage(activity);

            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 border border-border/30 hover:bg-secondary/70 transition-colors group cursor-pointer"
              >
                {/* Icon */}
                <div className={`flex-shrink-0 p-2 rounded-lg bg-background/50 ${color}`}>
                  <IconComponent className="w-4 h-4" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {message}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {timeAgo}
                  </p>
                </div>

                {/* Image thumbnail (optional) */}
                {activity.anime_image && (
                  <div className="flex-shrink-0 hidden sm:block">
                    <img
                      src={activity.anime_image}
                      alt={activity.anime_title}
                      className="h-8 w-6 rounded object-cover opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                  </div>
                )}
            </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </motion.section>
  );
};
