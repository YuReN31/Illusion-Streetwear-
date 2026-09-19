/* Concrete Editorial: shell de loja com navegação sticky, drawer de carrinho e primitives editoriais de produto. */
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowDownRight, ArrowUpRight, ChevronRight, Heart, Menu, Minus, Plus, Search, ShoppingBag, UserRound, X } from "lucide-react";
import { formatPrice, products, type Product } from "@/lib/storeData";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";

const logoTransparent = "/logo.svg";

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [, setLocation] = useLocation();
  const { cartCount, setCartOpen } = useCart();
  const { locale, setLocale, t } = useLanguage();

  useEffect(() => {
    const onScroll = () => { const max = document.documentElement.scrollHeight - window.innerHeight; setScrolled(window.scrollY > 32); setScrollProgress(max > 0 ? (window.scrollY / max) * 100 : 0); };
    const onKey = (event: KeyboardEvent) => { if (event.key === "/" && document.activeElement?.tagName !== "INPUT") { event.preventDefault(); setSearchOpen(true); } if (event.key === "Escape") { setSearchOpen(false); setMenuOpen(false); } };
    window.addEventListener("scroll", onScroll, { passive: true }); window.addEventListener("keydown", onKey); onScroll();
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("keydown", onKey); };
  }, []);
  useEffect(() => { document.body.style.overflow = menuOpen || searchOpen ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [menuOpen, searchOpen]);

  return <>
    <div className="scroll-progress" aria-hidden="true"><span style={{ width: `${scrollProgress}%` }} /></div>
    <div className="announcement-bar"><span>{locale === "pt" ? "Nova temporada / Drop 01" : "New season / Drop 01"}</span><span className="announcement-center">{locale === "pt" ? "Entrega grátis acima de 8.000 MT" : "Free delivery over 8.000 MT"}</span><span>{locale === "pt" ? "PT · MZ" : "EN · MZ"}</span></div>
    <header className={`site-header ${scrolled ? "site-header-scrolled" : ""}`}>
      <div className="header-left"><button className="header-icon menu-trigger" aria-label={t("menu")} onClick={() => setMenuOpen(true)}><Menu size={19} strokeWidth={1.5} /><span className="header-icon-label">{t("menu")}</span></button><nav className="desktop-nav" aria-label="Primary"><Link href="/shop">{t("shop")}</Link><Link href="/story">{t("story")}</Link><Link href="/shop#collection">{t("collection")}</Link></nav></div>
      <Link href="/" className="header-logo" aria-label="Illusion Streetwear — home"><img src={logoTransparent} alt="Illusion Streetwear" /></Link>
      <div className="header-actions"><button className="header-action" aria-label={t("search")} onClick={() => setSearchOpen(true)}><Search size={18} strokeWidth={1.5} /><span>{t("search")}</span><kbd>/</kbd></button><Link href="/account" className="header-action account-action" aria-label={t("account")}><UserRound size={17} strokeWidth={1.5} /><span>{t("account")}</span></Link><button className="header-action" aria-label={`${t("bag")}, ${cartCount} items`} onClick={() => setCartOpen(true)}><ShoppingBag size={18} strokeWidth={1.5} /><span>{t("bag")}</span><b className="bag-count">{String(cartCount).padStart(2, "0")}</b></button><div className="locale-switch" aria-label={t("language")}><button className={locale === "pt" ? "active" : ""} onClick={() => setLocale("pt")}>PT</button><span>/</span><button className={locale === "en" ? "active" : ""} onClick={() => setLocale("en")}>EN</button></div></div>
    </header>
    {menuOpen && <MobileMenu close={() => setMenuOpen(false)} />}
    {searchOpen && <SearchOverlay close={() => setSearchOpen(false)} />}
  </>;
}

