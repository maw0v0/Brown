
-- ============================================
-- FIX ALL RLS POLICIES: RESTRICTIVE -> PERMISSIVE
-- ============================================

-- Drop ALL existing policies from ALL tables
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

-- ===== MANHWA =====
CREATE POLICY "manhwa_select" ON public.manhwa FOR SELECT TO public USING (true);
CREATE POLICY "manhwa_admin" ON public.manhwa FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ===== CHAPTERS =====
CREATE POLICY "chapters_select" ON public.chapters FOR SELECT TO public USING (true);
CREATE POLICY "chapters_admin" ON public.chapters FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ===== CHAPTER_PAGES =====
CREATE POLICY "chapter_pages_select" ON public.chapter_pages FOR SELECT TO public USING (true);
CREATE POLICY "chapter_pages_admin" ON public.chapter_pages FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ===== COMMENTS =====
CREATE POLICY "comments_select" ON public.comments FOR SELECT TO public USING (true);
CREATE POLICY "comments_insert" ON public.comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comments_update" ON public.comments FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "comments_delete" ON public.comments FOR DELETE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- ===== COMMENT_VOTES =====
CREATE POLICY "comment_votes_select" ON public.comment_votes FOR SELECT TO public USING (true);
CREATE POLICY "comment_votes_insert" ON public.comment_votes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comment_votes_update" ON public.comment_votes FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "comment_votes_delete" ON public.comment_votes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ===== PROFILES =====
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT TO public USING (true);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "profiles_admin" ON public.profiles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ===== FAVORITES =====
CREATE POLICY "favorites_select" ON public.favorites FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "favorites_insert" ON public.favorites FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "favorites_delete" ON public.favorites FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ===== RATINGS =====
CREATE POLICY "ratings_select" ON public.ratings FOR SELECT TO public USING (true);
CREATE POLICY "ratings_insert" ON public.ratings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ratings_update" ON public.ratings FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- ===== READING_HISTORY =====
CREATE POLICY "reading_history_select" ON public.reading_history FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "reading_history_insert" ON public.reading_history FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reading_history_update" ON public.reading_history FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- ===== NOTIFICATIONS =====
CREATE POLICY "notifications_select" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "notifications_insert" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "notifications_update" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "notifications_delete" ON public.notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ===== MANHWA_SUBSCRIPTIONS =====
CREATE POLICY "manhwa_subscriptions_select" ON public.manhwa_subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "manhwa_subscriptions_insert" ON public.manhwa_subscriptions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "manhwa_subscriptions_delete" ON public.manhwa_subscriptions FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ===== CHAPTER_UNLOCKS =====
CREATE POLICY "chapter_unlocks_select" ON public.chapter_unlocks FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "chapter_unlocks_insert" ON public.chapter_unlocks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- ===== COIN_TRANSACTIONS =====
CREATE POLICY "coin_transactions_select" ON public.coin_transactions FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "coin_transactions_insert" ON public.coin_transactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "coin_transactions_admin" ON public.coin_transactions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ===== COIN_PACKAGES =====
CREATE POLICY "coin_packages_select" ON public.coin_packages FOR SELECT TO public USING (true);
CREATE POLICY "coin_packages_admin" ON public.coin_packages FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ===== GENRES =====
CREATE POLICY "genres_select" ON public.genres FOR SELECT TO public USING (true);
CREATE POLICY "genres_admin" ON public.genres FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ===== MANHWA_GENRES =====
CREATE POLICY "manhwa_genres_select" ON public.manhwa_genres FOR SELECT TO public USING (true);
CREATE POLICY "manhwa_genres_admin" ON public.manhwa_genres FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ===== TEAMS =====
CREATE POLICY "teams_select" ON public.teams FOR SELECT TO public USING (true);
CREATE POLICY "teams_admin" ON public.teams FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ===== TEAM_MEMBERS =====
CREATE POLICY "team_members_select" ON public.team_members FOR SELECT TO public USING (true);
CREATE POLICY "team_members_admin" ON public.team_members FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ===== JOIN_REQUESTS =====
CREATE POLICY "join_requests_select" ON public.join_requests FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "join_requests_insert" ON public.join_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "join_requests_admin" ON public.join_requests FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ===== USER_ROLES =====
CREATE POLICY "user_roles_select" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "user_roles_admin" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ===== SITE_SETTINGS =====
CREATE POLICY "site_settings_select" ON public.site_settings FOR SELECT TO public USING (true);
CREATE POLICY "site_settings_admin" ON public.site_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ===== MEMBERSHIPS =====
CREATE POLICY "memberships_select" ON public.memberships FOR SELECT TO public USING (true);
CREATE POLICY "memberships_admin" ON public.memberships FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ===== USER_MEMBERSHIPS =====
CREATE POLICY "user_memberships_select" ON public.user_memberships FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "user_memberships_admin" ON public.user_memberships FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ===== Add triggers if missing =====
DROP TRIGGER IF EXISTS on_new_chapter ON public.chapters;
CREATE TRIGGER on_new_chapter AFTER INSERT ON public.chapters FOR EACH ROW EXECUTE FUNCTION public.notify_new_chapter();

DROP TRIGGER IF EXISTS on_comment_reply ON public.comments;
CREATE TRIGGER on_comment_reply AFTER INSERT ON public.comments FOR EACH ROW EXECUTE FUNCTION public.notify_comment_reply();

-- Insert default site_settings if not exist
INSERT INTO public.site_settings (key, value) VALUES 
  ('site_name', 'RealmScans'),
  ('site_logo_url', ''),
  ('favicon_url', ''),
  ('featured_manhwa_ids', '[]'),
  ('privacy_policy', ''),
  ('terms_of_service', '')
ON CONFLICT (key) DO NOTHING;
