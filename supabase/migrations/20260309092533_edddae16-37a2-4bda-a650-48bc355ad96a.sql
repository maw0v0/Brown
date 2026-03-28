
-- Drop ALL restrictive policies and recreate as permissive

-- chapter_pages
DROP POLICY IF EXISTS "Admins manage chapter pages" ON public.chapter_pages;
DROP POLICY IF EXISTS "Chapter pages viewable by everyone" ON public.chapter_pages;
CREATE POLICY "chapter_pages_select" ON public.chapter_pages FOR SELECT USING (true);
CREATE POLICY "chapter_pages_admin" ON public.chapter_pages FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- chapters
DROP POLICY IF EXISTS "Admins manage chapters" ON public.chapters;
DROP POLICY IF EXISTS "Chapters viewable by everyone" ON public.chapters;
CREATE POLICY "chapters_select" ON public.chapters FOR SELECT USING (true);
CREATE POLICY "chapters_admin" ON public.chapters FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- manhwa
DROP POLICY IF EXISTS "Admins manage manhwa" ON public.manhwa;
DROP POLICY IF EXISTS "Manhwa viewable by everyone" ON public.manhwa;
CREATE POLICY "manhwa_select" ON public.manhwa FOR SELECT USING (true);
CREATE POLICY "manhwa_admin" ON public.manhwa FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- manhwa_genres
DROP POLICY IF EXISTS "Admins manage manhwa genres" ON public.manhwa_genres;
DROP POLICY IF EXISTS "Manhwa genres viewable by everyone" ON public.manhwa_genres;
CREATE POLICY "manhwa_genres_select" ON public.manhwa_genres FOR SELECT USING (true);
CREATE POLICY "manhwa_genres_admin" ON public.manhwa_genres FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- genres
DROP POLICY IF EXISTS "Admins manage genres" ON public.genres;
DROP POLICY IF EXISTS "Genres viewable by everyone" ON public.genres;
CREATE POLICY "genres_select" ON public.genres FOR SELECT USING (true);
CREATE POLICY "genres_admin" ON public.genres FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- comments
DROP POLICY IF EXISTS "Admins manage comments" ON public.comments;
DROP POLICY IF EXISTS "Auth users create comments" ON public.comments;
DROP POLICY IF EXISTS "Comments viewable by everyone" ON public.comments;
DROP POLICY IF EXISTS "Users delete own comments" ON public.comments;
DROP POLICY IF EXISTS "Users update own comments" ON public.comments;
CREATE POLICY "comments_select" ON public.comments FOR SELECT USING (true);
CREATE POLICY "comments_insert" ON public.comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comments_update" ON public.comments FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "comments_delete" ON public.comments FOR DELETE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- comment_votes
DROP POLICY IF EXISTS "Users delete own votes" ON public.comment_votes;
DROP POLICY IF EXISTS "Users manage own votes" ON public.comment_votes;
DROP POLICY IF EXISTS "Users update own votes" ON public.comment_votes;
DROP POLICY IF EXISTS "Votes viewable by everyone" ON public.comment_votes;
CREATE POLICY "comment_votes_select" ON public.comment_votes FOR SELECT USING (true);
CREATE POLICY "comment_votes_insert" ON public.comment_votes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comment_votes_update" ON public.comment_votes FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "comment_votes_delete" ON public.comment_votes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- favorites
DROP POLICY IF EXISTS "Users delete own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users manage own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users view own favorites" ON public.favorites;
CREATE POLICY "favorites_select" ON public.favorites FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "favorites_insert" ON public.favorites FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "favorites_delete" ON public.favorites FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ratings
DROP POLICY IF EXISTS "Ratings viewable by everyone" ON public.ratings;
DROP POLICY IF EXISTS "Users manage own ratings" ON public.ratings;
DROP POLICY IF EXISTS "Users update own ratings" ON public.ratings;
CREATE POLICY "ratings_select" ON public.ratings FOR SELECT USING (true);
CREATE POLICY "ratings_insert" ON public.ratings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ratings_update" ON public.ratings FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- profiles
DROP POLICY IF EXISTS "Admins manage profiles" ON public.profiles;
DROP POLICY IF EXISTS "Profiles viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "profiles_admin" ON public.profiles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- reading_history
DROP POLICY IF EXISTS "Users manage own history" ON public.reading_history;
DROP POLICY IF EXISTS "Users update own history" ON public.reading_history;
DROP POLICY IF EXISTS "Users view own history" ON public.reading_history;
CREATE POLICY "reading_history_select" ON public.reading_history FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "reading_history_insert" ON public.reading_history FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reading_history_update" ON public.reading_history FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- chapter_unlocks
DROP POLICY IF EXISTS "Users create own unlocks" ON public.chapter_unlocks;
DROP POLICY IF EXISTS "Users view own unlocks" ON public.chapter_unlocks;
CREATE POLICY "chapter_unlocks_select" ON public.chapter_unlocks FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "chapter_unlocks_insert" ON public.chapter_unlocks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- coin_packages
DROP POLICY IF EXISTS "Admins manage coin packages" ON public.coin_packages;
DROP POLICY IF EXISTS "Coin packages viewable by everyone" ON public.coin_packages;
CREATE POLICY "coin_packages_select" ON public.coin_packages FOR SELECT USING (true);
CREATE POLICY "coin_packages_admin" ON public.coin_packages FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- coin_transactions
DROP POLICY IF EXISTS "Admins manage transactions" ON public.coin_transactions;
DROP POLICY IF EXISTS "Users insert own transactions" ON public.coin_transactions;
DROP POLICY IF EXISTS "Users view own transactions" ON public.coin_transactions;
CREATE POLICY "coin_transactions_select" ON public.coin_transactions FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "coin_transactions_insert" ON public.coin_transactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "coin_transactions_admin" ON public.coin_transactions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- teams
DROP POLICY IF EXISTS "Admins manage teams" ON public.teams;
DROP POLICY IF EXISTS "Teams viewable by everyone" ON public.teams;
CREATE POLICY "teams_select" ON public.teams FOR SELECT USING (true);
CREATE POLICY "teams_admin" ON public.teams FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- team_members
DROP POLICY IF EXISTS "Admins manage team members" ON public.team_members;
DROP POLICY IF EXISTS "Team members viewable by everyone" ON public.team_members;
CREATE POLICY "team_members_select" ON public.team_members FOR SELECT USING (true);
CREATE POLICY "team_members_admin" ON public.team_members FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- join_requests
DROP POLICY IF EXISTS "Admins manage requests" ON public.join_requests;
DROP POLICY IF EXISTS "Users create own requests" ON public.join_requests;
DROP POLICY IF EXISTS "Users view own requests" ON public.join_requests;
CREATE POLICY "join_requests_select" ON public.join_requests FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "join_requests_insert" ON public.join_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "join_requests_admin" ON public.join_requests FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- memberships
DROP POLICY IF EXISTS "Admins manage memberships" ON public.memberships;
DROP POLICY IF EXISTS "Memberships viewable by everyone" ON public.memberships;
CREATE POLICY "memberships_select" ON public.memberships FOR SELECT USING (true);
CREATE POLICY "memberships_admin" ON public.memberships FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- user_memberships
DROP POLICY IF EXISTS "Admins manage user memberships" ON public.user_memberships;
DROP POLICY IF EXISTS "Users view own memberships" ON public.user_memberships;
CREATE POLICY "user_memberships_select" ON public.user_memberships FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "user_memberships_admin" ON public.user_memberships FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- user_roles
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "user_roles_select" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "user_roles_admin" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create trigger for auto_assign_admin if not exists
DROP TRIGGER IF EXISTS on_auth_user_created_admin ON auth.users;
CREATE TRIGGER on_auth_user_created_admin AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.auto_assign_admin();

-- Create trigger for handle_new_user if not exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Storage policies for avatars bucket
DROP POLICY IF EXISTS "Avatar upload" ON storage.objects;
DROP POLICY IF EXISTS "Avatar public read" ON storage.objects;
DROP POLICY IF EXISTS "Avatar update" ON storage.objects;
DROP POLICY IF EXISTS "Avatar delete" ON storage.objects;
CREATE POLICY "avatar_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "avatar_upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars');
CREATE POLICY "avatar_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars');
CREATE POLICY "avatar_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'avatars');
