import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchAdminUsers, setUserStatus, type AdminUser } from '../../api/adminApi';
import { useToast } from '../../components/Toast';

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
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        {[1, 2].map((t) => (
          <button
            key={t}
            onClick={() => setSearchParams({ type: String(t) })}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              type === t ? 'bg-emerald-600 text-white' : 'border border-slate-300 bg-white text-slate-600 hover:border-emerald-400'
            }`}
          >
            {t === 1 ? 'Users' : 'Admins'}
          </button>
        ))}
      </div>

      {users.isLoading ? (
        <p className="py-12 text-center text-slate-500">Loading…</p>
      ) : !users.data || users.data.length === 0 ? (
        <p className="rounded-xl bg-white p-10 text-center text-slate-500">No accounts found.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Account</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Mobile</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.data.map((u) => (
                <tr key={u.id} className={pendingId === u.id ? 'opacity-40' : ''}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={u.profileImage ?? undefined}
                        alt=""
                        className="h-9 w-9 rounded-full border border-slate-200 object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <span className="font-medium text-slate-800">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{u.email}</td>
                  <td className="px-4 py-3 text-slate-600">{u.mobileNumber}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${u.isEnable === 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                      {u.isEnable === 1 ? 'Enabled' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => void toggle(u)}
                      disabled={pendingId !== null}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                        u.isEnable === 1
                          ? 'border border-red-200 text-red-500 hover:bg-red-50'
                          : 'border border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                      } disabled:opacity-40`}
                    >
                      {pendingId === u.id ? 'Updating…' : u.isEnable === 1 ? 'Disable' : 'Enable'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
