import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { Banknote, CreditCard, ShoppingBag } from 'lucide-react';
import { fetchCart, fetchCheckout, fetchProfile, placeOrder } from '../api/userArea';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { inr } from '../utils/format';
import Button, { ButtonLink } from '../components/ui/Button';
import Card from '../components/ui/Card';
import Field from '../components/ui/Field';
import { Input } from '../components/ui/Input';
import EmptyState from '../components/ui/EmptyState';
import { cx } from '../utils/cx';

const PAYMENT_METHODS = [
  { value: 'COD', label: 'Cash on Delivery', icon: Banknote, copy: 'Pay when it arrives' },
  { value: 'Online', label: 'Online Payment', icon: CreditCard, copy: 'Card, UPI or netbanking' },
];

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
      <EmptyState
        icon={<ShoppingBag className="h-7 w-7" />}
        title="Nothing to checkout"
        description="Your cart is empty, so there's nothing to place an order for."
        action={
          <ButtonLink to="/products" variant="gradient" size="lg">
            Browse products
          </ButtonLink>
        }
      />
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
    <div className="space-y-7">
      <header>
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sakura-300">Final step</p>
        <h1 className="mt-1.5 font-display text-3xl font-extrabold text-mist-50 sm:text-4xl">Checkout</h1>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card as="form" onSubmit={submit} className="p-6 lg:col-span-2 sm:p-8">
          <h2 className="font-display text-xl font-bold text-mist-50">Delivery details</h2>
          <p className="mt-1 text-sm text-mist-400">Pre-filled from your profile — tweak anything before you order.</p>

          <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="First name" htmlFor="firstName" required>
              <Input id="firstName" required value={form.firstName} onChange={set('firstName')} />
            </Field>
            <Field label="Last name" htmlFor="lastName">
              <Input id="lastName" value={form.lastName} onChange={set('lastName')} />
            </Field>
            <Field label="Email" htmlFor="email" required>
              <Input id="email" type="email" required value={form.email} onChange={set('email')} />
            </Field>
            <Field label="Mobile no." htmlFor="mobileNo" required>
              <Input id="mobileNo" required value={form.mobileNo} onChange={set('mobileNo')} />
            </Field>
            <Field label="Address" htmlFor="address" required className="sm:col-span-2">
              <Input id="address" required value={form.address} onChange={set('address')} />
            </Field>
            <Field label="City" htmlFor="city" required>
              <Input id="city" required value={form.city} onChange={set('city')} />
            </Field>
            <Field label="State" htmlFor="state" required>
              <Input id="state" required value={form.state} onChange={set('state')} />
            </Field>
            <Field label="Pincode" htmlFor="pincode" required>
              <Input id="pincode" required value={form.pincode} onChange={set('pincode')} />
            </Field>

            <fieldset className="sm:col-span-2">
              <legend className="mb-2 text-xs font-semibold tracking-wide text-mist-300">
                Payment method <span className="text-sakura-400">*</span>
              </legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {PAYMENT_METHODS.map((m) => {
                  const active = form.paymentType === m.value;
                  return (
                    <label
                      key={m.value}
                      className={cx(
                        'flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-all duration-200',
                        active
                          ? 'border-sakura-400/70 bg-sakura-500/10 shadow-[var(--shadow-focus-ring)]'
                          : 'border-ink-600/80 bg-ink-900/50 hover:border-ink-600 hover:bg-ink-800',
                      )}
                    >
                      <input
                        type="radio"
                        name="paymentType"
                        value={m.value}
                        checked={active}
                        onChange={set('paymentType')}
                        className="sr-only"
                      />
                      <span
                        className={cx(
                          'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition',
                          active
                            ? 'border-sakura-400/50 bg-sakura-500/15 text-sakura-300'
                            : 'border-ink-600 text-mist-400',
                        )}
                      >
                        <m.icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                        <span className={cx('block text-sm font-semibold', active ? 'text-mist-50' : 'text-mist-200')}>
                          {m.label}
                        </span>
                        <span className="block text-xs text-mist-500">{m.copy}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          </div>

          <Button type="submit" variant="gradient" size="lg" full loading={busy} className="mt-8">
            {busy ? 'Placing order…' : `Place order · ${inr(checkout.data?.totalOrderPrice)}`}
          </Button>

          <p className="mt-4 text-center text-xs text-mist-500">
            Prefer to keep browsing?{' '}
            <Link to="/cart" className="font-semibold text-sakura-300 transition hover:text-sakura-200">
              Back to cart
            </Link>
          </p>
        </Card>

        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <Card className="p-6">
            <h2 className="mb-5 text-lg font-bold text-mist-50">Your order</h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-mist-400">Items total</dt>
                <dd className="font-semibold text-mist-100">{inr(checkout.data?.orderPrice)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-mist-400">Fees &amp; delivery</dt>
                <dd className="font-semibold text-mist-100">{inr(checkout.data?.fees)}</dd>
              </div>
              <div className="divider-glow" />
              <div className="flex items-baseline justify-between">
                <dt className="font-bold text-mist-100">Total payable</dt>
                <dd className="font-display text-2xl font-extrabold text-gradient">
                  {inr(checkout.data?.totalOrderPrice)}
                </dd>
              </div>
            </dl>
          </Card>
        </aside>
      </div>
    </div>
  );
}
