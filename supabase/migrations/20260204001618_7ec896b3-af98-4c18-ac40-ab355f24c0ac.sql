-- ═══════════════════════════════════════════════════════════════
-- SYSTÈME D'AVIS COMMUNAUTAIRE OTAKUDB
-- ═══════════════════════════════════════════════════════════════

-- Nouvelles énumérations
CREATE TYPE public.review_reaction AS ENUM ('useful', 'agree', 'neutral', 'disagree');
CREATE TYPE public.report_status AS ENUM ('pending', 'reviewed', 'dismissed', 'actioned');
CREATE TYPE public.review_status AS ENUM ('visible', 'hidden', 'deleted');
CREATE TYPE public.ban_type AS ENUM ('none', 'shadow', 'full');

-- ═══════════════════════════════════════════════════════════════
-- TABLE: user_moderation (extension pour modération utilisateurs)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE public.user_moderation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    ban_status public.ban_type DEFAULT 'none',
    ban_reason TEXT,
    ban_expires_at TIMESTAMP WITH TIME ZONE,
    review_cooldown_until TIMESTAMP WITH TIME ZONE,
    credibility_score DECIMAL(5,2) DEFAULT 50.00,
    total_reviews INTEGER DEFAULT 0,
    total_helpful_votes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- ═══════════════════════════════════════════════════════════════
-- TABLE: anime_reviews
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE public.anime_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    anime_id INTEGER NOT NULL,
    anime_title TEXT NOT NULL,
    anime_image TEXT,
    
    -- Contenu
    content TEXT NOT NULL CHECK (char_length(content) BETWEEN 100 AND 2000),
    rating DECIMAL(3,1) CHECK (rating >= 1 AND rating <= 10),
    is_spoiler BOOLEAN DEFAULT false,
    is_recommended BOOLEAN,
    
    -- Tags prédéfinis (max 5)
    tags TEXT[] DEFAULT '{}',
    
    -- Modération
    status public.review_status DEFAULT 'visible',
    hidden_reason TEXT,
    
    -- Métriques agrégées (cache)
    useful_count INTEGER DEFAULT 0,
    agree_count INTEGER DEFAULT 0,
    neutral_count INTEGER DEFAULT 0,
    disagree_count INTEGER DEFAULT 0,
    report_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    last_edited_at TIMESTAMP WITH TIME ZONE,
    edit_count INTEGER DEFAULT 0,
    
    -- Contrainte: 1 review par user par anime
    UNIQUE (user_id, anime_id)
);

-- Index pour performance
CREATE INDEX idx_reviews_anime ON public.anime_reviews(anime_id, status);
CREATE INDEX idx_reviews_user ON public.anime_reviews(user_id);
CREATE INDEX idx_reviews_rating ON public.anime_reviews(anime_id, rating) WHERE status = 'visible';
CREATE INDEX idx_reviews_created ON public.anime_reviews(created_at DESC);

-- ═══════════════════════════════════════════════════════════════
-- TABLE: review_reactions
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE public.review_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID REFERENCES public.anime_reviews(id) ON DELETE CASCADE NOT NULL,
    user_id UUID NOT NULL,
    reaction public.review_reaction NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    
    -- 1 réaction par user par review
    UNIQUE (review_id, user_id)
);

CREATE INDEX idx_reactions_review ON public.review_reactions(review_id);
CREATE INDEX idx_reactions_user ON public.review_reactions(user_id);

-- ═══════════════════════════════════════════════════════════════
-- TABLE: user_badges
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE public.user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    badge_type TEXT NOT NULL,
    badge_name TEXT NOT NULL,
    badge_icon TEXT,
    badge_description TEXT,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    
    UNIQUE (user_id, badge_type)
);

CREATE INDEX idx_badges_user ON public.user_badges(user_id);

