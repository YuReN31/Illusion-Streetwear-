/* Concrete Editorial: dados locais de demonstração para uma loja de roupa urbana; estrutura pronta para trocar por API no futuro. */
export type Product = {
  id?: string;
  slug: string;
  name: string;
  namePt?: string;
  nameEn?: string;
  category: string;
  categorySlug?: string;
  price: number;
  promoPrice?: number | null;
  currency?: string;
  color: string;
  sizes: string[];
  description: string;
  descriptionPt?: string;
  descriptionEn?: string;
  image: string;
  alt: string;
  altPt?: string;
  altEn?: string;
  badge?: string;
  material: string;
  materialPt?: string;
  materialEn?: string;
  collection?: string;
  isSoldOut?: boolean;
  totalStock?: number;
  isFeatured?: boolean;
  isNewDrop?: boolean;
  isPromo?: boolean;
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

export async function fetchProducts(query?: { category?: string; search?: string; sort?: string }): Promise<Product[]> {
  try {
    const params = new URLSearchParams();
    if (query?.category && query.category !== "All pieces" && query.category !== "all") {
      params.set("category", query.category);
    }
    if (query?.search) params.set("search", query.search);
    if (query?.sort) params.set("sort", query.sort);

    const res = await fetch(`/api/products?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (err) {
    console.warn("API product fetch failed, fallback to local dataset", err);
  }
  return products;
}

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  try {
    const res = await fetch(`/api/products/${slug}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("API single product fetch failed", err);
  }
  return products.find((p) => p.slug === slug) || null;
}

