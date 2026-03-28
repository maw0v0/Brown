
-- =============================================
-- FIX ALL RLS POLICIES: RESTRICTIVE → PERMISSIVE
-- =============================================

-- chapter_pages
DROP POLICY IF EXISTS "Admins manage chapter pages" ON public.chapter_pages;
DROP POLICY IF EXISTS "Chapter pages viewable by everyone" ON public.chapter_pages;
CREATE POLICY "Admins manage chapter pages" ON public.chapter_pages FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Chapter pages viewable by everyone" ON public.chapter_pages FOR SELECT TO public USING (true);

-- chapter_unlocks
DROP POLICY IF EXISTS "Users create own unlocks" ON public.chapter_unlocks;
DROP POLICY IF EXISTS "Users view own unlocks" ON public.chapter_unlocks;
CREATE POLICY "Users create own unlocks" ON public.chapter_unlocks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users view own unlocks" ON public.chapter_unlocks FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- chapters
DROP POLICY IF EXISTS "Admins manage chapters" ON public.chapters;
DROP POLICY IF EXISTS "Chapters viewable by everyone" ON public.chapters;
CREATE POLICY "Admins manage chapters" ON public.chapters FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Chapters viewable by everyone" ON public.chapters FOR SELECT TO public USING (true);

-- coin_packages
DROP POLICY IF EXISTS "Admins manage coin packages" ON public.coin_packages;
DROP POLICY IF EXISTS "Coin packages viewable by everyone" ON public.coin_packages;
CREATE POLICY "Admins manage coin packages" ON public.coin_packages FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Coin packages viewable by everyone" ON public.coin_packages FOR SELECT TO public USING (true);

