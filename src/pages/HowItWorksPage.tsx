import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, List, Star, User, Sparkles, Plus, Settings, Heart, HelpCircle, Compass } from "lucide-react";
import { Link } from "react-router-dom";

export default function HowItWorksPage() {
  return (
    <div className="page-container space-y-8 pb-12 animate-in fade-in duration-500">
      <div className="text-center space-y-4 mb-8">
        <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
          Comment ça marche ?
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Guide complet pour maîtriser OtakuDB et profiter de la meilleure expérience.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 1. Créer une liste */}
        <Card className="glass-card border-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500">
                <List className="h-6 w-6" />
              </div>
              Créer une liste
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>OtakuDB gère vos listes automatiquement. Vous disposez de 4 listes principales :</p>
            <ul className="space-y-2 pl-2">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <strong>En cours :</strong> Animes que vous regardez.
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <strong>Terminés :</strong> Animes finis.
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <strong>À voir :</strong> Votre watchlist.
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                <strong>Favoris :</strong> Vos préférés.
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* 2. Ajouter un anime */}
        <Card className="glass-card border-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                <Plus className="h-6 w-6" />
              </div>
              Ajouter un anime
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>Pour ajouter un anime à une liste :</p>
            <ol className="list-decimal pl-4 space-y-3">
              <li>
                Utilisez la <strong>Recherche</strong> pour trouver un titre.
              </li>
              <li>
                Cliquez sur le bouton <strong>Ajouter à ma liste</strong> sur la fiche de l'anime.
              </li>
              <li>
                Sélectionnez le statut (En cours, À voir, etc.).
              </li>
            </ol>
          </CardContent>
        </Card>

        {/* 3. Noter un anime */}
        <Card className="glass-card border-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
                <Star className="h-6 w-6" />
              </div>
              Noter un anime
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              Une fois un anime marqué comme <strong>Terminé</strong>, vous pouvez lui attribuer une note sur 10.
            </p>
            <p>
              Cette note est essentielle pour affiner vos recommandations.
            </p>
          </CardContent>
        </Card>

        {/* 4. Comment fonctionne la reco */}
        <Card className="glass-card border-primary/10 bg-gradient-to-br from-card to-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl">
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500">
                <Sparkles className="h-6 w-6" />
              </div>
              Fonctionnement de la recommandation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              Notre algorithme analyse vos goûts en temps réel :
            </p>
            <ul className="space-y-1.5">
              <li>• Analyse des genres de vos animes préférés</li>
              <li>• Prise en compte de vos notes (surtout {'>'} 8/10)</li>
              <li>• Suggestion basée sur les studios que vous aimez</li>
              <li>• Exclusion automatique des animes déjà vus</li>
            </ul>
          </CardContent>
        </Card>

        {/* 5. Améliorer ses recommandations */}
        <Card className="glass-card border-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl">
              <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500">
                <Heart className="h-6 w-6" />
              </div>
              Améliorer ses recommandations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>Pour avoir de meilleures suggestions :</p>
            <ul className="space-y-2 pl-2">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                Notez un maximum d'animes.
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                Utilisez le menu <strong>Découvrir</strong> et swipez (Like/Pass).
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                Gardez vos listes à jour.
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* 6. Personnaliser son profil */}
        <Card className="glass-card border-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl">
              <div className="p-2.5 rounded-xl bg-green-500/10 text-green-500">
                <User className="h-6 w-6" />
              </div>
              Personnaliser son profil
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              Dans le menu <strong>Profil</strong>, vous pouvez :
            </p>
            <ul className="space-y-2 pl-2">
              <li className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Modifier votre pseudo
              </li>
              <li className="flex items-center gap-2">
                <Heart className="w-4 h-4" />
                Choisir votre préférence de langue (VF/VOSTFR)
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="mt-12 text-center pb-8">
        <Button asChild size="lg" className="rounded-full px-8 h-12 text-lg shadow-lg hover:shadow-primary/25 transition-all duration-300">
          <Link to="/discover">
            Commencer l'expérience
            <Compass className="ml-2 h-5 w-5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}