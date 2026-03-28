import { useEffect, useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { User, Shield, UserCog, Coins, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';

const AdminUsers = () => {
  const { t, lang } = useI18n();
  const [users, setUsers] = useState<any[]>([]);
  const [coinDialog, setCoinDialog] = useState(false);
  const [roleDialog, setRoleDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [coinAmount, setCoinAmount] = useState('');
  const [coinAction, setCoinAction] = useState<'add' | 'subtract'>('add');
  const [selectedRole, setSelectedRole] = useState('user');

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*, user_roles(role)')
      .order('created_at', { ascending: false });
    
    if (error) {
        console.error(error);
        return;
    }
    if (data) setUsers(data);
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCoinUpdate = async () => {
    if (!selectedUser || !coinAmount) return;
    const amount = Number(coinAmount);
    if (isNaN(amount) || amount <= 0) return;

    const newCoins = coinAction === 'add'
      ? (selectedUser.coins || 0) + amount
      : Math.max(0, (selectedUser.coins || 0) - amount);

    await supabase.from('profiles').update({ coins: newCoins }).eq('user_id', selectedUser.user_id);
    await supabase.from('coin_transactions').insert({
      user_id: selectedUser.user_id,
      amount: coinAction === 'add' ? amount : -amount,
      type: 'admin_adjustment',
      description: `Admin ${coinAction === 'add' ? 'added' : 'removed'} ${amount} coins`,
    });
    toast.success(lang === 'ar' ? 'تم التحديث!' : 'Updated!');
    setCoinDialog(false);
    setCoinAmount('');
    fetchUsers();
  };

  const handleRoleUpdate = async () => {
    if (!selectedUser) return;

    try {
      await supabase
        .from('profiles')
        .update({ role: selectedRole })
        .eq('user_id', selectedUser.user_id);

      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', selectedUser.user_id);

      if (selectedRole !== 'user') {
        await supabase
          .from('user_roles')
          .insert({ user_id: selectedUser.user_id, role: selectedRole as any });
      }

      toast.success(lang === 'ar' ? 'تم تحديث الرتبة بنجاح!' : 'Role updated successfully!');
      setRoleDialog(false);
      fetchUsers();
    } catch (err) {
      console.error("Update error:", err);
      toast.error(lang === 'ar' ? 'فشل التحديث' : 'Update failed');
    }
  };

  const getRoleDisplay = (u: any) => {
    const rolesData = u.user_roles;
    const roles = Array.isArray(rolesData) 
        ? rolesData.map((r: any) => r.role) 
        : (rolesData?.role ? [rolesData.role] : []);

    if (roles.includes('admin') || u.role === 'admin') return { label: 'Admin', color: 'bg-destructive/15 text-destructive' };
    if (roles.includes('moderator') || u.role === 'moderator') return { label: 'Moderator', color: 'bg-amber-500/15 text-amber-400' };
    return { label: 'User', color: 'bg-secondary text-muted-foreground' };
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-foreground font-cairo mb-4 flex items-center gap-2">
        <UserCog className="w-5 h-5 text-primary" />
        {t('manageUsers')}
      </h2>
      <p className="text-sm text-muted-foreground mb-6">{lang === 'ar' ? `${users.length} مستخدم مسجل` : `${users.length} registered users`}</p>

      <div className="space-y-2">
        {users.map(u => {
          const role = getRoleDisplay(u);
          return (
            <div key={u.user_id || u.id} className="flex items-center gap-4 p-3 rounded-lg bg-card/50 border border-border/30">
              <Avatar className="w-9 h-9">
                <AvatarImage src={u.avatar_url || ''} />
                <AvatarFallback className="bg-primary/20 text-primary text-sm font-bold">
                  {(u.username || '?')[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground text-sm">{u.username}</span>
                  {u.display_name && <span className="text-xs text-muted-foreground">({u.display_name})</span>}
                </div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${role.color}`}>{role.label}</span>
              <span className="text-xs text-primary flex items-center gap-1"><Coins className="w-3 h-3" /> {u.coins || 0}</span>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="w-7 h-7 text-muted-foreground hover:text-primary" onClick={() => { setSelectedUser(u); setCoinDialog(true); }}>
                  <Coins className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="w-7 h-7 text-muted-foreground hover:text-primary" onClick={() => {
                  setSelectedUser(u);
                  const rd = u.user_roles;
                  const rs = Array.isArray(rd) ? rd.map((r: any) => r.role) : (rd?.role ? [rd.role] : []);
                  const currentRole = rs.includes('admin') || u.role === 'admin' ? 'admin' : (rs.includes('moderator') || u.role === 'moderator' ? 'moderator' : 'user');
                  setSelectedRole(currentRole);
                  setRoleDialog(true);
                }}>
                  <Shield className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={coinDialog} onOpenChange={setCoinDialog}>
        <DialogContent className="bg-card border-border/50 max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-cairo">{lang === 'ar' ? 'تعديل العملات' : 'Adjust Coins'} - {selectedUser?.username}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{lang === 'ar' ? 'الرصيد الحالي:' : 'Current balance:'} <strong className="text-primary">{selectedUser?.coins || 0}</strong></p>
            <div className="flex gap-2">
              <Button variant={coinAction === 'add' ? 'default' : 'outline'} size="sm" onClick={() => setCoinAction('add')} className={coinAction === 'add' ? 'bg-primary' : ''}>
                <Plus className="w-3 h-3 me-1" /> {lang === 'ar' ? 'إضافة' : 'Add'}
              </Button>
              <Button variant={coinAction === 'subtract' ? 'default' : 'outline'} size="sm" onClick={() => setCoinAction('subtract')} className={coinAction === 'subtract' ? 'bg-destructive' : ''}>
                <Minus className="w-3 h-3 me-1" /> {lang === 'ar' ? 'خصم' : 'Subtract'}
              </Button>
            </div>
            <input type="number" min="1" value={coinAmount} onChange={e => setCoinAmount(e.target.value)} placeholder="Amount" className="w-full h-10 px-3 rounded-md bg-secondary/50 border border-border/50 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
            <Button onClick={handleCoinUpdate} className="w-full bg-primary hover:bg-primary/90">{lang === 'ar' ? 'تحديث' : 'Update'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={roleDialog} onOpenChange={setRoleDialog}>
        <DialogContent className="bg-card border-border/50 max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-cairo">{lang === 'ar' ? 'تغيير الرتبة' : 'Change Role'} - {selectedUser?.username}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="bg-secondary/50 border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">{lang === 'ar' ? 'مستخدم' : 'User'}</SelectItem>
                <SelectItem value="moderator">{lang === 'ar' ? 'مشرف' : 'Moderator'}</SelectItem>
                <SelectItem value="admin">{lang === 'ar' ? 'أدمن' : 'Admin'}</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleRoleUpdate} className="w-full bg-primary hover:bg-primary/90">{lang === 'ar' ? 'تحديث' : 'Update'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;
