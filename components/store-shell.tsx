'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { ArrowRight, ArrowUpRight, Minus, Plus, ShoppingBag, X } from 'lucide-react';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { euro, products } from '@/lib/products';
import { addLine, changeQuantity, limit, lineKey, restoreCart, subtotal, type Line, type Selection } from '@/lib/store';
import { Hero } from './hero';

const CartContext = createContext<(selection: Selection) => void>(() => {});
const storageKey = 'stride.archive.cart.v1';

export function useAddToCart() {
  return useContext(CartContext);
}

export function HomeLink({ children, className, label }: {
  children: React.ReactNode;
  className: string;
  label?: string;
}) {
  return <Link className={className} href="/" scroll={false} aria-label={label} onNavigate={() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }}>{children}</Link>;
}

export function Brand() {
  return <HomeLink className="brand" label="PROJECT 1 home">
    <Image src="/project-1.svg" width={38} height={38} alt="" />
    <span>PROJECT 1</span>
  </HomeLink>;
}

export function StoreShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const home = pathname === '/';
  const [heroPrepared, prepareHero] = useState(home);
  const [lines, setLines] = useState<Line[]>([]);
  const [checkout, setCheckout] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const sync = () => {
      try { setLines(restoreCart(localStorage.getItem(storageKey), products)); }
      catch { /* Shopping remains available in memory. */ }
    };
    sync();
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  useEffect(() => {
    if (heroPrepared || (!home && !pathname.startsWith('/collection'))) return;
    if (typeof window.requestIdleCallback === 'function') {
      const task = window.requestIdleCallback(() => prepareHero(true), { timeout: 500 });
      return () => window.cancelIdleCallback(task);
    }
    const task = window.setTimeout(() => prepareHero(true), 250);
    return () => window.clearTimeout(task);
  }, [heroPrepared, home, pathname]);

  function mutate(change: (current: Line[]) => Line[]) {
    setLines(change);
    try {
      const current = restoreCart(localStorage.getItem(storageKey), products);
      localStorage.setItem(storageKey, JSON.stringify({ version: 1, lines: change(current) }));
    } catch { /* Shopping remains available in memory. */ }
  }

  function openBag() {
    if (dialog.current?.open) return;
    returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setCheckout(false);
    dialog.current?.showModal();
  }

  function add(selection: Selection) {
    mutate(current => addLine(current, selection));
    openBag();
  }

  const count = lines.reduce((sum, line) => sum + line.quantity, 0);

  return <CartContext.Provider value={add}>
    <a className="skip" href="#main">Skip to content</a>
    <header className="site-header">
      <div className="header-inner">
        <Brand />
        <nav className="header-nav" aria-label="Main navigation">
          <Link href="/collection/" aria-current={pathname.startsWith('/collection') ? 'page' : undefined}>Collection</Link>
          <Link href="/#featured">Featured</Link>
          <Link href="/#story">Our Story</Link>
        </nav>
        <button className="bag-trigger" onClick={openBag} aria-haspopup="dialog" aria-controls="shopping-bag">
          <ShoppingBag size={16} aria-hidden="true" /> <span>Bag ({count})</span>
        </button>
      </div>
    </header>
    <main id={home ? 'main' : undefined} hidden={!home}>
      <Hero active={home} prepare={home || heroPrepared} />
      {home ? children : null}
    </main>
    {home ? null : children}
    <footer className="footer" id="footer">
      <div className="footer-main">
        <Brand />
        <nav className="footer-nav" aria-label="Footer navigation">
          <Link href="/collection/" aria-current={pathname.startsWith('/collection') ? 'page' : undefined}>Collection</Link>
          <Link href="/#study">3D Studio</Link>
          <Link href="/credits/">Asset credits <ArrowUpRight size={13} /></Link>
        </nav>
      </div>
      <div className="footer-end"><span>Design & development by ORILLON</span><span>Portfolio store · Demo checkout</span></div>
    </footer>
    <dialog id="shopping-bag" className="bag-panel" ref={dialog} aria-labelledby="bag-title"
      onClose={() => returnFocus.current?.focus()}
      onClick={event => { if (event.target === event.currentTarget) dialog.current?.close(); }}>
      <div className="bag-content">
        <div className="bag-header"><h2 id="bag-title">Your bag <span>({count})</span></h2>
          <button className="icon-button" type="button" onClick={() => dialog.current?.close()} aria-label="Close bag" autoFocus><X /></button>
        </div>
        {lines.length ? <>
          <ul className="bag-lines">
            {lines.map(line => {
              const product = products.find(item => item.id === line.productId)!;
              const variant = product.variants.find(item => item.id === line.variantId)!;
              return <li className="bag-line" key={lineKey(line)}>
                <div className="bag-image"><Image src={variant.image} alt="" width={112} height={84} /></div>
                <div><p className="micro">{product.brand} · EU {line.size}</p><h3>{product.name}</h3><p>{variant.name}</p>
                  <div className="quantity">
                    <button onClick={() => { setCheckout(false); mutate(current => changeQuantity(current, line, -1)); }} aria-label={line.quantity === 1 ? 'Remove ' + product.name : 'Decrease quantity of ' + product.name}><Minus size={14} /></button>
                    <output aria-label="Quantity">{line.quantity}</output>
                    <button disabled={line.quantity >= limit} onClick={() => { setCheckout(false); mutate(current => changeQuantity(current, line, 1)); }} aria-label={'Increase quantity of ' + product.name}><Plus size={14} /></button>
                  </div>
                </div>
                <strong>{euro.format(product.price * line.quantity)}</strong>
              </li>;
            })}
          </ul>
          <div className="bag-summary">
            <p><strong>Subtotal</strong><strong>{euro.format(subtotal(lines, products))}</strong></p>
            <button className="button fill" onClick={() => setCheckout(true)}>Demo checkout <ArrowRight size={18} /></button>
            <p role="status" className="bag-status">{checkout ? 'Demo complete. Your bag is saved in this browser.' : 'Portfolio demo · Payments are disabled'}</p>
          </div>
        </> : <div className="bag-empty">
          <ShoppingBag size={30} strokeWidth={1} /><p>Your bag is empty.</p>
          <Link className="button" href="/collection/" onClick={() => dialog.current?.close()}>Explore collection <ArrowRight size={18} /></Link>
        </div>}
      </div>
    </dialog>
  </CartContext.Provider>;
}



