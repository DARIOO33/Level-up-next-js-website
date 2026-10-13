'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import {
  ArrowUpRight, ChevronDown, GitCompareArrows, Heart, Languages, LayoutDashboard, ListOrdered,
  LogOut, Menu, Moon, PackageSearch, Search, ShoppingBag, Sun, User,
} from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { ACCESSORY_SUBS, BRAND_GUIDES, BRAND_NOTES } from '@/lib/constants';
import { useLocale, useSwitchLocale, useT } from '@/i18n/client';
import type { SessionUser } from '@/lib/types';
import { cn } from '@/lib/utils';
import { cartCount, useCartStore, useCompareStore, useHydrated } from '@/store';
import { useApp } from '../app-context';
import { Modal } from '../ui';
import { CartDrawer } from './CartDrawer';
import { Logo } from './Logo';
import { SearchDialog } from './SearchDialog';

function Avatar({ user, size = 32 }: { user: SessionUser; size?: number }) {
  if (user.avatar) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={user.avatar} alt="" width={size} height={size} referrerPolicy="no-referrer" className="rounded-full object-cover" style={{ width: size, height: size }} />;
  }
  return (
    <span className="flex items-center justify-center rounded-full bg-brand-500 font-semibold text-white" style={{ width: size, height: size, fontSize: size * 0.4 }}>
      {user.name?.[0]?.toUpperCase() ?? 'U'}
    </span>
  );
}

