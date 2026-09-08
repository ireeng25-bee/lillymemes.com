-- ============================================================================
-- LILLY MEMES — Production Database Schema & Security Policies
-- Database: PostgreSQL 15+ / Supabase Engine
-- Features: Row Level Security (RLS), Role-Based Access Control, Real Storage
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. PROFILES TABLE & AUTH TRIGGER
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    email TEXT,
    avatar_url TEXT DEFAULT 'assets/icon.png',
    role TEXT NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN')),
    bio TEXT,
    followers_count INTEGER NOT NULL DEFAULT 0,
    following_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast user queries
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Automatic Profile Creation Trigger on Supabase Auth Sign-Up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    raw_username TEXT;
    raw_display_name TEXT;
BEGIN
    raw_username := LOWER(REGEXP_REPLACE(COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || SUBSTRING(NEW.id::TEXT, 1, 8)), '[^a-z0-9_]', '', 'g'));
    raw_display_name := COALESCE(NEW.raw_user_meta_data->>'display_name', 'Meme Lover');

    INSERT INTO public.profiles (id, username, display_name, email, role, avatar_url)
    VALUES (
        NEW.id,
        raw_username,
        raw_display_name,
        NEW.email,
        'USER', -- Mandatory: All new registrations are USER role (Rule 9)
        'assets/icon.png'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 2. POSTS (MEMES) TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    caption TEXT NOT NULL CHECK (char_length(caption) <= 600),
    image_url TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Funny',
    hashtags TEXT,
    is_motd BOOLEAN NOT NULL DEFAULT FALSE,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    views_count INTEGER NOT NULL DEFAULT 0,
    reactions_count INTEGER NOT NULL DEFAULT 0,
    comments_count INTEGER NOT NULL DEFAULT 0,
    shares_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_category ON public.posts(category);
CREATE INDEX IF NOT EXISTS idx_posts_is_motd ON public.posts(is_motd);
CREATE INDEX IF NOT EXISTS idx_posts_views ON public.posts(views_count DESC);
CREATE INDEX IF NOT EXISTS idx_posts_reactions ON public.posts(reactions_count DESC);

-- ============================================================================
-- 3. REACTIONS TABLE (❤️ love, 😂 funny, 🔥 fire, 😮 wow, 💀 dead)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reaction_type TEXT NOT NULL CHECK (reaction_type IN ('love', 'funny', 'fire', 'wow', 'dead')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_post_user_reaction UNIQUE (post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_reactions_post ON public.reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user ON public.reactions(user_id);

-- ============================================================================
-- 4. COMMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 500),
    is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
    likes_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.comments
    ADD COLUMN IF NOT EXISTS parent_comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_comments_post ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_pinned ON public.comments(is_pinned DESC);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON public.comments(parent_comment_id);

-- ============================================================================
-- 5. SAVED POSTS (BOOKMARKS) TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.saved_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_saved_post UNIQUE (user_id, post_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_posts_user ON public.saved_posts(user_id);

-- ============================================================================
-- 6. NOTIFICATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifs_user ON public.notifications(user_id, is_read);

-- ============================================================================
-- 6B. WEB PUSH DEVICE SUBSCRIPTIONS
-- ============================================================================
-- One authenticated user may have a subscription for each browser/device.
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    user_agent TEXT,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    new_meme_notifications BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_enabled
    ON public.push_subscriptions(user_id, enabled);

CREATE TABLE IF NOT EXISTS public.push_notification_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    subscription_id UUID NOT NULL REFERENCES public.push_subscriptions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_push_delivery UNIQUE (post_id, subscription_id)
);

CREATE INDEX IF NOT EXISTS idx_push_deliveries_post
    ON public.push_notification_deliveries(post_id);

-- ============================================================================
-- 7. CHALLENGES & ENTRIES (Rule 27)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    prompt TEXT NOT NULL,
    image_url TEXT,
    entries_count INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.challenge_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    caption TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 8. STORIES, QUOTES & ACTIVITY LOGS (Rules 23, 24, 34)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.stories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    summary TEXT NOT NULL,
    cover_image TEXT,
    views_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote TEXT NOT NULL,
    author TEXT NOT NULL DEFAULT 'LILLY MEMES',
    category TEXT NOT NULL DEFAULT 'Motivation',
    likes_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_name TEXT NOT NULL,
    action_text TEXT NOT NULL,
    target_title TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 9. ATOMIC COUNTER HELPER RPC
-- ============================================================================
CREATE OR REPLACE FUNCTION public.increment_counter(
    row_table TEXT,
    row_id UUID,
    col_name TEXT,
    amount INTEGER
)
RETURNS VOID AS $$
BEGIN
    IF col_name NOT IN ('views_count', 'reactions_count', 'comments_count', 'shares_count', 'entries_count', 'likes_count') THEN
        RAISE EXCEPTION 'Invalid column specified for counter adjustment';
    END IF;

    IF row_table = 'posts' THEN
        EXECUTE format('UPDATE public.posts SET %I = GREATEST(0, %I + $1) WHERE id = $2', col_name, col_name)
        USING amount, row_id;
    ELSIF row_table = 'challenges' THEN
        EXECUTE format('UPDATE public.challenges SET %I = GREATEST(0, %I + $1) WHERE id = $2', col_name, col_name)
        USING amount, row_id;
    ELSIF row_table = 'comments' THEN
        EXECUTE format('UPDATE public.comments SET %I = GREATEST(0, %I + $1) WHERE id = $2', col_name, col_name)
        USING amount, row_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 10. ROW LEVEL SECURITY (RLS) POLICIES (Rules 10, 18, 20, 40)
-- ============================================================================

-- Helper: Check if requesting user is verified ADMIN
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'ADMIN'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_notification_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- ---------------- PROFILES POLICIES ----------------
CREATE POLICY "Profiles are viewable by everyone"
    ON public.profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())); -- Prevent self-promotion to ADMIN (Rule 8)

