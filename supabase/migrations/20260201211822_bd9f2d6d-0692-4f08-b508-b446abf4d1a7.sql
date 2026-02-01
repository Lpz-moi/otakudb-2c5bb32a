-- ===========================================
-- OtakuDB Database Schema: Authentication Discord & Partage Social
-- Sécurité renforcée avec RLS multi-couches
-- ===========================================

-- 1. Enum pour les rôles utilisateur
CREATE TYPE public.app_role AS ENUM ('user', 'moderator', 'admin');

-- 2. Enum pour le statut de partage
CREATE TYPE public.share_permission AS ENUM ('none', 'friends_only', 'public');

-- 3. Table des profils utilisateur (liée à Discord)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    discord_id TEXT UNIQUE,
    discord_username TEXT,
    discord_avatar TEXT,
    display_name TEXT NOT NULL,
    bio TEXT DEFAULT '',
    favorite_genres TEXT[] DEFAULT '{}',
    share_watching SHARE_PERMISSION DEFAULT 'friends_only',
    share_completed SHARE_PERMISSION DEFAULT 'friends_only',
    share_planned SHARE_PERMISSION DEFAULT 'none',
    share_favorites SHARE_PERMISSION DEFAULT 'friends_only',
    total_anime INTEGER DEFAULT 0,
    total_episodes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 4. Table des rôles utilisateur (sécurité)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE (user_id, role)
);

-- 5. Table des listes d'anime synchronisées
CREATE TABLE public.anime_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    anime_id INTEGER NOT NULL,
    anime_title TEXT NOT NULL,
    anime_image TEXT,
    status TEXT NOT NULL CHECK (status IN ('watching', 'completed', 'planned', 'favorites')),
    progress INTEGER DEFAULT 0,
    total_episodes INTEGER,
    rating INTEGER CHECK (rating >= 1 AND rating <= 10),
    notes TEXT,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE (user_id, anime_id)
);

-- 6. Table des amitiés
CREATE TABLE public.friendships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    addressee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE (requester_id, addressee_id),
    CHECK (requester_id != addressee_id)
);

-- 7. Table des partages de liste
CREATE TABLE public.shared_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    share_code TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(8), 'hex'),
    list_type TEXT NOT NULL CHECK (list_type IN ('watching', 'completed', 'planned', 'favorites', 'all')),
    expires_at TIMESTAMP WITH TIME ZONE,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 8. Table des activités (pour le feed social)
CREATE TABLE public.activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    activity_type TEXT NOT NULL CHECK (activity_type IN ('added', 'completed', 'rated', 'favorited', 'started_watching')),
    anime_id INTEGER NOT NULL,
    anime_title TEXT NOT NULL,
    anime_image TEXT,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 9. Table des sessions (audit de sécurité)
CREATE TABLE public.session_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    action TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- ===========================================
-- Indexes pour performance
-- ===========================================
CREATE INDEX idx_profiles_discord_id ON public.profiles(discord_id);
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_anime_lists_user_id ON public.anime_lists(user_id);
CREATE INDEX idx_anime_lists_status ON public.anime_lists(status);
CREATE INDEX idx_friendships_requester ON public.friendships(requester_id);
CREATE INDEX idx_friendships_addressee ON public.friendships(addressee_id);
CREATE INDEX idx_friendships_status ON public.friendships(status);
CREATE INDEX idx_activities_user_id ON public.activities(user_id);
CREATE INDEX idx_activities_created_at ON public.activities(created_at DESC);
CREATE INDEX idx_shared_lists_code ON public.shared_lists(share_code);
CREATE INDEX idx_session_logs_user_id ON public.session_logs(user_id);

-- ===========================================
-- Enable Row Level Security
-- ===========================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anime_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_logs ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- Security Definer Function for role check
-- ===========================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = _user_id AND role = _role
    )
$$;