-- ═══════════════════════════════════════════════════════════════
-- TABLE: review_reports
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE public.review_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID REFERENCES public.anime_reviews(id) ON DELETE CASCADE NOT NULL,
    reporter_id UUID NOT NULL,
    reason TEXT NOT NULL CHECK (reason IN (
        'spam', 'harassment', 'spoiler_unmarked', 
        'off_topic', 'misinformation', 'other'
    )),
    details TEXT,
    status public.report_status DEFAULT 'pending',
    moderator_id UUID,
    moderator_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    resolved_at TIMESTAMP WITH TIME ZONE,
    
    -- 1 report par user par review
    UNIQUE (review_id, reporter_id)
);

CREATE INDEX idx_reports_status ON public.review_reports(status) WHERE status = 'pending';
CREATE INDEX idx_reports_review ON public.review_reports(review_id);

-- ═══════════════════════════════════════════════════════════════
-- TABLE: anime_review_summary (cache matérialisé)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE public.anime_review_summary (
    anime_id INTEGER PRIMARY KEY,
    anime_title TEXT NOT NULL,
    anime_image TEXT,
    
    -- Statistiques
    total_reviews INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2),
    recommendation_percent DECIMAL(5,2),
    
    -- Distribution notes
    rating_1_2 INTEGER DEFAULT 0,
    rating_3_4 INTEGER DEFAULT 0,
    rating_5_6 INTEGER DEFAULT 0,
    rating_7_8 INTEGER DEFAULT 0,
    rating_9_10 INTEGER DEFAULT 0,
    
    -- Top tags (JSONB pour flexibilité)
    top_tags JSONB DEFAULT '[]',
    
    -- Sentiments fréquents
    common_positives JSONB DEFAULT '[]',
    common_negatives JSONB DEFAULT '[]',
    
    -- Timestamps
    last_calculated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- ═══════════════════════════════════════════════════════════════
