import { Share2, Copy, Download, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface ShareCardProps {
  listName: string;
  status: 'watching' | 'completed' | 'planned' | 'favorites';
  itemCount: number;
  isPublic: boolean;
  onTogglePublic: () => void;
  shareUrl: string;
  userName?: string;
}

const statusColors = {
  watching: 'from-blue-500/20 to-blue-500/5 border-blue-500/30',
  completed: 'from-green-500/20 to-green-500/5 border-green-500/30',
  planned: 'from-amber-500/20 to-amber-500/5 border-amber-500/30',
  favorites: 'from-rose-500/20 to-rose-500/5 border-rose-500/30',
};

const statusLabels = {
  watching: 'En cours',
  completed: 'Complétés',
  planned: 'À regarder',
  favorites: 'Favoris',
};

const statusEmojis = {
  watching: '▶️',
  completed: '✅',
  planned: '⏰',
  favorites: '⭐',
};

export const ShareCard = ({
  listName,
  status,
  itemCount,
  isPublic,
  onTogglePublic,
  shareUrl,
  userName = 'Utilisateur',
}: ShareCardProps) => {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleCopyLink = async () => {
    try {
      const fullUrl = shareUrl.startsWith('http') ? shareUrl : `${window.location.origin}${shareUrl}`;
      await navigator.clipboard.writeText(fullUrl);
      toast.success('Lien copié ! 📋');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      console.log('✅ Copié:', fullUrl);
    } catch (err) {
      console.error('❌ Erreur copie:', err);
      toast.error('Erreur lors de la copie');
    }
  };

  const handleDownloadImage = async () => {
    try {
      setDownloading(true);
      console.log('📸 Génération image pour:', status);
      
      // Créer un canvas avec les infos
      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 400;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        toast.error('Impossible de générer l\'image');
        return;
      }
      
      // Fond dégradé
      const gradient = ctx.createLinearGradient(0, 0, 600, 400);
      const colors = {
        watching: ['#3B82F6', '#1E40AF'],
        completed: ['#10B981', '#047857'],
        planned: ['#F59E0B', '#D97706'],
        favorites: ['#F43F5E', '#BE123C'],
      };
      const [color1, color2] = colors[status];
      gradient.addColorStop(0, color1);
      gradient.addColorStop(1, color2);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 600, 400);
      
      // Texte
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(statusEmojis[status], 300, 100);
      ctx.fillText(statusLabels[status], 300, 180);
      
      ctx.font = 'bold 36px Arial';
      ctx.fillText(`${itemCount} anime(s)`, 300, 250);
      
      ctx.font = '20px Arial';
      ctx.fillText(`Par ${userName}`, 300, 320);
      
      ctx.font = '16px Arial';
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillText('otakudb.app', 300, 360);
      
      // Télécharger
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `otakudb-${status}-${new Date().getTime()}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          toast.success('Image téléchargée ! 🎨');
          console.log('✅ Image téléchargée');
        }
      });
    } catch (err) {
      console.error('❌ Erreur téléchargement image:', err);
      toast.error('Erreur lors du téléchargement');
    } finally {
      setDownloading(false);
    }
  };

  const handleShareDiscord = async () => {
    try {
      const fullUrl = shareUrl.startsWith('http') ? shareUrl : `${window.location.origin}${shareUrl}`;
      const discordMessage = `📺 Regardez ma liste "${statusLabels[status]}" sur OtakuDB!\n${fullUrl}`;
      
      // Vérifier si Discord est disponible
      if (navigator.share) {
        await navigator.share({
          title: `Ma liste ${statusLabels[status]} - OtakuDB`,
          text: `Découvrez ma liste d'anime: ${itemCount} ${statusLabels[status].toLowerCase()}`,
          url: fullUrl,
        });
        toast.success('Partagé sur Discord ! 🎉');
        console.log('✅ Partagé Discord');
      } else {
        // Fallback: copier et ouvrir Discord
        await navigator.clipboard.writeText(discordMessage);
        window.open('https://discord.com/app', '_blank');
        toast.success('Lien copié ! Allez sur Discord');
        console.log('✅ Fallback Discord - lien copié');
      }
    } catch (err) {
      console.error('❌ Erreur partage Discord:', err);
      toast.error('Erreur lors du partage');
    }
  };

  return (
    <div
      className={`glass-card border rounded-lg p-5 bg-gradient-to-br ${statusColors[status]} transition-all hover:scale-[1.02]`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">{statusEmojis[status]}</span>
            <h3 className="font-bold text-base text-foreground">
              {statusLabels[status]}
            </h3>
          </div>
          <p className="text-sm text-muted-foreground">{itemCount} anime(s)</p>
        </div>
        <button
          onClick={onTogglePublic}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            isPublic
              ? 'bg-green-500/30 text-green-200 hover:bg-green-500/40'
              : 'bg-gray-500/30 text-gray-200 hover:bg-gray-500/40'
          }`}
        >
          {isPublic ? 'Public' : 'Privé'}
        </button>
      </div>

      {/* Share Actions */}
      {isPublic && (
        <div className="flex gap-2">
          <button
            onClick={handleCopyLink}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg transition-colors text-xs font-medium disabled:opacity-50"
            disabled={copied}
          >
            <Copy className="w-3.5 h-3.5" />
            {copied ? '✅ Copié!' : 'Copier'}
          </button>
          
          <button
            onClick={handleDownloadImage}
            disabled={downloading}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg transition-colors text-xs font-medium disabled:opacity-50"
          >
            {downloading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            Image
          </button>

          <button
            onClick={handleShareDiscord}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[#5865F2]/20 hover:bg-[#5865F2]/30 text-[#5865F2] rounded-lg transition-colors text-xs font-medium"
          >
            <Share2 className="w-3.5 h-3.5" />
            Discord
          </button>
        </div>
      )}

      {!isPublic && (
        <p className="text-xs text-muted-foreground text-center py-2">
          Activez le partage public pour accéder aux options
        </p>
      )}
    </div>
  );
};