export function Navbar() {
  const t = useT();
  const locale = useLocale();
  const switchLocale = useSwitchLocale();
  const pathname = usePathname();
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const { user, settings } = useApp();
  const hydrated = useHydrated();
  const items = useCartStore((s) => s.items);
  const openDrawer = useCartStore((s) => s.openDrawer);
  const compareCount = useCompareStore((s) => s.ids.length);

  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menu, setMenu] = useState<'shop' | 'account' | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isAdmin = user?.role === 'admin' || user?.role === 'owner';
  const count = hydrated ? cartCount(items) : 0;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') setMenu(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Close menus on navigation.
  useEffect(() => {
    setMenu(null);
    setMobileOpen(false);
  }, [pathname]);

  const hoverOpen = (which: 'shop' | 'account') => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setMenu(which);
  };
  const hoverClose = () => {
    closeTimer.current = setTimeout(() => setMenu(null), 140);
  };

  const logout = async () => {
    await authClient.signOut();
    setMenu(null);
    toast.success(locale === 'fr' ? 'Déconnecté' : 'Logged out');
    router.push('/');
    router.refresh();
  };

  const links = [
    { href: '/', label: t.nav.home },
    { href: '/shop', label: t.nav.shop, mega: true },
    { href: '/reviews', label: t.ui.nav.reviews },
    { href: '/about', label: t.nav.about },
    { href: '/contact', label: t.nav.contact },
  ];
  const brands = settings.brands.slice(0, 8);
  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  return (
    <>
      {/* Announcement strip */}
      <div className="border-b border-line bg-brand-500/[0.07]">
        <div className="shell flex h-9 items-center justify-center gap-3 font-mono text-[11px] uppercase tracking-[0.16em] text-soft">
          <span className="size-1.5 animate-pulse rounded-full bg-signal" />
          {t.nav.shipping}
        </div>
      </div>

      <header className={cn('sticky top-0 z-50 transition-all duration-300', scrolled ? 'border-b border-line bg-bg/80 backdrop-blur-xl' : 'border-b border-transparent bg-bg/0')}>
        <div className="shell flex h-[68px] items-center gap-2">
          <Logo className="mr-4" />

          <nav className="hidden items-center lg:flex" aria-label="Main">
            {links.map((link) =>
              link.mega ? (
                <div key={link.href} onMouseEnter={() => hoverOpen('shop')} onMouseLeave={hoverClose}>
                  <Link
                    href={link.href}
                    aria-expanded={menu === 'shop'}
                    className={cn('flex h-10 items-center gap-1 rounded-full px-4 text-sm font-medium transition', isActive(link.href) ? 'text-ink' : 'text-soft hover:text-ink')}
                  >
                    {link.label}
                    <ChevronDown size={14} className={cn('transition-transform', menu === 'shop' && 'rotate-180')} />
                  </Link>
                </div>
              ) : (
                <Link key={link.href} href={link.href} className={cn('flex h-10 items-center rounded-full px-4 text-sm font-medium transition', isActive(link.href) ? 'text-ink' : 'text-soft hover:text-ink')}>
                  {link.label}
                </Link>
              ),
            )}
          </nav>

          <div className="ml-auto flex items-center gap-0.5">
            <button onClick={() => setSearchOpen(true)} className="hidden h-10 items-center gap-2 rounded-full border border-line bg-surface/60 pl-3.5 pr-2 text-sm text-faint transition hover:border-line-strong hover:text-ink md:flex" aria-label={t.ui.nav.search}>
              <Search size={15} />
              <span className="pr-6">{t.ui.nav.search}</span>
              <kbd className="rounded-md border border-line px-1.5 py-0.5 font-mono text-[10px]">⌘K</kbd>
            </button>
            <button onClick={() => setSearchOpen(true)} className="icon-btn md:hidden" aria-label={t.ui.nav.search}><Search size={18} /></button>

            <button onClick={switchLocale} className="icon-btn hidden sm:inline-flex" aria-label={t.ui.nav.language} title={t.ui.nav.language}>
              <span className="font-mono text-[11px] font-semibold uppercase">{locale}</span>
            </button>
            <button onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')} className="icon-btn hidden sm:inline-flex" aria-label={t.ui.nav.theme}>
              <Sun size={17} className="hidden dark:block" />
              <Moon size={17} className="dark:hidden" />
            </button>

            {hydrated && compareCount > 0 && (
              <Link href="/compare" className="icon-btn" aria-label={t.ui.nav.compare}>
                <GitCompareArrows size={18} />
                <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-surface font-mono text-[9px] font-bold text-ink ring-1 ring-line-strong">{compareCount}</span>
              </Link>
            )}

            <button onClick={openDrawer} className="icon-btn" aria-label={`${t.nav.cart} (${count})`}>
              <ShoppingBag size={18} />
              {count > 0 && <span className="absolute right-0.5 top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand-500 px-1 font-mono text-[10px] font-bold text-white">{count}</span>}
            </button>

            {user ? (
              <div className="relative ml-1 hidden lg:block" onMouseEnter={() => hoverOpen('account')} onMouseLeave={hoverClose}>
                <button onClick={() => setMenu(menu === 'account' ? null : 'account')} aria-expanded={menu === 'account'} aria-label={t.nav.account} className="flex items-center gap-2 rounded-full border border-line py-1 pl-1 pr-3 transition hover:border-line-strong">
                  <Avatar user={user} size={30} />
                  <span className="max-w-24 truncate text-sm font-medium">{user.name.split(' ')[0]}</span>
                </button>
                {menu === 'account' && (
                  <div className="absolute right-0 top-full w-64 pt-3">
                    <div className="card animate-rise overflow-hidden p-1.5 shadow-2xl">
                      <div className="px-3.5 pb-3 pt-2.5">
                        <p className="truncate text-sm font-semibold">{user.name}</p>
                        <p className="truncate text-xs text-faint">{user.email}</p>
                        {user.role !== 'user' && <span className="tag mt-2">{user.role}</span>}
                      </div>
                      <div className="hairline" />
                      <MenuLink href="/profile" icon={User} label={t.ui.nav.profile} />
                      <MenuLink href="/orders" icon={ListOrdered} label={t.ui.nav.orders} />
                      <MenuLink href="/wishlist" icon={Heart} label={t.ui.nav.wishlist} />
                      {isAdmin && <MenuLink href="/admin" icon={LayoutDashboard} label={t.nav.admin} accent />}
                      <div className="hairline my-1" />
                      <button onClick={logout} className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm text-red-500 transition hover:bg-red-500/10">
                        <LogOut size={15} /> {t.nav.logout}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login" className="btn btn-primary btn-sm ml-2 hidden lg:inline-flex">{t.nav.login}</Link>
            )}

            <button onClick={() => setMobileOpen(true)} className="icon-btn lg:hidden" aria-label={t.ui.nav.menu}><Menu size={20} /></button>
          </div>
        </div>

        {/* Shop mega menu */}
        {menu === 'shop' && (
          <div className="absolute inset-x-0 top-full hidden lg:block" onMouseEnter={() => hoverOpen('shop')} onMouseLeave={hoverClose}>
            <div className="shell pt-2">
              <div className="card animate-rise grid grid-cols-[1.5fr_1fr_0.9fr] gap-8 p-8 shadow-2xl">
                <div>
                  <p className="eyebrow mb-4">{t.ui.nav.iems}</p>
                  <div className="grid grid-cols-2 gap-1">
                    {brands.map((brand) => (
                      <Link key={brand} href={`/shop?brand=${encodeURIComponent(brand)}`} className="group rounded-2xl px-3 py-2.5 transition hover:bg-raised">
                        <span className="block text-sm font-semibold group-hover:text-brand-500 dark:group-hover:text-brand-300">{brand}</span>
                        {BRAND_NOTES[brand] && <span className="block text-xs text-faint">{BRAND_NOTES[brand]}</span>}
                      </Link>
                    ))}
                  </div>
                  <Link href="/shop?cat=iems" className="mt-4 inline-flex items-center gap-1.5 px-3 text-sm font-semibold text-brand-600 hover:underline dark:text-brand-300">
                    {t.ui.nav.all_iems} <ArrowUpRight size={14} />
                  </Link>
                </div>
                <div>
                  <p className="eyebrow mb-4">{t.ui.nav.accessories}</p>
                  <div className="grid gap-1">
                    {ACCESSORY_SUBS.filter((s) => s !== 'other').map((sub) => (
                      <Link key={sub} href={`/shop?cat=accessories&sub=${sub}`} className="rounded-2xl px-3 py-2 text-sm text-soft transition hover:bg-raised hover:text-ink">
                        {t.ui.sub[sub]}
                      </Link>
                    ))}
                    <Link href="/shop?cat=accessories" className="mt-2 inline-flex items-center gap-1.5 px-3 text-sm font-semibold text-brand-600 hover:underline dark:text-brand-300">
                      {t.ui.nav.all_accessories} <ArrowUpRight size={14} />
                    </Link>
                  </div>
                </div>
                <div className="rounded-3xl bg-raised p-5">
                  <p className="eyebrow mb-4">{t.ui.nav.brand_guides}</p>
                  <div className="grid gap-1">
                    {BRAND_GUIDES.map((guide) => (
                      <Link key={guide.slug} href={`/brands/${guide.slug}`} className="flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition hover:bg-surface">
                        {guide.name} <ArrowUpRight size={14} className="text-faint" />
                      </Link>
                    ))}
                  </div>
                  <div className="hairline my-4" />
                  <Link href="/orders/track" className="flex items-center gap-2 px-3 text-sm text-soft hover:text-ink">
                    <PackageSearch size={15} /> {t.ui.nav.track}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Mobile menu */}
      <Modal open={mobileOpen} onClose={() => setMobileOpen(false)} side title={t.ui.nav.menu}>
        <div className="flex flex-col gap-6 p-6">
          {user ? (
            <div className="flex items-center gap-3 rounded-3xl bg-raised p-4">
              <Avatar user={user} size={44} />
              <div className="min-w-0">
                <p className="truncate font-semibold">{user.name}</p>
                <p className="truncate text-xs text-faint">{user.email}</p>
              </div>
            </div>
          ) : (
            <Link href="/login" className="btn btn-primary w-full">{t.nav.login}</Link>
          )}

          <nav className="grid gap-1" aria-label="Mobile">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className={cn('rounded-2xl px-4 py-3 text-lg font-semibold', isActive(link.href) ? 'bg-raised text-ink' : 'text-soft')}>{link.label}</Link>
            ))}
          </nav>

          <div>
            <p className="eyebrow mb-3">{t.ui.nav.iems}</p>
            <div className="flex flex-wrap gap-2">
              {brands.map((brand) => <Link key={brand} href={`/shop?brand=${encodeURIComponent(brand)}`} className="chip">{brand}</Link>)}
              <Link href="/shop?cat=iems" className="chip chip-active">{t.ui.nav.all_iems}</Link>
            </div>
          </div>
          <div>
            <p className="eyebrow mb-3">{t.ui.nav.accessories}</p>
            <div className="flex flex-wrap gap-2">
              {ACCESSORY_SUBS.filter((s) => s !== 'other').map((sub) => <Link key={sub} href={`/shop?cat=accessories&sub=${sub}`} className="chip">{t.ui.sub[sub]}</Link>)}
            </div>
          </div>

          {user && (
            <div className="grid gap-1">
              <MenuLink href="/profile" icon={User} label={t.ui.nav.profile} />
              <MenuLink href="/orders" icon={ListOrdered} label={t.ui.nav.orders} />
              <MenuLink href="/wishlist" icon={Heart} label={t.ui.nav.wishlist} />
              {isAdmin && <MenuLink href="/admin" icon={LayoutDashboard} label={t.nav.admin} accent />}
            </div>
          )}
          <MenuLink href="/orders/track" icon={PackageSearch} label={t.ui.nav.track} />

          <div className="flex gap-2">
            <button onClick={switchLocale} className="btn btn-outline flex-1"><Languages size={15} /> {t.ui.nav.language}</button>
            <button onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')} className="btn btn-outline" aria-label={t.ui.nav.theme}>
              <Sun size={16} className="hidden dark:block" /><Moon size={16} className="dark:hidden" />
            </button>
          </div>
          {user && <button onClick={logout} className="btn btn-danger w-full"><LogOut size={15} /> {t.nav.logout}</button>}
        </div>
      </Modal>

      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
      <CartDrawer />
    </>
  );
}

function MenuLink({ href, icon: Icon, label, accent }: { href: string; icon: typeof User; label: string; accent?: boolean }) {
  return (
    <Link href={href} className={cn('flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm transition hover:bg-raised', accent ? 'font-semibold text-brand-600 dark:text-brand-300' : 'text-soft hover:text-ink')}>
      <Icon size={15} /> {label}
    </Link>
  );
}
