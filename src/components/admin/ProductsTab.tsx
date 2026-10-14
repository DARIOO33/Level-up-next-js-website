'use client';
import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { BellRing, Copy, ImageUp, Pencil, Plus, Trash2, X, Zap } from 'lucide-react';
import { Field, Modal, Spinner } from '@/components/ui';
import { createProduct, deleteProduct, getWatchersSummary, updateProduct, type ProductInput, type WatcherSummary } from '@/server/actions/admin';
import { ACCESSORY_SUBS } from '@/lib/constants';
import { defaultSpecNameFr } from '@/lib/product-copy';
import type { Product } from '@/lib/types';
import { cn, formatPrice, img, minPrice, totalStock } from '@/lib/utils';
import { Confirm, IconAction, PAGE_SIZE, Pager, Select, Table, Td, Toolbar, usePage } from './shared';

type Mode = 'create' | 'edit' | 'duplicate';
type VariantForm = { id?: string; title: string; price: string; stock: string; image: string };
type SpecForm = { key: string; value: string; nameFr: string; valueFr: string };
type Form = {
  name: string;
  slug: string;
  description: string;
  descriptionFr: string;
  category: 'iems' | 'accessories';
  subCategory: string;
  featured: boolean;
  images: string[];
  variants: VariantForm[];
  specifications: SpecForm[];
};

const emptyVariant = (): VariantForm => ({ title: '', price: '', stock: '', image: '' });
const emptyForm = (): Form => ({ name: '', slug: '', description: '', descriptionFr: '', category: 'iems', subCategory: '', featured: false, images: [''], variants: [emptyVariant()], specifications: [] });

const toForm = (product: Product, mode: Mode): Form => ({
  name: mode === 'duplicate' ? `${product.name} (copy)` : product.name,
  slug: mode === 'duplicate' ? '' : product.slug ?? '',
  description: product.description,
  descriptionFr: product.descriptionFr,
  category: product.category === 'accessories' ? 'accessories' : 'iems',
  subCategory: product.subCategory ?? '',
  featured: product.featured,
  images: product.images.length ? [...product.images] : [''],
  // A duplicate gets fresh variant ids; an edit keeps them so carts and orders stay linked.
  variants: product.variants.map((v) => ({ id: mode === 'edit' ? v.id : undefined, title: v.title, price: String(v.price), stock: String(v.stock), image: v.image })),
  specifications: Object.entries(product.specifications).map(([key, value]) => ({
    key,
    value,
    nameFr: product.specificationsFr[key]?.name ?? '',
    valueFr: product.specificationsFr[key]?.value ?? '',
  })),
});

