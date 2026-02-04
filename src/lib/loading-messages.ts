export const loadingTips = [
  "Astuce : Utilisez Cmd+K pour rechercher rapidement un anime.",
  "Pro tip : Activez les notifications pour ne jamais rater un épisode.",
  "OtakuDB synchronise vos données en temps réel sur tous vos appareils.",
  "Vous pouvez personnaliser votre profil dans les paramètres.",
  "Découvrez de nouveaux animes grâce aux recommandations personnalisées.",
  "Cliquez sur l'icône de cœur pour ajouter rapidement aux favoris.",
  "Le mode sombre est activé par défaut pour le confort de vos yeux.",
];

export const loadingStages = {
  auth: "Connexion à Discord...",
  profile: "Chargement du profil...",
  sync: "Synchronisation des listes...",
  ready: "Préparation de l'interface...",
};

export type LoadingStage = keyof typeof loadingStages | 'idle';