-- TABLE: review_config (configuration système)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE public.review_config (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Configuration initiale
INSERT INTO public.review_config (key, value, description) VALUES
('review_cooldown_days', '7', 'Jours entre modifications d une review'),
('edit_window_hours', '24', 'Heures pour éditer après publication'),
('max_edits', '3', 'Nombre max d éditions'),
('min_content_length', '100', 'Longueur min du contenu'),
('max_content_length', '2000', 'Longueur max du contenu'),
('auto_hide_report_threshold', '5', 'Reports pour masquer auto'),
('allowed_tags', '["animation", "histoire", "personnages", "musique", "doublage", "originalité", "rythme", "émotions", "action", "humour", "romance", "suspense"]', 'Tags autorisés');

-- ═══════════════════════════════════════════════════════════════
-- FONCTIONS
-- ═══════════════════════════════════════════════════════════════

-- Fonction: Recalculer les compteurs de réactions
CREATE OR REPLACE FUNCTION public.update_review_reaction_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        UPDATE public.anime_reviews SET
            useful_count = (SELECT COUNT(*) FROM public.review_reactions WHERE review_id = OLD.review_id AND reaction = 'useful'),
            agree_count = (SELECT COUNT(*) FROM public.review_reactions WHERE review_id = OLD.review_id AND reaction = 'agree'),
            neutral_count = (SELECT COUNT(*) FROM public.review_reactions WHERE review_id = OLD.review_id AND reaction = 'neutral'),
            disagree_count = (SELECT COUNT(*) FROM public.review_reactions WHERE review_id = OLD.review_id AND reaction = 'disagree'),
            updated_at = now()
        WHERE id = OLD.review_id;
        RETURN OLD;
    ELSE
        UPDATE public.anime_reviews SET
            useful_count = (SELECT COUNT(*) FROM public.review_reactions WHERE review_id = NEW.review_id AND reaction = 'useful'),
            agree_count = (SELECT COUNT(*) FROM public.review_reactions WHERE review_id = NEW.review_id AND reaction = 'agree'),
            neutral_count = (SELECT COUNT(*) FROM public.review_reactions WHERE review_id = NEW.review_id AND reaction = 'neutral'),
            disagree_count = (SELECT COUNT(*) FROM public.review_reactions WHERE review_id = NEW.review_id AND reaction = 'disagree'),
            updated_at = now()
        WHERE id = NEW.review_id;
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fonction: Auto-hide si trop de reports
CREATE OR REPLACE FUNCTION public.check_report_threshold()
RETURNS TRIGGER AS $$
DECLARE
    threshold INTEGER;
    current_count INTEGER;
BEGIN
    SELECT (value::TEXT)::INTEGER INTO threshold 
    FROM public.review_config WHERE key = 'auto_hide_report_threshold';
    
    SELECT COUNT(*) INTO current_count
    FROM public.review_reports WHERE review_id = NEW.review_id;
    
    IF current_count >= threshold THEN
        UPDATE public.anime_reviews 
        SET status = 'hidden', hidden_reason = 'Auto-masqué: seuil de signalements atteint'
        WHERE id = NEW.review_id AND status = 'visible';
    END IF;
    
    -- Mettre à jour le compteur de reports
    UPDATE public.anime_reviews 
    SET report_count = current_count
    WHERE id = NEW.review_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fonction: Calculer score crédibilité
CREATE OR REPLACE FUNCTION public.calculate_credibility_score(_user_id UUID)
RETURNS DECIMAL AS $$
DECLARE
    total_helpful INTEGER;
    total_disagree INTEGER;
    account_age_days INTEGER;
    review_count INTEGER;
    final_score DECIMAL;
BEGIN
    -- Compter votes positifs et négatifs
    SELECT 
        COALESCE(SUM(useful_count + agree_count), 0),
        COALESCE(SUM(disagree_count), 0),
        COUNT(*)
    INTO total_helpful, total_disagree, review_count
    FROM public.anime_reviews 
    WHERE user_id = _user_id AND status = 'visible';
    
    -- Calculer ancienneté
    SELECT EXTRACT(DAY FROM now() - created_at)::INTEGER
    INTO account_age_days
    FROM public.profiles WHERE user_id = _user_id;
    
    -- Formule: base 50 + helpful*2 - disagree*0.5 + ancienneté (max +10)
    final_score := 50 
        + (total_helpful * 2)
        + (total_disagree * -0.5)
        + LEAST(COALESCE(account_age_days, 0) / 30.0, 10)
        + (review_count * 0.5);
    
    RETURN GREATEST(0, LEAST(100, final_score));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fonction: Attribuer badges automatiquement
CREATE OR REPLACE FUNCTION public.check_and_award_badges(_user_id UUID)
RETURNS VOID AS $$
DECLARE
    review_count INTEGER;
    helpful_count INTEGER;
    cred_score DECIMAL;
BEGIN
    SELECT COUNT(*) INTO review_count
    FROM public.anime_reviews WHERE user_id = _user_id AND status = 'visible';
    
    SELECT COALESCE(SUM(useful_count), 0) INTO helpful_count
    FROM public.anime_reviews WHERE user_id = _user_id;
    
    SELECT public.calculate_credibility_score(_user_id) INTO cred_score;
    
    -- Badge: Premier avis
    IF review_count >= 1 THEN
        INSERT INTO public.user_badges (user_id, badge_type, badge_name, badge_icon, badge_description)
        VALUES (_user_id, 'first_review', 'Premier Avis', '✍️', 'A publié son premier avis')
        ON CONFLICT (user_id, badge_type) DO NOTHING;
    END IF;
    
    -- Badge: Contributeur 10
    IF review_count >= 10 THEN
        INSERT INTO public.user_badges (user_id, badge_type, badge_name, badge_icon, badge_description)
        VALUES (_user_id, 'contributor_10', 'Contributeur', '📝', 'A publié 10 avis')
        ON CONFLICT (user_id, badge_type) DO NOTHING;
    END IF;
    
    -- Badge: Contributeur 50
    IF review_count >= 50 THEN
        INSERT INTO public.user_badges (user_id, badge_type, badge_name, badge_icon, badge_description)
        VALUES (_user_id, 'contributor_50', 'Grand Contributeur', '🏆', 'A publié 50 avis')
        ON CONFLICT (user_id, badge_type) DO NOTHING;
    END IF;
    
    -- Badge: Avis utile 10
    IF helpful_count >= 10 THEN
        INSERT INTO public.user_badges (user_id, badge_type, badge_name, badge_icon, badge_description)
        VALUES (_user_id, 'helpful_10', 'Avis Utile', '👍', 'A reçu 10 votes utiles')
        ON CONFLICT (user_id, badge_type) DO NOTHING;
    END IF;
    
    -- Badge: Avis utile 50
    IF helpful_count >= 50 THEN
        INSERT INTO public.user_badges (user_id, badge_type, badge_name, badge_icon, badge_description)
        VALUES (_user_id, 'helpful_50', 'Expert Communautaire', '⭐', 'A reçu 50 votes utiles')
        ON CONFLICT (user_id, badge_type) DO NOTHING;
    END IF;
    
    -- Badge: Reviewer de confiance
    IF cred_score >= 80 THEN
        INSERT INTO public.user_badges (user_id, badge_type, badge_name, badge_icon, badge_description)
        VALUES (_user_id, 'trusted_reviewer', 'Reviewer de Confiance', '🛡️', 'Score de crédibilité supérieur à 80')
        ON CONFLICT (user_id, badge_type) DO NOTHING;
    END IF;
    
    -- Mettre à jour user_moderation
    INSERT INTO public.user_moderation (user_id, credibility_score, total_reviews, total_helpful_votes)
    VALUES (_user_id, cred_score, review_count, helpful_count)
    ON CONFLICT (user_id) DO UPDATE SET
        credibility_score = cred_score,
        total_reviews = review_count,
        total_helpful_votes = helpful_count,
        updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fonction: Recalculer le résumé d'un anime
CREATE OR REPLACE FUNCTION public.recalculate_anime_summary(_anime_id INTEGER)
RETURNS VOID AS $$
DECLARE
    total_count INTEGER;
    avg_rate DECIMAL;
    rec_pct DECIMAL;
    r1_2 INTEGER; r3_4 INTEGER; r5_6 INTEGER; r7_8 INTEGER; r9_10 INTEGER;
    top_tags_json JSONB;
    anime_title_val TEXT;
    anime_image_val TEXT;
BEGIN
    -- Récupérer infos anime
    SELECT anime_title, anime_image INTO anime_title_val, anime_image_val
    FROM public.anime_reviews 
    WHERE anime_id = _anime_id AND status = 'visible'
    LIMIT 1;
    
    -- Calculer stats
    SELECT 
        COUNT(*),
        AVG(rating),
        (COUNT(*) FILTER (WHERE is_recommended = true)::DECIMAL / NULLIF(COUNT(*), 0) * 100)
    INTO total_count, avg_rate, rec_pct
    FROM public.anime_reviews 
    WHERE anime_id = _anime_id AND status = 'visible';
    
    -- Distribution des notes
    SELECT 
        COUNT(*) FILTER (WHERE rating >= 1 AND rating < 3),
        COUNT(*) FILTER (WHERE rating >= 3 AND rating < 5),
        COUNT(*) FILTER (WHERE rating >= 5 AND rating < 7),
        COUNT(*) FILTER (WHERE rating >= 7 AND rating < 9),
        COUNT(*) FILTER (WHERE rating >= 9 AND rating <= 10)
    INTO r1_2, r3_4, r5_6, r7_8, r9_10
    FROM public.anime_reviews 
    WHERE anime_id = _anime_id AND status = 'visible' AND rating IS NOT NULL;
    
    -- Top tags (agrégation)
    SELECT COALESCE(jsonb_agg(tag_data ORDER BY cnt DESC), '[]')
    INTO top_tags_json
    FROM (
        SELECT jsonb_build_object('tag', tag, 'count', COUNT(*)) as tag_data, COUNT(*) as cnt
        FROM public.anime_reviews, unnest(tags) as tag
        WHERE anime_id = _anime_id AND status = 'visible'
        GROUP BY tag
        ORDER BY COUNT(*) DESC
        LIMIT 10
    ) t;
    
    -- Upsert summary
    INSERT INTO public.anime_review_summary (
        anime_id, anime_title, anime_image, total_reviews, average_rating, 
        recommendation_percent, rating_1_2, rating_3_4, rating_5_6, rating_7_8, rating_9_10,
        top_tags, last_calculated_at
    ) VALUES (
        _anime_id, COALESCE(anime_title_val, 'Unknown'), anime_image_val, total_count, avg_rate,
        rec_pct, r1_2, r3_4, r5_6, r7_8, r9_10,
        top_tags_json, now()
    )
    ON CONFLICT (anime_id) DO UPDATE SET
        anime_title = COALESCE(anime_title_val, anime_review_summary.anime_title),
        anime_image = COALESCE(anime_image_val, anime_review_summary.anime_image),
        total_reviews = total_count,
        average_rating = avg_rate,
        recommendation_percent = rec_pct,
        rating_1_2 = r1_2,
        rating_3_4 = r3_4,
        rating_5_6 = r5_6,
        rating_7_8 = r7_8,
        rating_9_10 = r9_10,
        top_tags = top_tags_json,
        last_calculated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ═══════════════════════════════════════════════════════════════
-- TRIGGERS
-- ═══════════════════════════════════════════════════════════════

CREATE TRIGGER trg_reaction_counts
AFTER INSERT OR UPDATE OR DELETE ON public.review_reactions
FOR EACH ROW EXECUTE FUNCTION public.update_review_reaction_counts();

CREATE TRIGGER trg_report_threshold
AFTER INSERT ON public.review_reports
FOR EACH ROW EXECUTE FUNCTION public.check_report_threshold();

-- Trigger pour updated_at
CREATE TRIGGER update_user_moderation_updated_at
BEFORE UPDATE ON public.user_moderation
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_anime_reviews_updated_at
BEFORE UPDATE ON public.anime_reviews
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_review_reactions_updated_at
BEFORE UPDATE ON public.review_reactions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════
-- RLS POLICIES
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE public.user_moderation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anime_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anime_review_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_config ENABLE ROW LEVEL SECURITY;

-- user_moderation policies
CREATE POLICY "Users view own moderation" ON public.user_moderation
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins manage moderation" ON public.user_moderation
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- anime_reviews policies
CREATE POLICY "Anyone can view visible reviews" ON public.anime_reviews
    FOR SELECT USING (status = 'visible' OR auth.uid() = user_id);
CREATE POLICY "Authenticated users create reviews" ON public.anime_reviews
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own reviews" ON public.anime_reviews
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own reviews" ON public.anime_reviews
    FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins manage all reviews" ON public.anime_reviews
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- review_reactions policies
CREATE POLICY "Anyone can view reactions" ON public.review_reactions
    FOR SELECT USING (true);
CREATE POLICY "Authenticated users create reactions" ON public.review_reactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own reactions" ON public.review_reactions
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own reactions" ON public.review_reactions
    FOR DELETE USING (auth.uid() = user_id);

-- user_badges policies
CREATE POLICY "Anyone can view badges" ON public.user_badges
    FOR SELECT USING (true);
CREATE POLICY "System manages badges" ON public.user_badges
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- review_reports policies
CREATE POLICY "Authenticated users create reports" ON public.review_reports
    FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Users view own reports" ON public.review_reports
    FOR SELECT USING (auth.uid() = reporter_id);
CREATE POLICY "Admins manage reports" ON public.review_reports
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- anime_review_summary policies
CREATE POLICY "Anyone can view summaries" ON public.anime_review_summary
    FOR SELECT USING (true);
CREATE POLICY "System manages summaries" ON public.anime_review_summary
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- review_config policies
CREATE POLICY "Anyone can read config" ON public.review_config
    FOR SELECT USING (true);
CREATE POLICY "Admins manage config" ON public.review_config
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));