-- coin_transactions
DROP POLICY IF EXISTS "Admins manage transactions" ON public.coin_transactions;
DROP POLICY IF EXISTS "Users view own transactions" ON public.coin_transactions;
CREATE POLICY "Admins manage transactions" ON public.coin_transactions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users view own transactions" ON public.coin_transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own transactions" ON public.coin_transactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- comment_votes
DROP POLICY IF EXISTS "Users delete own votes" ON public.comment_votes;
DROP POLICY IF EXISTS "Users manage own votes" ON public.comment_votes;
DROP POLICY IF EXISTS "Users update own votes" ON public.comment_votes;
DROP POLICY IF EXISTS "Votes viewable by everyone" ON public.comment_votes;
CREATE POLICY "Votes viewable by everyone" ON public.comment_votes FOR SELECT TO public USING (true);
CREATE POLICY "Users manage own votes" ON public.comment_votes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own votes" ON public.comment_votes FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own votes" ON public.comment_votes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- comments
DROP POLICY IF EXISTS "Admins manage comments" ON public.comments;
DROP POLICY IF EXISTS "Auth users create comments" ON public.comments;
DROP POLICY IF EXISTS "Comments viewable by everyone" ON public.comments;
DROP POLICY IF EXISTS "Users delete own comments" ON public.comments;
DROP POLICY IF EXISTS "Users update own comments" ON public.comments;
CREATE POLICY "Comments viewable by everyone" ON public.comments FOR SELECT TO public USING (true);
CREATE POLICY "Auth users create comments" ON public.comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own comments" ON public.comments FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own comments" ON public.comments FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins manage comments" ON public.comments FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- favorites
DROP POLICY IF EXISTS "Users delete own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users manage own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users view own favorites" ON public.favorites;
CREATE POLICY "Users view own favorites" ON public.favorites FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users manage own favorites" ON public.favorites FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own favorites" ON public.favorites FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- genres
DROP POLICY IF EXISTS "Admins manage genres" ON public.genres;
DROP POLICY IF EXISTS "Genres viewable by everyone" ON public.genres;
CREATE POLICY "Genres viewable by everyone" ON public.genres FOR SELECT TO public USING (true);
CREATE POLICY "Admins manage genres" ON public.genres FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- join_requests
DROP POLICY IF EXISTS "Admins manage requests" ON public.join_requests;
DROP POLICY IF EXISTS "Users create own requests" ON public.join_requests;
DROP POLICY IF EXISTS "Users view own requests" ON public.join_requests;
CREATE POLICY "Users view own requests" ON public.join_requests FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users create own requests" ON public.join_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage requests" ON public.join_requests FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- manhwa
DROP POLICY IF EXISTS "Admins manage manhwa" ON public.manhwa;
DROP POLICY IF EXISTS "Manhwa viewable by everyone" ON public.manhwa;
CREATE POLICY "Manhwa viewable by everyone" ON public.manhwa FOR SELECT TO public USING (true);
CREATE POLICY "Admins manage manhwa" ON public.manhwa FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- manhwa_genres
DROP POLICY IF EXISTS "Admins manage manhwa genres" ON public.manhwa_genres;
DROP POLICY IF EXISTS "Manhwa genres viewable by everyone" ON public.manhwa_genres;
CREATE POLICY "Manhwa genres viewable by everyone" ON public.manhwa_genres FOR SELECT TO public USING (true);
CREATE POLICY "Admins manage manhwa genres" ON public.manhwa_genres FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- memberships
DROP POLICY IF EXISTS "Admins manage memberships" ON public.memberships;
DROP POLICY IF EXISTS "Memberships viewable by everyone" ON public.memberships;
CREATE POLICY "Memberships viewable by everyone" ON public.memberships FOR SELECT TO public USING (true);
CREATE POLICY "Admins manage memberships" ON public.memberships FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- profiles
DROP POLICY IF EXISTS "Profiles viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Profiles viewable by everyone" ON public.profiles FOR SELECT TO public USING (true);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins manage profiles" ON public.profiles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- ratings
DROP POLICY IF EXISTS "Ratings viewable by everyone" ON public.ratings;
DROP POLICY IF EXISTS "Users manage own ratings" ON public.ratings;
DROP POLICY IF EXISTS "Users update own ratings" ON public.ratings;
CREATE POLICY "Ratings viewable by everyone" ON public.ratings FOR SELECT TO public USING (true);
CREATE POLICY "Users manage own ratings" ON public.ratings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own ratings" ON public.ratings FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- reading_history
DROP POLICY IF EXISTS "Users manage own history" ON public.reading_history;
DROP POLICY IF EXISTS "Users view own history" ON public.reading_history;
CREATE POLICY "Users view own history" ON public.reading_history FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users manage own history" ON public.reading_history FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own history" ON public.reading_history FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- team_members
DROP POLICY IF EXISTS "Admins manage team members" ON public.team_members;
DROP POLICY IF EXISTS "Team members viewable by everyone" ON public.team_members;
CREATE POLICY "Team members viewable by everyone" ON public.team_members FOR SELECT TO public USING (true);
CREATE POLICY "Admins manage team members" ON public.team_members FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- teams
DROP POLICY IF EXISTS "Admins manage teams" ON public.teams;
DROP POLICY IF EXISTS "Teams viewable by everyone" ON public.teams;
CREATE POLICY "Teams viewable by everyone" ON public.teams FOR SELECT TO public USING (true);
CREATE POLICY "Admins manage teams" ON public.teams FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- user_memberships
DROP POLICY IF EXISTS "Admins manage user memberships" ON public.user_memberships;
DROP POLICY IF EXISTS "Users view own memberships" ON public.user_memberships;
CREATE POLICY "Users view own memberships" ON public.user_memberships FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins manage user memberships" ON public.user_memberships FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- user_roles
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- =============================================
-- STORAGE BUCKET: avatars
-- =============================================
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view avatars" ON storage.objects FOR SELECT TO public USING (bucket_id = 'avatars');
CREATE POLICY "Authenticated users upload avatars" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users update own avatars" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users delete own avatars" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- =============================================
-- AUTO-ASSIGN ADMIN ROLE FOR kuronaranze11z@gmail.com
-- =============================================
CREATE OR REPLACE FUNCTION public.auto_assign_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email = 'kuronaranze11z@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_assign_admin ON auth.users;
CREATE TRIGGER on_auth_user_created_assign_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.auto_assign_admin();

-- Also assign admin if user already exists
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users WHERE email = 'kuronaranze11z@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Add banner_url to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS banner_url text;

-- Add unique constraint for reading_history upsert
CREATE UNIQUE INDEX IF NOT EXISTS reading_history_user_chapter_unique ON public.reading_history (user_id, chapter_id);
