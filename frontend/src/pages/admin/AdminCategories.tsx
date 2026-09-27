import { useState } from 'react';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { FolderTree, Pencil, Plus, Save, Trash2, X } from 'lucide-react';
import { deleteCategory, fetchAdminCategories, saveCategory, updateCategory } from '../../api/adminApi';
import { useToast } from '../../components/Toast';
import PageHeader from '../../components/ui/PageHeader';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Field from '../../components/ui/Field';
import { Checkbox, FileInput, Input } from '../../components/ui/Input';
import Pagination from '../../components/ui/Pagination';
import EmptyState from '../../components/ui/EmptyState';
import { Table, TableShell, TBody, TD, TH, THead, TR } from '../../components/ui/Table';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { useConfirm } from '../../components/ui/Confirm';
import { imageFallback } from '../../utils/image';

export default function AdminCategories() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const confirm = useConfirm();
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

  const remove = async (id: number, name: string) => {
    const ok = await confirm({
      title: 'Delete this category?',
      message: `“${name}” will be removed permanently.`,
      confirmLabel: 'Delete',
    });
    if (!ok) return;

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
    <div>
      <PageHeader
        title="Categories"
        description="The genre tiles shoppers browse on the storefront."
        icon={<FolderTree className="h-5 w-5" />}
        crumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Categories' }]}
      />

      <Card as="form" onSubmit={add} className="mb-5 flex flex-wrap items-end gap-3 p-4 sm:p-5">
        <Field label="Category name" htmlFor="newCategory" required className="min-w-[200px] flex-1">
          <Input
            id="newCategory"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Seinen"
            required
          />
        </Field>
        <Field label="Artwork" htmlFor="newCategoryImage" className="min-w-[200px] flex-1" hint="optional">
          <FileInput id="newCategoryImage" onChange={(e) => setNewFile(e.target.files?.[0] ?? null)} />
        </Field>
        <Button type="submit" variant="gradient" loading={busy}>
          <Plus className="h-4 w-4" />
          Add category
        </Button>
      </Card>

      {page.isLoading ? (
        <TableSkeleton />
      ) : !page.data || page.data.content.length === 0 ? (
        <EmptyState
          icon={<FolderTree className="h-7 w-7" />}
          title="No categories yet"
          description="Add a genre above and it will appear on the storefront immediately."
        />
      ) : (
        <TableShell>
          <Table minWidth={680}>
            <THead>
              <tr>
                <TH>Image</TH>
                <TH>Name</TH>
                <TH>Status</TH>
                <TH className="text-right">Actions</TH>
              </tr>
            </THead>
            <TBody>
              {page.data.content.map((c) =>
                editingId === c.id ? (
                  <TR key={c.id} className="bg-sakura-500/[0.06]">
                    <TD>
                      <FileInput onChange={(e) => setEditFile(e.target.files?.[0] ?? null)} />
                    </TD>
                    <TD>
                      <Input value={editName} onChange={(e) => setEditName(e.target.value)} aria-label="Category name" />
                    </TD>
                    <TD>
                      <label className="flex items-center gap-2 text-sm text-mist-200">
                        <Checkbox checked={editActive} onChange={(e) => setEditActive(e.target.checked)} />
                        Active
                      </label>
                    </TD>
                    <TD>
                      <div className="flex justify-end gap-2">
                        <Button variant="primary" size="sm" onClick={() => void saveEdit(c.id)} disabled={busy}>
                          <Save className="h-3.5 w-3.5" />
                          Save
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>
                          <X className="h-3.5 w-3.5" />
                          Cancel
                        </Button>
                      </div>
                    </TD>
                  </TR>
                ) : (
                  <TR key={c.id}>
                    <TD>
                      <img
                        src={c.imageName}
                        alt=""
                        referrerPolicy="no-referrer"
                        onError={imageFallback()}
                        className="h-11 w-11 rounded-lg border border-ink-600/60 object-cover"
                      />
                    </TD>
                    <TD className="font-semibold text-mist-50">{c.name}</TD>
                    <TD>
                      <Badge tone={c.isActive === 0 ? 'crimson' : 'mint'} dot>
                        {c.isActive === 0 ? 'Inactive' : 'Active'}
                      </Badge>
                    </TD>
                    <TD>
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => startEdit(c.id, c.name, c.isActive)}>
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => void remove(c.id, c.name)}
                          disabled={busy}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </Button>
                      </div>
                    </TD>
                  </TR>
                ),
              )}
            </TBody>
          </Table>
        </TableShell>
      )}

      {page.data && (
        <Pagination
          className="mt-5"
          pageNo={page.data.pageNo}
          totalPages={page.data.totalPages}
          onChange={setPageNo}
        />
      )}
    </div>
  );
}