-- ---------------- POSTS POLICIES (Rule 11: ONLY ADMIN CAN PUBLISH) ----------------
CREATE POLICY "Posts are viewable by everyone"
    ON public.posts FOR SELECT
    USING (true);

CREATE POLICY "Only admins can insert posts"
    ON public.posts FOR INSERT
    WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can update posts"
    ON public.posts FOR UPDATE
    USING (public.is_admin());

CREATE POLICY "Only admins can delete posts"
    ON public.posts FOR DELETE
    USING (public.is_admin());

-- ---------------- REACTIONS POLICIES ----------------
CREATE POLICY "Reactions are viewable by everyone"
    ON public.reactions FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can create reactions"
    ON public.reactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reactions"
    ON public.reactions FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reactions"
    ON public.reactions FOR DELETE
    USING (auth.uid() = user_id);

-- ---------------- COMMENTS POLICIES ----------------
CREATE POLICY "Comments are viewable by everyone"
    ON public.comments FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can add comments"
    ON public.comments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update comments (pinning/moderation)"
    ON public.comments FOR UPDATE
    USING (public.is_admin());

CREATE POLICY "Authors or admins can delete comments"
    ON public.comments FOR DELETE
    USING (auth.uid() = user_id OR public.is_admin());

-- ---------------- SAVED POSTS POLICIES ----------------
CREATE POLICY "Users can view their own saved memes"
    ON public.saved_posts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can save memes"
    ON public.saved_posts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove saved memes"
    ON public.saved_posts FOR DELETE
    USING (auth.uid() = user_id);

-- ---------------- NOTIFICATIONS POLICIES ----------------
CREATE POLICY "Users can view their own notifications"
    ON public.notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can mark their own notifications as read"
    ON public.notifications FOR UPDATE
    USING (auth.uid() = user_id);

-- ---------------- WEB PUSH SUBSCRIPTION POLICIES ----------------
CREATE POLICY "Users can view their own push subscriptions"
    ON public.push_subscriptions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can register their own push subscriptions"
    ON public.push_subscriptions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own push subscriptions"
    ON public.push_subscriptions FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own push subscriptions"
    ON public.push_subscriptions FOR DELETE
    USING (auth.uid() = user_id);

-- Delivery records are written only by the trusted server-side dispatcher.
CREATE POLICY "Users can view their own push delivery records"
        ON public.push_notification_deliveries FOR SELECT
        USING (
            EXISTS (
                SELECT 1 FROM public.push_subscriptions
                WHERE push_subscriptions.id = push_notification_deliveries.subscription_id
                    AND push_subscriptions.user_id = auth.uid()
            )
        );

-- ---------------- STORIES & QUOTES & CHALLENGES POLICIES ----------------
CREATE POLICY "Content viewable by everyone"
    ON public.challenges FOR SELECT USING (true);
CREATE POLICY "Challenge entries viewable by everyone"
    ON public.challenge_entries FOR SELECT USING (true);
CREATE POLICY "Authenticated users can enter challenges"
    ON public.challenge_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Stories viewable by everyone"
    ON public.stories FOR SELECT USING (true);
CREATE POLICY "Quotes viewable by everyone"
    ON public.quotes FOR SELECT USING (true);
CREATE POLICY "Activity log viewable by everyone"
    ON public.activity_log FOR SELECT USING (true);

-- ============================================================================
-- 11. SUPABASE STORAGE BUCKETS CONFIGURATION (Rule 19 & 42)
-- ============================================================================
-- Run in Supabase SQL editor to ensure public buckets exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true),
       ('memes', 'memes', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage Policies for Avatars
CREATE POLICY "Avatar images are publicly accessible"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload avatars"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- Storage Policies for Memes
CREATE POLICY "Meme images are publicly accessible"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'memes');

CREATE POLICY "Only admins can upload memes"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'memes' AND public.is_admin());