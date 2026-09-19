/* Concrete Editorial: catálogo como rail de sinais — descoberta rápida, filtros claros e ritmo de arquivo. */
import { Fragment, useEffect, useMemo, useState } from "react";
import { ArrowUpRight, ChevronDown, Search, SlidersHorizontal, X } from "lucide-react";
import { CartDrawer, Footer, Header, ProductCard, SectionLabel, BackToTop } from "@/components/StorefrontShell";
import { categories, products, fetchProducts, type Product } from "@/lib/storeData";
import { useLanguage } from "@/contexts/LanguageContext";

const categoryTranslations: Record<string, string> = { "All pieces": "Todas as peças", Outerwear: "Casacos", "T-shirts": "T-shirts", Sweats: "Sweats", Trousers: "Calças", Knitwear: "Malhas" };

export default function Shop() {
  const { locale, t } = useLanguage();
  const pt = locale === "pt";
  const [productList, setProductList] = useState<Product[]>(products);
  const [activeCategory, setActiveCategory] = useState("All pieces");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"featured" | "low" | "high">("featured");
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    fetchProducts().then((res) => {
      if (res && res.length > 0) setProductList(res);
    });
  }, []);

  const sortOptions = { featured: t("featured"), low: t("priceLow"), high: t("priceHigh") };
  const filteredProducts = useMemo(() => {
    const result = productList.filter((product) => {
      const categoryMatch = activeCategory === "All pieces" || product.category === activeCategory;
      const queryMatch = `${product.name} ${product.category} ${product.color}`.toLowerCase().includes(query.toLowerCase());
      return categoryMatch && queryMatch;
    });
    if (sort === "low") return [...result].sort((a, b) => a.price - b.price);
    if (sort === "high") return [...result].sort((a, b) => b.price - a.price);
    return result;
  }, [productList, activeCategory, query, sort]);
  const chooseCategory = (category: string) => { setActiveCategory(category); setFilterOpen(false); };

  return (
    <div className="storefront-page light-page">
      <Header />
      <CartDrawer />
      <main>
        <section className="shop-intro page-pad" id="collection">
          <SectionLabel index="All / 01">{pt ? "A edição" : "The edit"}</SectionLabel>
          <div className="shop-intro-row"><div><h1>{pt ? <>Sinais<br /><i>diários.</i></> : <>Everyday<br /><i>signals.</i></>}</h1></div><div className="shop-intro-copy"><p>{pt ? "Uma edição de peças que não pedem permissão para ocupar espaço. Volumes amplos, matéria tátil e cor na medida." : "An edit of pieces that ask no permission to take space. Wide volumes, tactile matter and colour in the right measure."}</p><span className="shop-count">{String(filteredProducts.length).padStart(2, "0")} {pt ? "peças" : "pieces"} / SS—26</span></div></div>
        </section>
        <section className={`shop-toolbar page-pad ${filterOpen ? "filter-open" : ""}`} aria-label={pt ? "Filtros de catálogo" : "Catalog filters"}>
          <div className="category-tabs">{categories.map((category) => <button className={activeCategory === category ? "active" : ""} onClick={() => chooseCategory(category)} key={category}>{pt ? categoryTranslations[category] ?? category : category}</button>)}</div>
          <div className="shop-tools"><label className="search-field"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={pt ? "Pesquisar peças" : "Search pieces"} aria-label={t("search")} /></label><label className="sort-field"><span>{t("sort")}</span><select value={sort} onChange={(event) => setSort(event.target.value as "featured" | "low" | "high")} aria-label={t("sort")}><option value="featured">{sortOptions.featured}</option><option value="low">{sortOptions.low}</option><option value="high">{sortOptions.high}</option></select><ChevronDown size={14} /></label><button className="filter-mobile" onClick={() => setFilterOpen((open) => !open)} aria-expanded={filterOpen}><SlidersHorizontal size={16} /> {t("filter")} {filterOpen ? <X size={14} /> : null}</button></div>
          {filterOpen && <div className="mobile-filter-panel"><span className="section-kicker">{pt ? "Filtrar por matéria" : "Filter by matter"}</span><div>{categories.map((category) => <button className={activeCategory === category ? "active" : ""} onClick={() => chooseCategory(category)} key={category}>{pt ? categoryTranslations[category] ?? category : category}</button>)}</div></div>}
        </section>
        <section className="shop-grid page-pad" aria-live="polite">{filteredProducts.length > 0 ? filteredProducts.map((product, index) => <Fragment key={product.slug}>{index === 2 && <div className="shop-editorial-break"><span className="section-kicker">02 / {pt ? "Matéria em movimento" : "Matter in motion"}</span><strong>{pt ? <>Não é uma<br /><i>campanha.</i></> : <>Not a<br /><i>campaign.</i></>}</strong><small>{pt ? "A edição continua fora do estúdio." : "The edit continues outside the studio."}</small></div>}<ProductCard product={product} index={index} /></Fragment>) : <div className="empty-state"><span className="section-kicker">{t("nothingFound")}</span><h2>{pt ? <>Tenta outra<br /><i>frequência.</i></> : <>Try another<br /><i>frequency.</i></>}</h2><button className="text-link-button" onClick={() => { setQuery(""); setActiveCategory("All pieces"); }}>{t("reset")} <ArrowUpRight size={16} /></button></div>}</section>
        <section className="shop-footer-banner"><div><span className="section-kicker">{pt ? "Não são só básicos" : "Not just basics"}</span><h2>{pt ? <>Veste o<br /><i>intervalo.</i></> : <>Wear the<br /><i>in-between.</i></>}</h2></div><span className="shop-footer-arrow"><ArrowUpRight size={29} /></span></section>
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
}
