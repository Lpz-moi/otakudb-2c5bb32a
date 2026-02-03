import type { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];

export interface AnimeForImage {
  anime_id: number;
  anime_title: string;
  anime_image?: string;
  status: 'watching' | 'completed' | 'planned' | 'favorites';
  rating?: number | null;
  progress?: number;
  total_episodes?: number;
}

export interface ImageGeneratorOptions {
  profile: Profile;
  animes: AnimeForImage[];
}

/**
 * 🎨 Générateur d'image premium pour Discord
 * 
 * Crée une image haute qualité (1200x630) prête à être partagée sur Discord
 * Affiche les 4 catégories + posters animes
 * 
 * Format: OG image size (optimisé pour Discord preview)
 */
export const generateShareImage = async (
  options: ImageGeneratorOptions
): Promise<Blob> => {
  const { profile, animes } = options;

  console.log('🎨 Génération image partage...');

  // === CRÉATION CANVAS ===
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 630;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('❌ Canvas context non disponible');
  }

  // === BACKGROUND DISCORD ===
  const gradient = ctx.createLinearGradient(0, 0, 1200, 630);
  gradient.addColorStop(0, '#2C2F33'); // Discord dark
  gradient.addColorStop(1, '#23272A'); // Darker
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1200, 630);

  // === HEADER: AVATAR + USERNAME ===
  const avatarSize = 60;
  const avatarX = 30;
  const avatarY = 30;

  // Cercle de fond Discord blue
  ctx.beginPath();
  ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
  ctx.fillStyle = '#7289DA';
  ctx.fill();

  // Avatar image
  if (profile.discord_avatar) {
    try {
      const img = await loadImage(profile.discord_avatar);
      ctx.save();
      ctx.beginPath();
      ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2 - 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(img, avatarX + 2, avatarY + 2, avatarSize - 4, avatarSize - 4);
      ctx.restore();
    } catch (e) {
      console.log('⚠️ Avatar load failed');
    }
  }

  // Username
  ctx.font = 'bold 32px "Inter", sans-serif';
  ctx.fillStyle = '#FFFFFF';
  const username = profile.display_name || profile.discord_username || 'Utilisateur';
  ctx.fillText(username, avatarX + avatarSize + 30, avatarY + 45);

  // Subtitle
  ctx.font = '16px "Inter", sans-serif';
  ctx.fillStyle = '#B9BBBE';
  ctx.fillText('Ma liste OtakuDB', avatarX + avatarSize + 30, avatarY + 65);

  // === GROUPED ANIMES BY STATUS ===
  const grouped = {
    watching: animes.filter((a) => a.status === 'watching').slice(0, 6),
    completed: animes.filter((a) => a.status === 'completed').slice(0, 6),
    planned: animes.filter((a) => a.status === 'planned').slice(0, 6),
    favorites: animes.filter((a) => a.status === 'favorites').slice(0, 6),
  };

  // === DRAW 4 SECTIONS ===
  const sections = [
    { label: '▶️ EN COURS', key: 'watching', x: 30, y: 140 },
    { label: '⭐ FAVORIS', key: 'favorites', x: 630, y: 140 },
    { label: '⏰ À VOIR', key: 'planned', x: 30, y: 390 },
    { label: '✅ TERMINÉS', key: 'completed', x: 630, y: 390 },
  ];

  for (const section of sections) {
    // Title
    ctx.font = 'bold 18px "Inter", sans-serif';
    ctx.fillStyle = '#FFFFFF';
    const count = grouped[section.key as keyof typeof grouped].length;
    ctx.fillText(`${section.label} (${count})`, section.x, section.y);

    // Draw posters (max 3 per section)
    const sectionAnimes = grouped[section.key as keyof typeof grouped];
    let posterX = section.x;
    const posterY = section.y + 35;
    const posterWidth = 70;
    const posterHeight = 105;

    for (let i = 0; i < Math.min(3, sectionAnimes.length); i++) {
      const anime = sectionAnimes[i];

      if (anime.anime_image) {
        try {
          const img = await loadImage(anime.anime_image);
          ctx.drawImage(img, posterX, posterY, posterWidth, posterHeight);

          // Border
          ctx.strokeStyle = '#7289DA';
          ctx.lineWidth = 1;
          ctx.strokeRect(posterX, posterY, posterWidth, posterHeight);
        } catch (e) {
          // Fallback: couleur
          ctx.fillStyle = '#404249';
          ctx.fillRect(posterX, posterY, posterWidth, posterHeight);
          ctx.strokeStyle = '#7289DA';
          ctx.lineWidth = 1;
          ctx.strokeRect(posterX, posterY, posterWidth, posterHeight);
        }
      } else {
        // No image: placeholder
        ctx.fillStyle = '#404249';
        ctx.fillRect(posterX, posterY, posterWidth, posterHeight);
      }

      posterX += posterWidth + 8;
    }
  }

  // === FOOTER: BRANDING ===
  ctx.font = 'bold 24px "Inter", sans-serif';
  ctx.fillStyle = '#7289DA';
  ctx.textAlign = 'right';
  ctx.fillText('otakudb.app', 1150, 600);

  // Total count
  ctx.font = '14px "Inter", sans-serif';
  ctx.fillStyle = '#B9BBBE';
  ctx.textAlign = 'right';
  ctx.fillText(`${animes.length} anime(s) au total`, 1150, 620);

  console.log('✅ Image générée avec succès');

  // === EXPORT BLOB ===
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          console.log(`💾 Image: ${(blob.size / 1024).toFixed(1)}KB`);
          resolve(blob);
        } else {
          reject(new Error('Canvas blob creation failed'));
        }
      },
      'image/png',
      0.95 // Qualité
    );
  });
};

/**
 * 🖼️ Helper: Charger image avec CORS
 */
const loadImage = (url: string, timeout = 5000): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    const timeoutId = setTimeout(() => {
      reject(new Error(`Image timeout: ${url}`));
    }, timeout);

    img.onload = () => {
      clearTimeout(timeoutId);
      resolve(img);
    };

    img.onerror = () => {
      clearTimeout(timeoutId);
      reject(new Error(`Image load failed: ${url}`));
    };

    img.src = url;
  });
};

/**
 * 📥 Télécharger image localement
 */
export const downloadImage = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 100);
};

/**
 * 📤 Partager image (Web Share API)
 */
export const shareImage = async (blob: Blob, filename: string): Promise<boolean> => {
  try {
    if (!navigator.share) {
      console.log('⚠️ Web Share API non disponible');
      return false;
    }

    const file = new File([blob], filename, { type: 'image/png' });

    if (!navigator.canShare?.({ files: [file] })) {
      console.log('⚠️ Partage de fichiers non supporté');
      return false;
    }

    await navigator.share({
      files: [file],
      title: 'Ma liste OtakuDB',
      text: 'Découvrez ma liste d\'anime!',
    });

    console.log('✅ Image partagée');
    return true;
  } catch (err: any) {
    if (err.name !== 'AbortError') {
      console.error('❌ Erreur partage:', err);
    }
    return false;
  }
};
