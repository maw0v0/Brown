
-- =============================================
-- 1. Fix ALL RLS policies: RESTRICTIVE -> PERMISSIVE
-- =============================================

-- Drop all existing restrictive policies
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT schemaname, tablename, policyname 
    FROM pg_policies 
    WHERE schemaname = 'public'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- =============================================
-- PERMISSIVE policies for all tables
-- =============================================

-- manhwa
CREATE POLICY "manhwa_select" ON public.manhwa FOR SELECT TO public USING (true);
CREATE POLICY "manhwa_admin" ON public.manhwa FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- chapters
CREATE POLICY "chapters_select" ON public.chapters FOR SELECT TO public USING (true);
CREATE POLICY "chapters_admin" ON public.chapters FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- chapter_pages
CREATE POLICY "chapter_pages_select" ON public.chapter_pages FOR SELECT TO public USING (true);
CREATE POLICY "chapter_pages_admin" ON public.chapter_pages FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- genres
CREATE POLICY "genres_select" ON public.genres FOR SELECT TO public USING (true);
CREATE POLICY "genres_admin" ON public.genres FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- manhwa_genres
CREATE POLICY "manhwa_genres_select" ON public.manhwa_genres FOR SELECT TO public USING (true);
CREATE POLICY "manhwa_genres_admin" ON public.manhwa_genres FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- profiles
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT TO public USING (true);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "profiles_admin" ON public.profiles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- comments
CREATE POLICY "comments_select" ON public.comments FOR SELECT TO public USING (true);
CREATE POLICY "comments_insert" ON public.comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comments_update" ON public.comments FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "comments_delete" ON public.comments FOR DELETE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- comment_votes
CREATE POLICY "comment_votes_select" ON public.comment_votes FOR SELECT TO public USING (true);
CREATE POLICY "comment_votes_insert" ON public.comment_votes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comment_votes_update" ON public.comment_votes FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "comment_votes_delete" ON public.comment_votes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- favorites
CREATE POLICY "favorites_select" ON public.favorites FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "favorites_insert" ON public.favorites FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "favorites_delete" ON public.favorites FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ratings
CREATE POLICY "ratings_select" ON public.ratings FOR SELECT TO public USING (true);
CREATE POLICY "ratings_insert" ON public.ratings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ratings_update" ON public.ratings FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- reading_history
CREATE POLICY "reading_history_select" ON public.reading_history FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "reading_history_insert" ON public.reading_history FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reading_history_update" ON public.reading_history FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- chapter_unlocks
CREATE POLICY "chapter_unlocks_select" ON public.chapter_unlocks FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "chapter_unlocks_insert" ON public.chapter_unlocks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- coin_packages
CREATE POLICY "coin_packages_select" ON public.coin_packages FOR SELECT TO public USING (true);
CREATE POLICY "coin_packages_admin" ON public.coin_packages FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- coin_transactions
CREATE POLICY "coin_transactions_select" ON public.coin_transactions FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "coin_transactions_insert" ON public.coin_transactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "coin_transactions_admin" ON public.coin_transactions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- teams
CREATE POLICY "teams_select" ON public.teams FOR SELECT TO public USING (true);
CREATE POLICY "teams_admin" ON public.teams FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- team_members
CREATE POLICY "team_members_select" ON public.team_members FOR SELECT TO public USING (true);
CREATE POLICY "team_members_admin" ON public.team_members FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- join_requests
CREATE POLICY "join_requests_select" ON public.join_requests FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "join_requests_insert" ON public.join_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "join_requests_admin" ON public.join_requests FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- memberships
CREATE POLICY "memberships_select" ON public.memberships FOR SELECT TO public USING (true);
CREATE POLICY "memberships_admin" ON public.memberships FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- user_memberships
CREATE POLICY "user_memberships_select" ON public.user_memberships FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "user_memberships_admin" ON public.user_memberships FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- user_roles
CREATE POLICY "user_roles_select" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "user_roles_admin" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- 2. Add lock_duration_days to chapters
-- =============================================
ALTER TABLE public.chapters ADD COLUMN IF NOT EXISTS lock_duration_days integer DEFAULT 0;

-- =============================================
-- 3. Create notifications table
-- =============================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  message text,
  link text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_select" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "notifications_update" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "notifications_delete" ON public.notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "notifications_admin_insert" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);

-- =============================================
-- 4. Create manhwa_subscriptions table
-- =============================================
CREATE TABLE IF NOT EXISTS public.manhwa_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  manhwa_id uuid NOT NULL REFERENCES public.manhwa(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, manhwa_id)
);
ALTER TABLE public.manhwa_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "manhwa_subscriptions_select" ON public.manhwa_subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "manhwa_subscriptions_insert" ON public.manhwa_subscriptions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "manhwa_subscriptions_delete" ON public.manhwa_subscriptions FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- =============================================
-- 5. Create site_settings table
-- =============================================
CREATE TABLE IF NOT EXISTS public.site_settings (
  key text PRIMARY KEY,
  value text NOT NULL DEFAULT ''
);
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "site_settings_select" ON public.site_settings FOR SELECT TO public USING (true);
CREATE POLICY "site_settings_admin" ON public.site_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed site_settings
INSERT INTO public.site_settings (key, value) VALUES 
  ('site_name', 'RealmScans'),
  ('site_logo_url', ''),
  ('favicon_url', ''),
  ('featured_manhwa_ids', '[]')
ON CONFLICT (key) DO NOTHING;

-- =============================================
-- 6. Trigger: notify subscribers on new chapter
-- =============================================
CREATE OR REPLACE FUNCTION public.notify_new_chapter()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  sub RECORD;
  manhwa_title TEXT;
BEGIN
  SELECT title INTO manhwa_title FROM public.manhwa WHERE id = NEW.manhwa_id;
  FOR sub IN SELECT user_id FROM public.manhwa_subscriptions WHERE manhwa_id = NEW.manhwa_id
  LOOP
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (sub.user_id, 'new_chapter', 'New Chapter', 'Chapter ' || NEW.chapter_number || ' of ' || COALESCE(manhwa_title, '') || ' is now available!', '/manhwa/' || (SELECT slug FROM public.manhwa WHERE id = NEW.manhwa_id) || '/chapter/' || NEW.chapter_number);
  END LOOP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_new_chapter ON public.chapters;
CREATE TRIGGER trigger_notify_new_chapter
  AFTER INSERT ON public.chapters
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_chapter();

-- =============================================
-- 7. Trigger: notify on comment reply
-- =============================================
CREATE OR REPLACE FUNCTION public.notify_comment_reply()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  parent_user_id UUID;
  replier_name TEXT;
BEGIN
  IF NEW.parent_id IS NOT NULL THEN
    SELECT user_id INTO parent_user_id FROM public.comments WHERE id = NEW.parent_id;
    IF parent_user_id IS NOT NULL AND parent_user_id != NEW.user_id THEN
      SELECT username INTO replier_name FROM public.profiles WHERE user_id = NEW.user_id;
      INSERT INTO public.notifications (user_id, type, title, message, link)
      VALUES (parent_user_id, 'reply', 'New Reply', COALESCE(replier_name, 'Someone') || ' replied to your comment', NULL);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_comment_reply ON public.comments;
CREATE TRIGGER trigger_notify_comment_reply
  AFTER INSERT ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_comment_reply();