function SearchOverlay({ close }: { close: () => void }) {
  const [query, setQuery] = useState("");
  const { t } = useLanguage();
  const results = products.filter((product) => `${product.name} ${product.category} ${product.color}`.toLowerCase().includes(query.toLowerCase())).slice(0, 4);
  return <div className="search-overlay-backdrop" role="presentation" onClick={close}><div className="search-overlay" role="dialog" aria-modal="true" aria-label={t("search")} onClick={(event) => event.stopPropagation()}><div className="search-overlay-top"><span className="section-kicker">{t("search")}</span><button className="close-button" onClick={close} aria-label={t("close")}><X size={20} /></button></div><div className="search-input-wrap"><Search size={22} /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("searchPlaceholder")} /><kbd>ESC</kbd></div><div className="search-results">{query && results.length === 0 ? <div className="search-empty"><span>—</span>{t("nothingFound")}</div> : results.map((product) => <Link href={`/product/${product.slug}`} onClick={close} className="search-result" key={product.slug}><img src={product.image} alt="" /><div><span>{product.category}</span><strong>{product.name}</strong></div><ArrowUpRight size={16} /></Link>)}</div><div className="search-hint"><span>{localeHint(t, "explore")}</span><span>Press / anytime</span></div></div></div>;
}
function localeHint(t: (key: string) => string, key: string) { return t(key); }

function MobileMenu({ close }: { close: () => void }) {
  const { locale } = useLanguage();
  const pt = locale === "pt";
  return (
    <div className="mobile-menu-backdrop" role="presentation" onClick={close}>
      <aside className="mobile-menu" aria-label={pt ? "Menu mobile" : "Mobile menu"} onClick={(event) => event.stopPropagation()}>
        <div className="mobile-menu-top"><span>{pt ? "Navegar" : "Navigate"}</span><button className="close-button" onClick={close} aria-label={pt ? "Fechar menu" : "Close menu"}><X size={20} /></button></div>
        <nav className="mobile-menu-links">
          <Link href="/shop" onClick={close}>{pt ? "Todas as peças" : "All pieces"} <ArrowUpRight size={20} /></Link>
          <Link href="/shop" onClick={close}>{pt ? "A coleção" : "The collection"} <ArrowUpRight size={20} /></Link>
          <Link href="/story#feed" onClick={close}>{pt ? "Diário" : "Journal"} <ArrowUpRight size={20} /></Link>
          <Link href="/account" onClick={close}>{pt ? "Conta" : "Account"} <ArrowUpRight size={20} /></Link>
        </nav>
        <div className="mobile-menu-meta"><span>Maputo / MZ</span><span>SS—26</span></div>
      </aside>
    </div>
  );
}

