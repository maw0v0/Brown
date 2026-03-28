
-- ============================================
-- ENUMS
-- ============================================
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
CREATE TYPE public.manhwa_status AS ENUM ('ongoing', 'completed', 'hiatus');
CREATE TYPE public.join_request_status AS ENUM ('pending', 'approved', 'rejected');

-- ============================================
-- UTILITY FUNCTION: update_updated_at_column
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ============================================
-- USER ROLES TABLE
-- ============================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
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

CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- PROFILES TABLE
-- ============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  coins INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- GENRES TABLE
-- ============================================
CREATE TABLE public.genres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.genres ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Genres viewable by everyone" ON public.genres FOR SELECT USING (true);
CREATE POLICY "Admins manage genres" ON public.genres FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- TEAMS TABLE
-- ============================================
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  description_ar TEXT,
  logo_url TEXT,
  website_url TEXT,
  discord_url TEXT,
  twitter_url TEXT,
  instagram_url TEXT,
  telegram_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teams viewable by everyone" ON public.teams FOR SELECT USING (true);
CREATE POLICY "Admins manage teams" ON public.teams FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON public.teams
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- TEAM MEMBERS TABLE
-- ============================================
CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team members viewable by everyone" ON public.team_members FOR SELECT USING (true);
CREATE POLICY "Admins manage team members" ON public.team_members FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- JOIN REQUESTS TABLE
-- ============================================
CREATE TABLE public.join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT,
  status join_request_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);
ALTER TABLE public.join_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own requests" ON public.join_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create own requests" ON public.join_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage requests" ON public.join_requests FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- MANHWA TABLE
-- ============================================
CREATE TABLE public.manhwa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  title_ar TEXT,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  description_ar TEXT,
  cover_url TEXT,
  banner_url TEXT,
  status manhwa_status NOT NULL DEFAULT 'ongoing',
  team_id UUID REFERENCES public.teams(id),
  author TEXT,
  artist TEXT,
  release_year INTEGER,
  views INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.manhwa ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Manhwa viewable by everyone" ON public.manhwa FOR SELECT USING (true);
CREATE POLICY "Admins manage manhwa" ON public.manhwa FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_manhwa_updated_at BEFORE UPDATE ON public.manhwa
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- MANHWA_GENRES (junction)
-- ============================================
CREATE TABLE public.manhwa_genres (
  manhwa_id UUID NOT NULL REFERENCES public.manhwa(id) ON DELETE CASCADE,
  genre_id UUID NOT NULL REFERENCES public.genres(id) ON DELETE CASCADE,
  PRIMARY KEY (manhwa_id, genre_id)
);
ALTER TABLE public.manhwa_genres ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Manhwa genres viewable by everyone" ON public.manhwa_genres FOR SELECT USING (true);
CREATE POLICY "Admins manage manhwa genres" ON public.manhwa_genres FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- CHAPTERS TABLE
-- ============================================
CREATE TABLE public.chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manhwa_id UUID NOT NULL REFERENCES public.manhwa(id) ON DELETE CASCADE,
  chapter_number NUMERIC NOT NULL,
  title TEXT,
  title_ar TEXT,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  coin_price INTEGER NOT NULL DEFAULT 0,
  views INTEGER NOT NULL DEFAULT 0,
  published_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(manhwa_id, chapter_number)
);
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Chapters viewable by everyone" ON public.chapters FOR SELECT USING (true);
CREATE POLICY "Admins manage chapters" ON public.chapters FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- CHAPTER PAGES TABLE
-- ============================================
CREATE TABLE public.chapter_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  image_url TEXT NOT NULL,
  UNIQUE(chapter_id, page_number)
);
ALTER TABLE public.chapter_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Chapter pages viewable by everyone" ON public.chapter_pages FOR SELECT USING (true);
CREATE POLICY "Admins manage chapter pages" ON public.chapter_pages FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- RATINGS TABLE
-- ============================================
CREATE TABLE public.ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  manhwa_id UUID REFERENCES public.manhwa(id) ON DELETE CASCADE,
  chapter_id UUID REFERENCES public.chapters(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, manhwa_id),
  UNIQUE(user_id, chapter_id)
);
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ratings viewable by everyone" ON public.ratings FOR SELECT USING (true);
CREATE POLICY "Users manage own ratings" ON public.ratings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own ratings" ON public.ratings FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- COMMENTS TABLE (nested)
-- ============================================
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  manhwa_id UUID REFERENCES public.manhwa(id) ON DELETE CASCADE,
  chapter_id UUID REFERENCES public.chapters(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  likes_count INTEGER NOT NULL DEFAULT 0,
  dislikes_count INTEGER NOT NULL DEFAULT 0,
  is_reported BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Comments viewable by everyone" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Auth users create comments" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own comments" ON public.comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own comments" ON public.comments FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins manage comments" ON public.comments FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- COMMENT VOTES TABLE
-- ============================================
CREATE TABLE public.comment_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('like', 'dislike')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, comment_id)
);
ALTER TABLE public.comment_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Votes viewable by everyone" ON public.comment_votes FOR SELECT USING (true);
CREATE POLICY "Users manage own votes" ON public.comment_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own votes" ON public.comment_votes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own votes" ON public.comment_votes FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- FAVORITES TABLE
-- ============================================
CREATE TABLE public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  manhwa_id UUID NOT NULL REFERENCES public.manhwa(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, manhwa_id)
);
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own favorites" ON public.favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users manage own favorites" ON public.favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own favorites" ON public.favorites FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- READING HISTORY TABLE
-- ============================================
CREATE TABLE public.reading_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, chapter_id)
);
ALTER TABLE public.reading_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own history" ON public.reading_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users manage own history" ON public.reading_history FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- CHAPTER UNLOCKS TABLE
-- ============================================
CREATE TABLE public.chapter_unlocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  coins_spent INTEGER NOT NULL,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, chapter_id)
);
ALTER TABLE public.chapter_unlocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own unlocks" ON public.chapter_unlocks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create own unlocks" ON public.chapter_unlocks FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- COIN PACKAGES TABLE
-- ============================================
CREATE TABLE public.coin_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  coins INTEGER NOT NULL,
  price_usd NUMERIC(10,2) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.coin_packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Coin packages viewable by everyone" ON public.coin_packages FOR SELECT USING (true);
CREATE POLICY "Admins manage coin packages" ON public.coin_packages FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- MEMBERSHIPS TABLE
-- ============================================
CREATE TABLE public.memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  description TEXT,
  description_ar TEXT,
  price_usd NUMERIC(10,2) NOT NULL,
  duration_days INTEGER NOT NULL DEFAULT 30,
  benefits JSONB,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Memberships viewable by everyone" ON public.memberships FOR SELECT USING (true);
CREATE POLICY "Admins manage memberships" ON public.memberships FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- USER MEMBERSHIPS TABLE
-- ============================================
CREATE TABLE public.user_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  membership_id UUID NOT NULL REFERENCES public.memberships(id),
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.user_memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own memberships" ON public.user_memberships FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins manage user memberships" ON public.user_memberships FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- COIN TRANSACTIONS TABLE
-- ============================================
CREATE TABLE public.coin_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('purchase', 'spend', 'refund', 'bonus')),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own transactions" ON public.coin_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins manage transactions" ON public.coin_transactions FOR ALL USING (public.has_role(auth.uid(), 'admin'));
