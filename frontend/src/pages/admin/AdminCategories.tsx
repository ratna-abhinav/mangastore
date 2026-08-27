import { useState } from 'react';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  deleteCategory,
  fetchAdminCategories,
  saveCategory,
  updateCategory,
} from '../../api/adminApi';
import { useToast } from '../../components/Toast';

const inputCls = 'rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500';

export default function AdminCategories() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [pageNo, setPageNo] = useState(0);
  const [newName, setNewName] = useState('');
  const [newFile, setNewFile] = useState<File | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editActive, setEditActive] = useState(true);
  const [editFile, setEditFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const page = useQuery({
    queryKey: ['admin-categories', pageNo],
    queryFn: () => fetchAdminCategories(pageNo),
    placeholderData: keepPreviousData,
  });

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
    void queryClient.invalidateQueries({ queryKey: ['categories'] });
    void queryClient.invalidateQueries({ queryKey: ['admin-categories-all'] });
    void queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
  };

  const startEdit = (id: number, name: string, active?: number) => {
    setEditingId(id);
    setEditName(name);
    setEditActive(active !== 0);
    setEditFile(null);
  };

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setBusy(true);
    try {
      await saveCategory(newName.trim(), newFile ?? undefined);
      toast('success', 'Category saved successfully');
      setNewName('');
      setNewFile(null);
      refresh();
    } catch (err) {
      if (err && typeof err === 'object' && 'body' in err) {
        const body = (err as { body?: { error?: string } }).body;
        toast('error', body?.error ?? 'Failed to save category');
      } else {
        toast('error', 'Failed to save category');
      }
    } finally {
      setBusy(false);
    }
  };

  const saveEdit = async (id: number) => {
    if (!editName.trim()) return;
    setBusy(true);
    try {
      await updateCategory(id, editName.trim(), editActive, editFile ?? undefined);
      toast('success', 'Category updated successfully !!');
      setEditingId(null);
      refresh();
    } catch {
      toast('error', 'Failed to update category');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: number) => {
    if (!window.confirm('Delete this category permanently?')) return;
    setBusy(true);
    try {
      await deleteCategory(id);
      toast('info', 'Category deleted successfully !!');
      refresh();
    } catch {
      toast('error', 'Category not deleted! Internal server error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-slate-900">Categories</h1>

      <form onSubmit={add} className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New category name…"
          required
          className={`${inputCls} min-w-[220px]`}
        />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setNewFile(e.target.files?.[0] ?? null)}
          className="text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-emerald-700"
        />
        <button disabled={busy} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50">
          Add category
        </button>
      </form>

      {page.isLoading ? (
        <p className="py-12 text-center text-slate-500">Loading…</p>
      ) : !page.data || page.data.content.length === 0 ? (
        <p className="rounded-xl bg-white p-10 text-center text-slate-500">No categories.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Image</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {page.data.content.map((c) =>
                editingId === c.id ? (
                  <tr key={c.id} className="bg-emerald-50/40">
                    <td className="px-4 py-3">
                      <input type="file" accept="image/*" onChange={(e) => setEditFile(e.target.files?.[0] ?? null)} className="text-sm" />
                    </td>
                    <td className="px-4 py-3">
                      <input value={editName} onChange={(e) => setEditName(e.target.value)} className={inputCls} />
                    </td>
                    <td className="px-4 py-3">
                      <label className="flex items-center gap-2 text-slate-700">
                        <input type="checkbox" checked={editActive} onChange={(e) => setEditActive(e.target.checked)} className="h-4 w-4 accent-emerald-600" />
                        Active
                      </label>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-3">
                        <button onClick={() => void saveEdit(c.id)} disabled={busy} className="font-medium text-emerald-600 hover:underline disabled:opacity-40">
                          Save
                        </button>
                        <button onClick={() => setEditingId(null)} className="text-slate-500 hover:underline">
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={c.id}>
                    <td className="px-4 py-3">
                      <img
                        src={c.imageName}
                        alt=""
                        className="h-10 w-10 rounded object-cover"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src =
                            "https://br-wispy-block-a5yj4c8a.storage.c-1.us-east-2.aws.neon.tech/media-storage/defaults/default-image.png";
                        }}
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">{c.name}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${c.isActive === 0 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-700'}`}>
                        {c.isActive === 0 ? 'Inactive' : 'Active'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => startEdit(c.id, c.name, c.isActive)}
                          className="font-medium text-emerald-600 hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => void remove(c.id)}
                          disabled={busy}
                          className="font-medium text-red-500 hover:text-red-700 disabled:opacity-40"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      )}

      {page.data && page.data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 text-sm">
          <button disabled={page.data.first} onClick={() => setPageNo(pageNo - 1)} className="rounded-lg border border-slate-300 px-3 py-1.5 disabled:opacity-40">
            ← Prev
          </button>
          <span className="text-slate-600">Page {page.data.pageNo + 1} of {page.data.totalPages}</span>
          <button disabled={page.data.last} onClick={() => setPageNo(pageNo + 1)} className="rounded-lg border border-slate-300 px-3 py-1.5 disabled:opacity-40">
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
