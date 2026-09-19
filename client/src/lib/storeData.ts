/* Concrete Editorial: dados locais de demonstração para uma loja de roupa urbana; estrutura pronta para trocar por API no futuro. */
export type Product = {
  slug: string;
  name: string;
  category: string;
  price: number;
  color: string;
  sizes: string[];
  description: string;
  image: string;
  alt: string;
  badge?: string;
  material: string;
};

export const products: Product[] = [
  {
    slug: "signal-overshirt",
    name: "Signal Overshirt",
    category: "Outerwear",
    price: 8900,
    color: "Charcoal",
    sizes: ["XS", "S", "M", "L", "XL"],
    description: "Uma camada estruturada com presença silenciosa. Corte amplo, algodão encorpado e fecho metálico aparente.",
    image: "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=1200&q=85",
    alt: "Casaco escuro pendurado num espaço editorial",
    badge: "New drop",
    material: "100% algodão pesado",
  },
  {
    slug: "afterimage-tee",
    name: "Afterimage Tee",
    category: "T-Shirts",
    price: 4200,
    color: "Bone",
    sizes: ["XS", "S", "M", "L", "XL"],
    description: "T-shirt de corte boxy em jersey pesado. A base neutra para construir o uniforme do dia.",
    image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=85",
    alt: "T-shirt branca minimalista sobre fundo claro",
    material: "Jersey de algodão 240gsm",
  },
  {
    slug: "rose-noise-hoodie",
    name: "Rose Noise Hoodie",
    category: "Sweats",
    price: 7600,
    color: "Rose ash",
    sizes: ["S", "M", "L", "XL"],
    description: "Volume generoso e toque macio. O tom rose ash introduz uma frequência quente na paleta urbana.",
    image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=1200&q=85",
    alt: "Sweatshirt em tom rosa suave",
    badge: "Limited",
    material: "Fleece de algodão escovado",
  },
  {
    slug: "concrete-cargo",
    name: "Concrete Cargo",
    category: "Trousers",
    price: 6800,
    color: "Concrete grey",
    sizes: ["28", "30", "32", "34", "36"],
    description: "Calça cargo de perna larga com bolsos utilitários e ajuste interno na cintura.",
    image: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=1200&q=85",
    alt: "Look urbano com calça de corte largo",
    material: "Sarja de algodão lavada",
  },
  {
    slug: "low-light-denim",
    name: "Low Light Denim",
    category: "Trousers",
    price: 7200,
    color: "Washed black",
    sizes: ["28", "30", "32", "34", "36"],
    description: "Denim lavado com volume relaxado, cinco bolsos e acabamento irregular inspirado no desgaste real.",
    image: "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=1200&q=85",
    alt: "Jeans escuros de corte relaxado",
    material: "Denim de algodão 13oz",
  },
  {
    slug: "archive-rib-knit",
    name: "Archive Rib Knit",
    category: "Knitwear",
    price: 6100,
    color: "Faded olive",
    sizes: ["S", "M", "L"],
    description: "Malha de nervura fina, ligeiramente cropped e feita para ser usada em camadas.",
    image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=1200&q=85",
    alt: "Peça de malha verde suave num cabide",
    material: "Algodão e lã reciclada",
  },
];

export const categories = ["All pieces", "Outerwear", "T-Shirts", "Sweats", "Trousers", "Knitwear"];

export const formatPrice = (value: number) =>
  new Intl.NumberFormat("pt-PT", { style: "currency", currency: "MZN", maximumFractionDigits: 0 }).format(value).replace("MZN", "MT");
