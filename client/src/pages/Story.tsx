/* Concrete Editorial: página de apresentação como feed vertical de campanha; vídeo silencioso, frames de matéria e scroll narrativo. */
import { ArrowDown, ArrowUpRight, Play } from "lucide-react";
import { Link } from "wouter";
import { CartDrawer, Footer, Header, SectionLabel, BackToTop } from "@/components/StorefrontShell";
import { products } from "@/lib/storeData";
import { useLanguage } from "@/contexts/LanguageContext";

const poster = "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1600&q=85";
const campaignVideo = "https://assets.mixkit.co/videos/preview/mixkit-young-man-in-a-leather-jacket-walking-in-the-city-43612-large.mp4";
const heroLogo = "/logo.svg";
const frames = [
  { image: products[0]?.image ?? poster, label: "Frame 01 / silhouette" },
  { image: products[2]?.image ?? poster, label: "Frame 02 / outside" },
  { image: products[3]?.image ?? poster, label: "Frame 03 / material" },
];

export default function Story() {
  const { locale, t } = useLanguage();
  const pt = locale === "pt";
  return <div className="storefront-page story-page"><Header /><CartDrawer /><main>
    <section className="story-hero"><video autoPlay muted loop playsInline poster={poster} src={campaignVideo} /><div className="story-hero-overlay" /><div className="story-hero-copy"><div className="story-brand-signature"><img src={heroLogo} alt="Illusion Streetwear" /><span>ILLUSION / MOVING IMAGE 01</span></div><SectionLabel index="01">{pt ? "A imagem em movimento" : "The moving image"}</SectionLabel><h1>{pt ? <>O movimento<br /><i>é a</i><br />mensagem.</> : <>Movement<br /><i>is the</i><br />message.</>}</h1><p>{pt ? "Desliza pela coleção como imagem, corpo e cidade. Sem áudio. Sem pressa." : "Scroll through the collection as image, body and city. No sound. No rush."}</p><a href="#feed" className="light-button">{pt ? "Entrar no feed" : "Enter the feed"} <ArrowDown size={16} /></a></div><div className="story-hero-meta"><span>SS—26</span><span>01 / 05</span></div></section>
    <section className="story-intro page-pad" id="feed"><SectionLabel index="02">{pt ? "Um arquivo vivo" : "A living archive"}</SectionLabel><div className="story-intro-grid"><h2>{pt ? <>Não é uma<br /><i>campanha.</i></> : <>Not a<br /><i>campaign.</i></>}</h2><div><p>{pt ? "Uma coleção não termina quando é lançada. Continua na rua, em novos corpos, em novas combinações, em cada frame que muda quando se faz scroll." : "A collection does not end when it launches. It continues in the street, on new bodies, in new combinations, in every frame that shifts as you scroll."}</p><span className="story-scroll-note"><ArrowDown size={15} /> {pt ? "Continua a mover" : "Keep moving"}</span></div></div></section>
    <section className="feed-stack">{frames.map((frame, index) => <article className={`feed-frame feed-frame-${index + 1}`} key={frame.image}><img src={frame.image} alt={frame.label} loading="lazy" /><div className="feed-frame-label"><span>{frame.label}</span><span>0{index + 1} / 03</span></div>{index === 1 && <div className="feed-frame-statement">Wear the<br /><i>in-between.</i></div>}</article>)}</section>
    <section className="story-cta page-pad"><div><SectionLabel index="03">{pt ? "O próximo sinal" : "The next signal"}</SectionLabel><h2>{pt ? <>Encontra a tua<br /><i>frequência.</i></> : <>Find your<br /><i>frequency.</i></>}</h2></div><Link href="/shop" className="dark-button">{pt ? "Explorar peças" : "Explore pieces"} <ArrowUpRight size={17} /></Link></section>
  </main><Footer /><BackToTop /></div>;
}