export function CartDrawer() {
  const { cartOpen, setCartOpen, lines, subtotal, updateQuantity, removeFromCart } = useCart();
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  useEffect(() => {
    document.body.style.overflow = cartOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [cartOpen]);
  if (!cartOpen) return null;
  return (
    <div className="cart-backdrop" role="presentation" onClick={() => setCartOpen(false)}>
      <aside className="cart-drawer" role="dialog" aria-modal="true" aria-label={t("yourBag")} onClick={(event) => event.stopPropagation()}>
        <div className="drawer-header"><span>{t("yourBag")} <em>{String(lines.reduce((sum, line) => sum + line.quantity, 0)).padStart(2, "0")}</em></span><button className="close-button" onClick={() => setCartOpen(false)} aria-label="Fechar carrinho"><X size={20} /></button></div>
        {lines.length === 0 ? (
          <div className="cart-empty"><span className="section-kicker">{t("emptyBag")}</span><h2>{t("emptyBag")}</h2><p>{t("explore")}</p><Link href="/shop" className="text-link" onClick={() => setCartOpen(false)}>{t("explore")} <ArrowUpRight size={16} /></Link></div>
        ) : (
          <>
            <div className="cart-lines">{lines.map((line) => (
              <div className="cart-line" key={`${line.product.slug}-${line.size}`}>
                <img src={line.product.image} alt={line.product.alt} />
                <div className="cart-line-content"><div className="cart-line-top"><div><span className="cart-line-category">{line.product.category}</span><h3>{line.product.name}</h3></div><button className="remove-line" onClick={() => removeFromCart(line.product.slug, line.size)} aria-label={`Remover ${line.product.name}`}><X size={15} /></button></div><div className="cart-line-bottom"><span>{line.size} / {formatPrice(line.product.price)}</span><div className="quantity-control"><button onClick={() => updateQuantity(line.product.slug, line.size, -1)} aria-label="Diminuir quantidade"><Minus size={12} /></button><span>{line.quantity}</span><button onClick={() => updateQuantity(line.product.slug, line.size, 1)} aria-label="Aumentar quantidade"><Plus size={12} /></button></div></div></div>
              </div>
            ))}</div>
            <div className="cart-summary"><div><span>Subtotal</span><strong>{formatPrice(subtotal)}</strong></div><p>{t("demoNote")}</p><button className="dark-button full-button" onClick={() => { setCartOpen(false); setLocation("/checkout"); }}>{t("checkout")} <ArrowUpRight size={16} /></button></div>
          </>
        )}
      </aside>
    </div>
  );
}

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const { addToCart } = useCart();
  const [saved, setSaved] = useState(false);
  return (
    <article className="product-card" style={{ "--card-index": index } as React.CSSProperties}>
      <Link href={`/product/${product.slug}`} className="product-image-wrap">
        {product.badge && <span className="product-badge">{product.badge}</span>}
        <img src={product.image} alt={product.alt} loading={index > 1 ? "lazy" : "eager"} />
        <span className="product-view">View <ArrowUpRight size={14} /></span>
      </Link>
      <div className="product-meta">
        <div><span className="product-category">{product.category}</span><Link href={`/product/${product.slug}`} className="product-name">{product.name}</Link></div>
        <div className="product-price-block"><span>{formatPrice(product.price)}</span><button className={`quick-add ${saved ? "quick-add-active" : ""}`} aria-label={`Adicionar ${product.name} ao carrinho`} onClick={() => addToCart(product)}><Plus size={17} strokeWidth={1.5} /></button></div>
      </div>
      <div className="product-swatch-row"><span className="swatch" style={{ backgroundColor: product.color === "Bone" ? "#e5e0d8" : product.color === "Rose ash" ? "#cf9586" : product.color === "Faded olive" ? "#79806a" : "#252525" }} /><span>{product.color}</span><button className={`save-product ${saved ? "saved" : ""}`} aria-label={saved ? "Removido dos favoritos" : "Guardar nos favoritos"} onClick={() => setSaved(!saved)}><Heart size={14} fill={saved ? "currentColor" : "none"} /></button></div>
    </article>
  );
}

export function SectionLabel({ index, children }: { index: string; children: React.ReactNode }) {
  return <div className="section-label"><span>{index}</span><span>{children}</span><span className="section-label-line" /></div>;
}

export function TextLink({ children, href = "#" }: { children: React.ReactNode; href?: string }) {
  return <a href={href} className="text-link">{children}<ArrowUpRight size={16} /></a>;
}

export function Footer() {
  return (
    <footer className="site-footer" id="about">
      <div className="footer-top"><div className="footer-statement"><span className="section-kicker">Illusion / Streetwear</span><h2>Keep your<br /><i>signal.</i></h2></div><div className="footer-links"><div><span className="footer-heading">Navigate</span><Link href="/shop">Shop all</Link><Link href="/shop">Collection</Link><Link href="/story#feed">Journal</Link></div><div><span className="footer-heading">Follow</span><a href="https://www.instagram.com/" target="_blank" rel="noreferrer">Instagram <ArrowUpRight size={13} /></a><a href="https://www.tiktok.com/" target="_blank" rel="noreferrer">TikTok <ArrowUpRight size={13} /></a><a href="mailto:studio@illusionstreetwear.com">Contact <ArrowUpRight size={13} /></a></div></div></div>
      <div className="footer-bottom"><span>© 2026 Illusion Streetwear</span><span>Made for the in-between</span><span>Maputo / MZ</span></div>
    </footer>
  );
}

export function Marquee({ children }: { children: React.ReactNode }) {
  return <div className="marquee" aria-label="Informação da coleção"><div className="marquee-track">{[0, 1, 2, 3].map((item) => <span key={item}>{children}<i>✳</i></span>)}</div></div>;
}

export function BackToTop() {
  return <button className="back-to-top" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="Voltar ao topo"><ChevronRight size={16} className="back-to-top-icon" />Top</button>;
}
