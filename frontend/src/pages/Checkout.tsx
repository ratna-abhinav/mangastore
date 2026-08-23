import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchCart, fetchCheckout, fetchProfile, placeOrder } from '../api/userArea';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { inr } from '../utils/format';

const inputCls = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500';
const labelCls = 'mb-1 block text-sm font-medium text-slate-700';

export default function Checkout() {
  const { user, refresh } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const cart = useQuery({ queryKey: ['cart'], queryFn: fetchCart, placeholderData: keepPreviousData });
  const checkout = useQuery({ queryKey: ['checkout'], queryFn: fetchCheckout });
  const profile = useQuery({ queryKey: ['profile'], queryFn: fetchProfile });

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobileNo: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    paymentType: 'COD',
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    const p = profile.data;
    setForm((f) => ({
      ...f,
      firstName: p?.name?.split(' ')[0] ?? user.name?.split(' ')[0] ?? '',
      lastName: p?.name ? (p.name.split(' ').slice(1).join(' ') || f.lastName) : f.lastName,
      email: user.email,
      mobileNo: p?.mobileNumber ?? f.mobileNo,
      address: p?.address ?? f.address,
      city: p?.city ?? f.city,
      state: p?.state ?? f.state,
      pincode: p?.pincode ?? f.pincode,
    }));
  }, [user, profile.data]);

  if (cart.isSuccess && cart.data.items.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-lg text-slate-600">Your cart is empty — nothing to checkout.</p>
        <Link to="/products" className="mt-4 inline-block rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-500">
          Browse products
        </Link>
      </div>
    );
  }

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await placeOrder(form);
      await refresh();
      void queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast('success', 'Order placed successfully !!');
      navigate('/my-orders');
    } catch {
      toast('error', 'Failed to place order. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <form onSubmit={submit} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
        <h1 className="text-xl font-bold text-slate-900">Delivery details</h1>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls} htmlFor="firstName">First name *</label>
            <input id="firstName" required value={form.firstName} onChange={set('firstName')} className={inputCls} />
          </div>
          <div>
            <label className={labelCls} htmlFor="lastName">Last name</label>
            <input id="lastName" value={form.lastName} onChange={set('lastName')} className={inputCls} />
          </div>
          <div>
            <label className={labelCls} htmlFor="email">Email *</label>
            <input id="email" type="email" required value={form.email} onChange={set('email')} className={inputCls} />
          </div>
          <div>
            <label className={labelCls} htmlFor="mobileNo">Mobile no. *</label>
            <input id="mobileNo" required value={form.mobileNo} onChange={set('mobileNo')} className={inputCls} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls} htmlFor="address">Address *</label>
            <input id="address" required value={form.address} onChange={set('address')} className={inputCls} />
          </div>
          <div>
            <label className={labelCls} htmlFor="city">City *</label>
            <input id="city" required value={form.city} onChange={set('city')} className={inputCls} />
          </div>
          <div>
            <label className={labelCls} htmlFor="state">State *</label>
            <input id="state" required value={form.state} onChange={set('state')} className={inputCls} />
          </div>
          <div>
            <label className={labelCls} htmlFor="pincode">Pincode *</label>
            <input id="pincode" required value={form.pincode} onChange={set('pincode')} className={inputCls} />
          </div>
          <fieldset className="sm:col-span-2">
            <legend className={labelCls}>Payment method *</legend>
            <div className="flex gap-4">
              {['COD', 'Online'].map((type) => (
                <label
                  key={type}
                  className={`flex flex-1 cursor-pointer items-center justify-center rounded-lg border px-4 py-3 text-sm font-medium ${
                    form.paymentType === type ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-300 text-slate-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentType"
                    value={type}
                    checked={form.paymentType === type}
                    onChange={set('paymentType')}
                    className="sr-only"
                  />
                  {type === 'COD' ? 'Cash on Delivery' : 'Online Payment'}
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        <button
          type="submit"
          disabled={busy}
          className="mt-6 w-full rounded-lg bg-emerald-600 py-3 font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {busy ? 'Placing order…' : `Place order · ${inr(checkout.data?.totalOrderPrice)}`}
        </button>
      </form>

      <aside className="h-fit rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-24">
        <h2 className="mb-4 text-lg font-bold text-slate-800">Your order</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-500">Items total</dt>
            <dd>{inr(checkout.data?.orderPrice)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Fees &amp; delivery</dt>
            <dd>{inr(checkout.data?.fees)}</dd>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-3 text-base">
            <dt className="font-semibold">Total payable</dt>
            <dd className="font-extrabold">{inr(checkout.data?.totalOrderPrice)}</dd>
          </div>
        </dl>
      </aside>
    </div>
  );
}