export function ProductsTab({ products, brands }: { products: Product[]; brands: string[] }) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<'all' | 'iems' | 'accessories'>('all');
  const [stock, setStock] = useState<'all' | 'ok' | 'low' | 'out'>('all');
  const [modal, setModal] = useState<{ mode: Mode; product: Product | null } | null>(null);
  const [toDelete, setToDelete] = useState<Product | null>(null);
  const [pending, start] = useTransition();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (category !== 'all' && p.category !== category) return false;
      const s = totalStock(p);
      if (stock === 'out' && s > 0) return false;
      if (stock === 'low' && (s === 0 || s > 5)) return false;
      if (stock === 'ok' && s <= 5) return false;
      if (!q) return true;
      return p.name.toLowerCase().includes(q) || (p.subCategory ?? '').toLowerCase().includes(q);
    });
  }, [products, search, category, stock]);
  const [page, setPage] = usePage(`${search}|${category}|${stock}`);
  const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const confirmDelete = () => {
    if (!toDelete) return;
    start(async () => {
      const result = await deleteProduct(toDelete.slug || toDelete.id);
      if (!result.ok) return void toast.error(result.message);
      toast.success('Product deleted');
      setToDelete(null);
      router.refresh();
    });
  };

  return (
    <>
      <Toolbar search={search} onSearch={setSearch} placeholder="Search products…">
        <Select label="Category" value={category} onChange={setCategory} options={[{ value: 'all', label: 'All categories' }, { value: 'iems', label: 'IEMs' }, { value: 'accessories', label: 'Accessories' }]} />
        <Select label="Stock" value={stock} onChange={setStock} options={[{ value: 'all', label: 'All stock' }, { value: 'ok', label: 'In stock' }, { value: 'low', label: 'Low stock (≤5)' }, { value: 'out', label: 'Out of stock' }]} />
        <button onClick={() => setModal({ mode: 'create', product: null })} className="btn btn-primary shrink-0"><Plus size={16} /> Add product</button>
      </Toolbar>

      <Table head={['Product', 'Category', 'Variants', 'From', 'Stock', '']} empty={rows.length === 0}>
        {rows.map((p) => {
          const s = totalStock(p);
          return (
            <tr key={p.id} className="transition hover:bg-raised/50">
              <Td>
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img(p.images[0], 100)} alt="" className="stage size-11 shrink-0 rounded-xl object-cover" />
                  <div className="min-w-0">
                    <p className="flex max-w-64 items-center gap-2 truncate font-medium">{p.name}{p.featured && <Zap size={12} className="shrink-0 text-brand-500" aria-label="Featured" />}</p>
                    <p className="max-w-64 truncate font-mono text-[11px] text-faint">{p.slug ? `/${p.slug}` : 'no slug'}</p>
                  </div>
                </div>
              </Td>
              <Td className="text-xs text-soft">{p.category}{p.subCategory ? ` · ${p.subCategory}` : ''}</Td>
              <Td className="font-mono text-xs">{p.variants.length}</Td>
              <Td className="price whitespace-nowrap">{formatPrice(minPrice(p))} TND</Td>
              <Td><span className={cn('font-mono text-xs', s === 0 ? 'text-red-500' : s <= 5 ? 'text-amber-500' : 'text-signal')}>{s === 0 ? 'out' : s}</span></Td>
              <Td>
                <div className="flex justify-end">
                  <IconAction label={`Edit ${p.name}`} onClick={() => setModal({ mode: 'edit', product: p })}><Pencil size={15} /></IconAction>
                  <IconAction label={`Duplicate ${p.name}`} onClick={() => setModal({ mode: 'duplicate', product: p })}><Copy size={15} /></IconAction>
                  <IconAction label={`Delete ${p.name}`} danger onClick={() => setToDelete(p)}><Trash2 size={15} /></IconAction>
                </div>
              </Td>
            </tr>
          );
        })}
      </Table>
      <Pager page={page} total={filtered.length} onPage={setPage} />

      {modal && <ProductModal mode={modal.mode} product={modal.product} brands={brands} onClose={() => setModal(null)} />}
      <Confirm open={Boolean(toDelete)} danger title="Delete product" body={`"${toDelete?.name}" will be removed from the shop. Past orders keep their copy of the name and image.`} confirmLabel={pending ? 'Deleting…' : 'Delete'} busy={pending} onConfirm={confirmDelete} onClose={() => setToDelete(null)} />
    </>
  );
}

