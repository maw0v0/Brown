import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Users, Globe, Send, UserPlus, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

const TeamDetail = () => {
  const { teamId } = useParams();
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const [team, setTeam] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [manhwaList, setManhwaList] = useState<any[]>([]);
  const [joinMessage, setJoinMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teamId) return;
    const fetch = async () => {
      const [teamRes, membersRes, manhwaRes] = await Promise.all([
        supabase.from('teams').select('*').eq('id', teamId).single(),
        supabase.from('team_members').select('*, profiles:user_id(username, avatar_url)').eq('team_id', teamId),
        supabase.from('manhwa').select('*').eq('team_id', teamId).order('updated_at', { ascending: false }),
      ]);
      if (teamRes.data) setTeam(teamRes.data);
      if (membersRes.data) setMembers(membersRes.data);
      if (manhwaRes.data) setManhwaList(manhwaRes.data);
      setLoading(false);
    };
    fetch();
  }, [teamId]);

  const handleJoinRequest = async () => {
    if (!user || !team) return;
    const { error } = await supabase.from('join_requests').insert({ team_id: team.id, user_id: user.id, message: joinMessage || null });
    if (error) toast.error(error.message);
    else { toast.success(lang === 'ar' ? 'تم إرسال الطلب!' : 'Request sent!'); setJoinMessage(''); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!team) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">{t('noResults')}</div>;

  const socials = [
    team.discord_url && { name: 'Discord', url: team.discord_url },
    team.twitter_url && { name: 'X/Twitter', url: team.twitter_url },
    team.instagram_url && { name: 'Instagram', url: team.instagram_url },
    team.telegram_url && { name: 'Telegram', url: team.telegram_url },
    team.website_url && { name: 'Website', url: team.website_url },
  ].filter(Boolean);

  return (
    <div className="min-h-screen container py-8">
      {/* Team header */}
      <div className="flex flex-col md:flex-row items-start gap-6 mb-10">
        {team.logo_url ? (
          <img src={team.logo_url} alt={team.name} className="w-24 h-24 rounded-2xl object-cover border-2 border-border" />
        ) : (
          <div className="w-24 h-24 rounded-2xl bg-primary/15 flex items-center justify-center"><Users className="w-10 h-10 text-primary" /></div>
        )}
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-foreground font-cairo mb-2">{team.name}</h1>
          <p className="text-muted-foreground mb-4">{lang === 'ar' ? (team.description_ar || team.description) : (team.description || '')}</p>
          <div className="flex flex-wrap gap-2">
            {socials.map((s: any) => (
              <a key={s.name} href={s.url} target="_blank" rel="noopener" className="px-3 py-1.5 rounded-full text-xs bg-secondary text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all">
                {s.name}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Members */}
        <div>
          <h2 className="text-xl font-bold text-foreground font-cairo mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" /> {t('members')} ({members.length})
          </h2>
          <div className="space-y-2">
            {members.map((m: any) => {
              const fallbackName = lang === 'ar' ? 'مستخدم مجهول' : 'Anonymous user';
              const displayName = m.profiles?.username || fallbackName;
              const displayInitial = displayName[0]?.toUpperCase() || 'U';
              return (
                <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg bg-card/50 border border-border/30">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-primary text-xs font-bold">{displayInitial}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-foreground">{displayName}</span>
                    <span className="text-xs text-muted-foreground ms-2 bg-secondary px-2 py-0.5 rounded">{m.role}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {user && (
            <div className="mt-6 p-4 rounded-xl bg-card/30 border border-border/30">
              <h3 className="text-sm font-bold text-foreground mb-2 flex items-center gap-1.5">
                <UserPlus className="w-4 h-4 text-primary" /> {t('joinRequest')}
              </h3>
              <Textarea value={joinMessage} onChange={e => setJoinMessage(e.target.value)} placeholder={lang === 'ar' ? 'رسالة (اختياري)' : 'Message (optional)'} className="bg-secondary/50 border-border/50 mb-3 min-h-[60px]" />
              <Button onClick={handleJoinRequest} className="bg-primary hover:bg-primary/90 w-full gap-2">
                <Send className="w-4 h-4" /> {t('joinRequest')}
              </Button>
            </div>
          )}
        </div>

        {/* Team's Manhwa */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-bold text-foreground font-cairo mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" /> {t('projectsTaken')} ({manhwaList.length})
          </h2>
          {manhwaList.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {manhwaList.map((m: any) => (
                <Link key={m.id} to={`/manhwa/${m.slug}`} className="group relative block">
                  <div className="relative overflow-hidden rounded-lg aspect-[5/7] bg-secondary">
                    <img src={m.cover_url || `https://placehold.co/300x420/1a1a2e/7c3aed?text=${encodeURIComponent(m.title)}`} alt={m.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-80" />
                    <div className="absolute bottom-0 p-2">
                      <h3 className="font-bold text-xs text-foreground line-clamp-2 group-hover:text-primary transition-colors">{lang === 'ar' ? (m.title_ar || m.title) : m.title}</h3>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">{t('noResults')}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamDetail;