-- Function to check friendship
CREATE OR REPLACE FUNCTION public.are_friends(_user1 UUID, _user2 UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.friendships
        WHERE status = 'accepted'
        AND (
            (requester_id = _user1 AND addressee_id = _user2)
            OR (requester_id = _user2 AND addressee_id = _user1)
        )
    )
$$;

-- ===========================================
-- RLS Policies: Profiles
-- ===========================================
-- Users can view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

-- Users can view friends' profiles
CREATE POLICY "Users can view friends profiles"
ON public.profiles FOR SELECT
USING (public.are_friends(auth.uid(), user_id));

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);

-- Users can insert their own profile
CREATE POLICY "Users can create own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete own profile
CREATE POLICY "Users can delete own profile"
ON public.profiles FOR DELETE
USING (auth.uid() = user_id);

-- ===========================================
-- RLS Policies: User Roles (admin only)
-- ===========================================
CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

-- ===========================================
-- RLS Policies: Anime Lists
-- ===========================================
-- Users can CRUD their own anime lists
CREATE POLICY "Users can manage own anime lists"
ON public.anime_lists FOR ALL
USING (auth.uid() = user_id);

-- Friends can view based on share permissions
CREATE POLICY "Friends can view shared anime lists"
ON public.anime_lists FOR SELECT
USING (
    public.are_friends(auth.uid(), user_id)
    AND EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.user_id = anime_lists.user_id
        AND (
            (anime_lists.status = 'watching' AND p.share_watching IN ('friends_only', 'public'))
            OR (anime_lists.status = 'completed' AND p.share_completed IN ('friends_only', 'public'))
            OR (anime_lists.status = 'planned' AND p.share_planned IN ('friends_only', 'public'))
            OR (anime_lists.status = 'favorites' AND p.share_favorites IN ('friends_only', 'public'))
        )
    )
);

-- ===========================================
-- RLS Policies: Friendships
-- ===========================================
-- Users can view their friendships
CREATE POLICY "Users can view own friendships"
ON public.friendships FOR SELECT
USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Users can create friendship requests
CREATE POLICY "Users can create friendship requests"
ON public.friendships FOR INSERT
WITH CHECK (auth.uid() = requester_id);

-- Users can update friendships they're part of
CREATE POLICY "Users can update own friendships"
ON public.friendships FOR UPDATE
USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Users can delete friendships they're part of
CREATE POLICY "Users can delete own friendships"
ON public.friendships FOR DELETE
USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- ===========================================
-- RLS Policies: Shared Lists
-- ===========================================
CREATE POLICY "Users can manage own shared lists"
ON public.shared_lists FOR ALL
USING (auth.uid() = owner_id);

-- Anyone can view shared lists by code (public access)
CREATE POLICY "Anyone can view shared lists"
ON public.shared_lists FOR SELECT
USING (true);

-- ===========================================
-- RLS Policies: Activities
-- ===========================================
CREATE POLICY "Users can manage own activities"
ON public.activities FOR ALL
USING (auth.uid() = user_id);

-- Friends can view activities
CREATE POLICY "Friends can view activities"
ON public.activities FOR SELECT
USING (public.are_friends(auth.uid(), user_id));

-- ===========================================
-- RLS Policies: Session Logs
-- ===========================================
CREATE POLICY "Users can view own session logs"
ON public.session_logs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert session logs"
ON public.session_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- ===========================================
-- Trigger for updated_at
-- ===========================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_anime_lists_updated_at
    BEFORE UPDATE ON public.anime_lists
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_friendships_updated_at
    BEFORE UPDATE ON public.friendships
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ===========================================
-- Trigger to create profile on user signup
-- ===========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, display_name, discord_id, discord_username, discord_avatar)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Utilisateur'),
        NEW.raw_user_meta_data->>'provider_id',
        NEW.raw_user_meta_data->>'custom_claims'->>'global_name',
        NEW.raw_user_meta_data->>'avatar_url'
    );
    
    -- Assign default user role
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();