function ProductModal({ mode, product, brands, onClose }: { mode: Mode; product: Product | null; brands: string[]; onClose: () => void }) {
  const router = useRouter();
  const [form, setForm] = useState<Form>(() => (product ? toForm(product, mode) : emptyForm()));
  const [spec, setSpec] = useState({ key: '', value: '' });
  const [uploading, setUploading] = useState<string | null>(null);
  const [watchers, setWatchers] = useState<WatcherSummary | null>(null);
  const [askNotify, setAskNotify] = useState(false);
  const [pending, start] = useTransition();
  const fileInput = useRef<HTMLInputElement>(null);
  const uploadTarget = useRef<{ kind: 'image' | 'variant'; index: number } | null>(null);
  const isEdit = mode === 'edit' && product;

  // People waiting on out-of-stock variants — only relevant when editing.
  useEffect(() => {
    if (!isEdit) return;
    getWatchersSummary(product.slug || product.id).then((r) => r.ok && r.data.totalWatchers > 0 && setWatchers(r.data));
  }, [isEdit, product]);

  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value }));
  const setVariant = (index: number, patch: Partial<VariantForm>) => set('variants', form.variants.map((v, i) => (i === index ? { ...v, ...patch } : v)));
  const setSpecFr = (key: string, patch: Partial<SpecForm>) => set('specifications', form.specifications.map((s) => (s.key === key ? { ...s, ...patch } : s)));
  const setImage = (index: number, value: string) => set('images', form.images.map((x, i) => (i === index ? value : x)));

  const pickFile = (kind: 'image' | 'variant', index: number) => {
    uploadTarget.current = { kind, index };
    fileInput.current?.click();
  };

  const upload = async (file: File) => {
    const target = uploadTarget.current;
    if (!target) return;
    const key = `${target.kind}-${target.index}`;
    setUploading(key);
    try {
      const body = new FormData();
      body.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Upload failed');
      if (target.kind === 'image') setImage(target.index, data.url);
      else setVariant(target.index, { image: data.url });
      toast.success('Image uploaded');
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setUploading(null);
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  const addSpec = () => {
    const key = spec.key.trim();
    if (!key) return;
    const existing = form.specifications.find((s) => s.key === key);
    set('specifications', [...form.specifications.filter((s) => s.key !== key), { key, value: spec.value.trim(), nameFr: existing?.nameFr ?? '', valueFr: existing?.valueFr ?? '' }]);
    setSpec({ key: '', value: '' });
  };

  const build = (): ProductInput | string => {
    const images = form.images.map((x) => x.trim()).filter(Boolean);
    if (!form.name.trim()) return 'Product name is required';
    if (!images.length) return 'At least one image is required';
    if (!form.variants.length) return 'At least one variant is required';
    const variants = [];
    for (const v of form.variants) {
      const price = Number(v.price);
      const stock = Number(v.stock);
      if (!v.title.trim() || v.price === '' || v.stock === '') return 'Each variant needs a title, price and stock';
      if (!Number.isFinite(price) || !Number.isFinite(stock) || price < 0 || stock < 0) return 'Price and stock cannot be negative';
      // A variant without its own picture falls back to the first product image.
      variants.push({ id: v.id, title: v.title.trim(), price, stock: Math.floor(stock), image: v.image.trim() || images[0] });
    }
    return {
      name: form.name.trim(),
      slug: form.slug.trim() || undefined,
      description: form.description.trim(),
      descriptionFr: form.descriptionFr.trim(),
      category: form.category,
      subCategory: form.subCategory.trim() || undefined,
      featured: form.featured,
      images,
      variants,
      specifications: Object.fromEntries(form.specifications.map((s) => [s.key, s.value])),
      specificationsFr: Object.fromEntries(form.specifications.map((s) => [s.key, { name: s.nameFr.trim(), value: s.valueFr.trim() }])),
    };
  };

  const save = (notifyWatchers = false) => {
    const input = build();
    if (typeof input === 'string') return void toast.error(input);
    start(async () => {
      const result = isEdit ? await updateProduct(product.slug || product.id, input, notifyWatchers) : await createProduct(input);
      if (!result.ok) return void toast.error(result.message);
      toast.success(isEdit ? (notifyWatchers ? 'Product updated — watchers notified' : 'Product updated') : 'Product created');
      router.refresh();
      onClose();
    });
  };

  const submit = () => {
    // If a watched variant is coming back in stock, ask whether to email the people waiting.
    const restocking = isEdit && watchers?.outOfStockVariantIds.some((id) => Number(form.variants.find((v) => v.id === id)?.stock ?? 0) > 0);
    if (restocking) setAskNotify(true);
    else save(false);
  };

  const subOptions = form.category === 'iems' ? brands : [...ACCESSORY_SUBS];

  return (
    <Modal open onClose={onClose} size="lg" title={{ create: 'Add product', edit: 'Edit product', duplicate: 'Duplicate product' }[mode]}>
      <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
      <form className="grid gap-6 p-6" onSubmit={(e) => { e.preventDefault(); submit(); }}>
        {watchers && (
          <p className="flex items-start gap-3 rounded-2xl bg-brand-500/10 p-4 text-sm">
            <BellRing size={17} className="mt-0.5 shrink-0 text-brand-500" />
            <span>
              {watchers.totalWatchers} customer{watchers.totalWatchers === 1 ? ' is' : 's are'} waiting for a restock of this product.
            </span>
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name"><input className="input" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. KZ ZSN Pro X" /></Field>
          <Field label="URL slug (optional)" hint="Used in the product link. Leave empty to keep using the product id."><input className="input font-mono" value={form.slug} onChange={(e) => set('slug', e.target.value)} placeholder="kz-zsn-pro-x" /></Field>
          <Field label="Category">
            <select className="input" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as Form['category'], subCategory: '' }))}>
              <option value="iems">IEMs</option>
              <option value="accessories">Accessories</option>
            </select>
          </Field>
          <Field label={form.category === 'iems' ? 'Brand' : 'Type'}>
            <input className="input" list="sub-options" value={form.subCategory} onChange={(e) => set('subCategory', e.target.value)} placeholder={form.category === 'iems' ? 'KZ' : 'cables'} />
            <datalist id="sub-options">{subOptions.map((o) => <option key={o} value={o} />)}</datalist>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Description (English)"><textarea className="input" rows={5} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Sound signature, who it is for, what is in the box…" /></Field>
          <Field label="Description (French)" hint="Shown on the /fr page and to Google France. Empty = the English text is shown.">
            <textarea className="input" rows={5} lang="fr" value={form.descriptionFr} onChange={(e) => set('descriptionFr', e.target.value)} placeholder="Signature sonore, pour qui, contenu de la boîte…" />
          </Field>
        </div>

        <label className="flex w-fit items-center gap-3 text-sm">
          <input type="checkbox" checked={form.featured} onChange={(e) => set('featured', e.target.checked)} className="size-4 accent-brand-500" />
          Featured on the home page
        </label>

        <fieldset>
          <legend className="label">Images</legend>
          <div className="grid gap-2">
            {form.images.map((src, i) => (
              <div key={i} className="flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {src ? <img src={img(src, 100)} alt="" className="stage size-11 shrink-0 rounded-xl object-cover" /> : <span className="stage size-11 shrink-0 rounded-xl border border-dashed border-line" />}
                <input className="input h-11" value={src} onChange={(e) => setImage(i, e.target.value)} placeholder="https://…/image.jpg or upload →" aria-label={`Image ${i + 1} URL`} />
                <button type="button" onClick={() => pickFile('image', i)} disabled={uploading !== null} className="icon-btn border border-line" aria-label={`Upload image ${i + 1}`}>{uploading === `image-${i}` ? <Spinner /> : <ImageUp size={16} />}</button>
                <button type="button" onClick={() => set('images', form.images.filter((_, x) => x !== i))} disabled={form.images.length === 1} className="icon-btn disabled:opacity-30" aria-label={`Remove image ${i + 1}`}><X size={15} /></button>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => set('images', [...form.images, ''])} className="btn btn-ghost btn-sm mt-2"><Plus size={14} /> Add image</button>
        </fieldset>

        <fieldset>
          <legend className="label">Variants</legend>
          <div className="grid gap-3">
            {form.variants.map((v, i) => (
              <div key={i} className="rounded-2xl border border-line p-3">
                <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_7rem_6rem_auto]">
                  <input className="input h-11" value={v.title} onChange={(e) => setVariant(i, { title: e.target.value })} placeholder="e.g. Black, no mic" aria-label={`Variant ${i + 1} title`} />
                  <input className="input h-11 font-mono" type="number" min="0" step="0.001" value={v.price} onChange={(e) => setVariant(i, { price: e.target.value })} placeholder="Price" aria-label={`Variant ${i + 1} price (TND)`} />
                  <input className="input h-11 font-mono" type="number" min="0" step="1" value={v.stock} onChange={(e) => setVariant(i, { stock: e.target.value })} placeholder="Stock" aria-label={`Variant ${i + 1} stock`} />
                  <button type="button" onClick={() => set('variants', form.variants.filter((_, x) => x !== i))} disabled={form.variants.length === 1} className="icon-btn justify-self-end hover:text-red-500 disabled:opacity-30" aria-label={`Remove variant ${i + 1}`}><Trash2 size={15} /></button>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {v.image ? <img src={img(v.image, 100)} alt="" className="stage size-11 shrink-0 rounded-xl object-cover" /> : <span className="stage size-11 shrink-0 rounded-xl border border-dashed border-line" />}
                  <input className="input h-11" value={v.image} onChange={(e) => setVariant(i, { image: e.target.value })} placeholder="Variant image URL (optional — defaults to the first image)" aria-label={`Variant ${i + 1} image URL`} />
                  <button type="button" onClick={() => pickFile('variant', i)} disabled={uploading !== null} className="icon-btn border border-line" aria-label={`Upload image for variant ${i + 1}`}>{uploading === `variant-${i}` ? <Spinner /> : <ImageUp size={16} />}</button>
                </div>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => set('variants', [...form.variants, emptyVariant()])} className="btn btn-ghost btn-sm mt-2"><Plus size={14} /> Add variant</button>
        </fieldset>

        <fieldset>
          <legend className="label">Specifications (optional)</legend>
          {form.specifications.length > 0 && (
            <ul className="mb-2 divide-y divide-line overflow-hidden rounded-2xl border border-line">
              {form.specifications.map(({ key, value, nameFr, valueFr }) => (
                <li key={key} className="grid gap-2 px-4 py-3 text-sm">
                  <div className="flex items-center gap-3">
                    <span className="w-32 shrink-0 font-mono text-[11px] uppercase tracking-wider text-faint">{key}</span>
                    <span className="min-w-0 flex-1 truncate">{value}</span>
                    <button type="button" onClick={() => set('specifications', form.specifications.filter((s) => s.key !== key))} className="icon-btn size-8" aria-label={`Remove ${key}`}><X size={14} /></button>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-[8rem_minmax(0,1fr)]">
                    <input className="input h-9 rounded-xl px-3 text-xs" lang="fr" value={nameFr} onChange={(e) => setSpecFr(key, { nameFr: e.target.value })} placeholder={defaultSpecNameFr(key) || key} aria-label={`${key} — French name`} />
                    <input className="input h-9 rounded-xl px-3 text-xs" lang="fr" value={valueFr} onChange={(e) => setSpecFr(key, { valueFr: e.target.value })} placeholder={`FR: ${value}`} aria-label={`${key} — French value`} />
                  </div>
                </li>
              ))}
            </ul>
          )}
          {form.specifications.length > 0 && <p className="mb-3 text-xs text-faint">Second line of each spec = French version. Leave a box empty to reuse the greyed-out text (common names like Driver or Impedance are already translated).</p>}
          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_1.4fr_auto]">
            <input className="input h-11" value={spec.key} onChange={(e) => setSpec((s) => ({ ...s, key: e.target.value }))} placeholder="Key (e.g. Driver)" aria-label="Specification name" />
            <input className="input h-11" value={spec.value} onChange={(e) => setSpec((s) => ({ ...s, value: e.target.value }))} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSpec(); } }} placeholder="Value" aria-label="Specification value" />
            <button type="button" onClick={addSpec} className="btn btn-outline h-11">Add</button>
          </div>
        </fieldset>

        <div className="sticky bottom-0 -mx-6 -mb-6 flex justify-end gap-2 border-t border-line bg-surface px-6 py-4">
          <button type="button" onClick={onClose} className="btn btn-ghost">Cancel</button>
          <button type="submit" disabled={pending || uploading !== null} className="btn btn-primary">{pending ? <><Spinner /> Saving…</> : isEdit ? 'Save changes' : 'Create product'}</button>
        </div>
      </form>

      <Confirm open={askNotify} title="Notify waiting customers?" body="Stock is coming back for a product customers asked to be notified about. Send them the back-in-stock email now?" confirmLabel="Save & notify" cancelLabel="Save without notifying" busy={pending} onConfirm={() => { setAskNotify(false); save(true); }} onCancel={() => { setAskNotify(false); save(false); }} onClose={() => setAskNotify(false)} />
    </Modal>
  );
}
