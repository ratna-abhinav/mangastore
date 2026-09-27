import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { UserCog, Users } from 'lucide-react';
import { fetchAdminUsers, setUserStatus, type AdminUser } from '../../api/adminApi';
import { useToast } from '../../components/Toast';
import PageHeader from '../../components/ui/PageHeader';
import Badge from '../../components/ui/Badge';
import Button, { ButtonLink } from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import { Table, TableShell, TBody, TD, TH, THead, TR } from '../../components/ui/Table';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { imageFallback } from '../../utils/image';
import { cx } from '../../utils/cx';

const TABS = [
  { type: 1 as const, label: 'Users', icon: Users },
  { type: 2 as const, label: 'Admins', icon: UserCog },
];

export default function AdminUsers() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const type = (Number(searchParams.get('type') ?? 1) === 2 ? 2 : 1) as 1 | 2;
  const [pendingId, setPendingId] = useState<number | null>(null);

  const users = useQuery({
    queryKey: ['admin-users', type],
    queryFn: () => fetchAdminUsers(type),
    placeholderData: (prev) => prev,
  });

  const toggle = async (u: AdminUser) => {
    if (pendingId !== null) return;
    setPendingId(u.id);
    try {
      await setUserStatus(u.id, u.isEnable !== 1);
      toast('success', 'Account Status Updated');
      void queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      void queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    } catch {
      toast('error', 'Account status not updated! Internal Server Error');
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Accounts"
        description="Enable or disable access for readers and administrators."
        icon={<Users className="h-5 w-5" />}
        crumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Accounts' }]}
        actions={
          <ButtonLink to="/admin/add-admin" variant="gradient">
            <UserCog className="h-4 w-4" />
            Add admin
          </ButtonLink>
        }
      />

      <div role="tablist" aria-label="Account type" className="mb-5 inline-flex gap-1 rounded-full border border-ink-600/60 bg-ink-900/60 p-1">
        {TABS.map((t) => (
          <button
            key={t.type}
            role="tab"
            type="button"
            aria-selected={type === t.type}
            onClick={() => setSearchParams({ type: String(t.type) })}
            className={cx(
              'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition',
              type === t.type
                ? 'grad-brand text-white'
                : 'text-mist-400 hover:text-mist-100',
            )}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {users.isLoading ? (
        <TableSkeleton />
      ) : !users.data || users.data.length === 0 ? (
        <EmptyState
          icon={<Users className="h-7 w-7" />}
          title={type === 1 ? 'No user accounts' : 'No admin accounts'}
          description={
            type === 1
              ? 'Registered readers will show up here.'
              : 'Add an administrator to give someone dashboard access.'
          }
          action={
            type === 2 ? (
              <ButtonLink to="/admin/add-admin" variant="gradient">
                <UserCog className="h-4 w-4" />
                Add admin
              </ButtonLink>
            ) : undefined
          }
        />
      ) : (
        <TableShell>
          <Table minWidth={720}>
            <THead>
              <tr>
                <TH>Account</TH>
                <TH>Email</TH>
                <TH>Mobile</TH>
                <TH>Status</TH>
                <TH className="text-right">Action</TH>
              </tr>
            </THead>
            <TBody>
              {users.data.map((u) => (
                <TR key={u.id} muted={pendingId === u.id}>
                  <TD>
                    <div className="flex items-center gap-3">
                      <img
                        src={u.profileImage ?? undefined}
                        alt=""
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        onError={imageFallback()}
                        className="h-9 w-9 shrink-0 rounded-full border border-ink-600 object-cover"
                      />
                      <span className="font-semibold text-mist-50">{u.name}</span>
                    </div>
                  </TD>
                  <TD className="text-mist-400">{u.email}</TD>
                  <TD className="text-mist-400">{u.mobileNumber}</TD>
                  <TD>
                    <Badge tone={u.isEnable === 1 ? 'mint' : 'crimson'} dot>
                      {u.isEnable === 1 ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </TD>
                  <TD>
                    <div className="flex justify-end">
                      <Button
                        variant={u.isEnable === 1 ? 'danger' : 'primary'}
                        size="sm"
                        onClick={() => void toggle(u)}
                        disabled={pendingId !== null}
                      >
                        {pendingId === u.id ? 'Updating…' : u.isEnable === 1 ? 'Disable' : 'Enable'}
                      </Button>
                    </div>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </TableShell>
      )}
    </div>
  );
}
