import { useEffect, useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Users, Globe, MessageCircle } from 'lucide-react';

const Teams = () => {
  const { t, lang } = useI18n();
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('teams').select('*, team_members(count)').order('created_at', { ascending: false }).then(({ data }) => {
      if (data) setTeams(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="min-h-screen container py-8">
      <h1 className="text-3xl font-bold text-foreground font-cairo mb-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
          <Users className="w-5 h-5 text-primary" />
        </div>
        {t('teams')}
      </h1>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 rounded-xl bg-secondary animate-pulse" />
          ))}
        </div>
      ) : teams.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((team: any) => (
            <Link key={team.id} to={`/teams/${team.id}`} className="group bg-card/50 rounded-xl p-5 border border-border/30 hover:border-primary/30 transition-all hover:shadow-[0_0_20px_hsl(265_90%_60%/0.1)]">
              <div className="flex items-center gap-4 mb-3">
                {team.logo_url ? (
                  <img src={team.logo_url} alt={team.name} className="w-14 h-14 rounded-xl object-cover" />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-primary/15 flex items-center justify-center">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">{team.name}</h3>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Users className="w-3 h-3" /> {team.team_members?.[0]?.count || 0} {t('members')}
                  </span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {lang === 'ar' ? (team.description_ar || team.description) : (team.description || '')}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground">{t('noResults')}</div>
      )}
    </div>
  );
};

export default Teams;
