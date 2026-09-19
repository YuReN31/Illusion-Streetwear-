/* Concrete Editorial: homepage como lookbook comprável; hero cinematográfico, blocos assimétricos, rails horizontais e microinterações rápidas. */
import { useState } from "react";
import { ArrowDown, ArrowUpRight, Play, Plus } from "lucide-react";
import { Link } from "wouter";
import { CartDrawer, Footer, Header, Marquee, ProductCard, SectionLabel, TextLink, BackToTop } from "@/components/StorefrontShell";
import { products } from "@/lib/storeData";
import { useLanguage } from "@/contexts/LanguageContext";

const heroImage = "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1600&q=85";
const collectionImage = products[2]?.image ?? "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1600&q=85";
const detailImage = products[0]?.image ?? "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=1200&q=85";
const heroLogo = "/logo.svg";

export default function Home() {
  const { locale } = useLanguage();
  const pt = locale === "pt";
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  return (
    <div className="storefront-page">
      <Header />
      <CartDrawer />
      <main>
        <section className="hero-section" aria-labelledby="hero-title">
          <img className="hero-image" src={heroImage} alt="Modelo com casaco escuro junto a arquitetura de betão" />
          <div className="hero-grain" />
          <div className="hero-copy">
            <div className="hero-brand-signature"><img src={heroLogo} alt="Illusion Streetwear" /><span>ILLUSION / FIELD NOTE 01</span></div>
            <span className="eyebrow light-eyebrow">SS—26 / DROP 01</span>
            <h1 id="hero-title">{pt ? <>A cidade<br /><em>não</em><br />fica parada.</> : <>The city<br /><em>doesn't</em><br />stand still.</>}</h1>
            <p>{pt ? "Uniformes para o intervalo. Construídos para onde a rua encontra o inesperado." : "Uniforms for the in-between. Built for where the street meets the unexpected."}</p>
            <div className="hero-actions"><Link href="/shop" className="light-button">{pt ? "Ver o drop" : "Shop the drop"} <ArrowUpRight size={17} /></Link><a className="hero-scroll" href="#new-arrivals"><span>{pt ? "Deslize para explorar" : "Scroll to explore"}</span><ArrowDown size={16} /></a></div>
          </div>
          <div className="hero-index"><span>01</span><span className="hero-index-line" /><span>04</span></div>
          <div className="hero-logomark"><img src={heroLogo} alt="" /></div>
        </section>

        <Marquee>Illusion Streetwear / New perspective / Made in MZ</Marquee>

        <section className="manifesto-section page-pad" id="collection">
          <SectionLabel index="01">A point of view</SectionLabel>
          <div className="manifesto-grid">
            <div className="manifesto-title"><span className="display-outline">{pt ? "Move" : "Move"}</span><span>{pt ? "diferente." : "different."}</span><span className="display-small">{pt ? "Sem regras de uniforme." : "No uniform rules."}</span></div>
            <div className="manifesto-copy"><p>{pt ? "Roupa para quem passa entre mundos. Matéria pesada, linhas amplas e detalhes que aparecem quando a luz muda." : "Clothes for people moving between worlds. Heavy matter, wide lines and details that appear when the light shifts."}</p><TextLink href="/shop">{pt ? "Ler a nota da coleção" : "Read the collection note"}</TextLink><div className="manifesto-stamp"><span>Est.</span><strong>26</strong><span>Maputo</span></div></div>
          </div>
        </section>

        <section className="arrivals-section page-pad" id="new-arrivals">
          <div className="section-heading-row"><div><SectionLabel index="02">{pt ? "Acabaram de chegar" : "Just landed"}</SectionLabel><h2>{pt ? <>Novas <i>chegadas.</i></> : <>New <i>arrivals.</i></>}</h2></div><Link href="/shop" className="outline-button">{pt ? "Ver todas as peças" : "View all pieces"} <ArrowUpRight size={16} /></Link></div>
          <div className="product-rail">{products.slice(0, 4).map((product, index) => <ProductCard product={product} index={index} key={product.slug} />)}</div>
        </section>

        <section className="editorial-section">
          <div className="editorial-image editorial-image-large"><img src={collectionImage} alt="Editorial de coleção com casaco preto e detalhe rosa" /><span className="image-caption">01 / rose signal</span></div>
          <div className="editorial-copy"><SectionLabel index="03">{pt ? "A coleção" : "The collection"}</SectionLabel><h2>{pt ? <>Suave no<br /><i>impacto.</i></> : <>Soft on<br /><i>impact.</i></>}</h2><p>{pt ? "A coleção nasce do contraste: superfícies utilitárias, volumes honestos e uma cor que só aparece quando é preciso." : "The collection is born from contrast: utility surfaces, honest volumes and a colour that only appears when needed."}</p><TextLink href="/shop">{pt ? "Explorar a edição" : "Explore the edit"}</TextLink><div className="editorial-number">SS—26</div></div>
          <div className="editorial-image editorial-image-small"><img src={detailImage} alt="Detalhe de tecido, costura e fecho metálico" /><div className="play-pulse"><Play size={15} fill="currentColor" /></div><span className="image-caption">Watch / material study</span></div>
        </section>

        <section className="campaign-section campaign-concrete">
          <div className="campaign-inner"><div className="campaign-kicker"><span>04</span><span>Signal / 2026</span></div><h2>{pt ? <>Nada<br /><i>comum.</i></> : <>Nothing<br /><i>ordinary.</i></>}</h2><p>{pt ? "Peças limitadas. Texturas reais. A cidade como estúdio." : "Limited pieces. Real textures. The city as a studio."}</p><Link href="/shop" className="dark-button">{pt ? "Entrar no drop" : "Enter the drop"} <ArrowUpRight size={17} /></Link></div>
          <div className="campaign-lines" aria-hidden="true"><span /><span /><span /><span /></div>
        </section>

        <section className="newsletter-section page-pad" id="journal">
          <div className="newsletter-note"><span className="section-kicker">{pt ? "Fica no sinal" : "Stay in the signal"}</span><p>{pt ? "Recebe primeiro os próximos drops, editoriais e pequenas interrupções na rotina." : "Get the next drops, editorials and small interruptions to your routine first."}</p></div>
          <div className="newsletter-form-wrap"><h2>{pt ? <>Fica<br /><i>perto.</i></> : <>Keep<br /><i>close.</i></>}</h2>{subscribed ? <div className="success-message"><span>You're in.</span><p>O próximo sinal chega em breve.</p></div> : <form className="newsletter-form" onSubmit={(event) => { event.preventDefault(); if (email) setSubscribed(true); }}><label htmlFor="email">Email address</label><div><input id="email" type="email" required placeholder="your@email.com" value={email} onChange={(event) => setEmail(event.target.value)} /><button aria-label="Subscrever"><Plus size={21} /></button></div><small>Sem ruído. Só quando houver algo para dizer.</small></form>}</div>
        </section>
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
}
