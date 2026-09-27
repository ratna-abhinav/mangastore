import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, PackageX, ShieldCheck, ShoppingCart, Truck } from 'lucide-react';
import { addToCart } from '../api/userArea';
import { fetchProduct } from '../api/catalog';
import { inr } from '../utils/format';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import Badge from '../components/ui/Badge';
import Button, { ButtonLink } from '../components/ui/Button';
import Card from '../components/ui/Card';
import { LoadingBlock } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import { imageFallback } from '../utils/image';

export default function ProductDetail() {
  const { id } = useParams();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { user, refresh } = useAuth();
  const [adding, setAdding] = useState(false);
  const { data: product, isLoading, isError } = useQuery({
    queryKey: ['product', id],
    queryFn: () => fetchProduct(id!),
    retry: false,
  });

  const add = async () => {
    if (!user) {
      toast('info', 'Please sign in to add items to your cart.');
      return;
    }
    if (adding) return;
    setAdding(true);
    try {
      const res = await addToCart(product!.id);
      await refresh();
      // anyone already looking at cart/checkout must see the new item
      void queryClient.invalidateQueries({ queryKey: ['cart'] });
      void queryClient.invalidateQueries({ queryKey: ['checkout'] });
      toast('success', `Added to cart !! (cart: ${res.cartCount})`);
    } catch (err) {
      if (err && typeof err === 'object' && 'status' in err && (err as { status: number }).status === 409) {
        toast('error', 'Cannot add more !!');
      } else {
        toast('error', 'Cannot be added !!');
      }
    } finally {
      setAdding(false);
    }
  };

  if (isLoading) return <LoadingBlock label="Loading product…" />;

  if (isError || !product) {
    return (
      <EmptyState
        icon={<PackageX className="h-7 w-7" />}
        title="Product not found"
        description="This volume may have been pulled from the shelf."
        action={
          <ButtonLink to="/products" variant="gradient">
            Back to products
          </ButtonLink>
        }
      />
    );
  }

  const discounted = product.discount > 0;
  const inStock = product.stock > 0;

  return (
    <div className="space-y-6">
      <Link
        to="/products"
        className="group inline-flex items-center gap-1.5 text-sm font-medium text-mist-400 transition hover:text-sakura-300"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
        Back to all products
      </Link>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
        {/* ------------------------------------------------------- artwork */}
        <div className="relative">
          <div
            aria-hidden
            className="animate-aurora pointer-events-none absolute -inset-6 rounded-[2.5rem] bg-halo-1 blur-3xl"
          />
          <div className="edge-light relative overflow-hidden rounded-3xl border border-ink-600/60 bg-ink-900">
            <div aria-hidden className="screentone absolute inset-0 opacity-40" />
            <div className="relative flex items-center justify-center p-8 sm:p-12">
              <img
                src={product.image}
                alt={product.title}
                referrerPolicy="no-referrer"
                onError={imageFallback()}
                className="max-h-[26rem] w-auto rounded-xl object-contain drop-shadow-[var(--shadow-artwork)]"
              />
            </div>
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-scrim/80 to-transparent"
            />
          </div>
        </div>

        {/* -------------------------------------------------------- details */}
        <div className="flex flex-col gap-6">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sakura-300">{product.category}</p>
            <h1 className="mt-2.5 font-display text-3xl font-extrabold leading-tight text-mist-50 sm:text-4xl">
              {product.title}
            </h1>
          </div>

          <div className="flex flex-wrap items-baseline gap-3">
            <span className="font-display text-4xl font-extrabold text-mist-50">
              {inr(product.discountedPrice)}
            </span>
            {discounted && (
              <>
                <span className="text-lg text-mist-500 line-through">{inr(product.price)}</span>
                <Badge tone="pink">{product.discount}% off</Badge>
              </>
            )}
          </div>

          {inStock ? (
            <Badge tone="mint" dot glow>
              Available · {product.stock} in stock
            </Badge>
          ) : (
            <Badge tone="flare" dot>
              Out of stock
            </Badge>
          )}

          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => void add()}
              disabled={!inStock || adding}
              loading={adding}
              variant="gradient"
              size="lg"
              className="min-w-52"
            >
              {!adding && <ShoppingCart className="h-4 w-4" />}
              {adding ? 'Adding…' : 'Add to cart'}
            </Button>
            <ButtonLink to="/cart" variant="outline" size="lg">
              View cart
            </ButtonLink>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Card className="flex items-center gap-3 p-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-neon-cyan-500/25 bg-neon-cyan-500/10 text-neon-cyan-300">
                <Truck className="h-4 w-4" />
              </span>
              <p className="text-xs text-mist-400">
                <span className="block font-semibold text-mist-100">Tracked delivery</span>
                Status updates from shelf to doorstep
              </p>
            </Card>
            <Card className="flex items-center gap-3 p-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-mint-500/25 bg-mint-500/10 text-mint-300">
                <ShieldCheck className="h-4 w-4" />
              </span>
              <p className="text-xs text-mist-400">
                <span className="block font-semibold text-mist-100">COD or online</span>
                Pay however suits you
              </p>
            </Card>
          </div>

          <Card className="p-6">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.14em] text-mist-500">Synopsis</h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-mist-300">{product.description}</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
