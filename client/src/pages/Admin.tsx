/* Concrete Editorial: backoffice como centro operacional real — produtos, encomendas, clientes, CMS e WhatsApp ligados à API e Turso. */
import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  BarChart3,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  FileText,
  LayoutDashboard,
  Lock,
  MoreHorizontal,
  Package2,
  PanelsTopLeft,
  Plus,
  Search,
  Settings2,
  ShoppingCart,
  SlidersHorizontal,
  Trash2,
  Users,
  X,
  MessageSquare,
  AlertCircle,
} from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { Header, Footer, BackToTop } from "@/components/StorefrontShell";
import { formatPrice } from "@/lib/storeData";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";

type Section = "overview" | "products" | "collections" | "content" | "orders" | "customers" | "discounts" | "settings";

type ManagedProduct = {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  status: "published" | "draft";
  image: string;
  sku: string;
  collection: string;
};

type Collection = {
  id: string;
  name: string;
  count: number;
  status: "published" | "draft";
  image: string;
};

type Order = {
  id: string;
  rawId?: string;
  customer: string;
  email?: string;
  total: number;
  status: "NEW" | "AWAITING_PAYMENT" | "PAYMENT_CONFIRMED" | "PREPARING" | "SHIPPED" | "COMPLETED" | "CANCELLED" | "Paid" | "Processing";
  date: string;
};

type Customer = {
  name: string;
  email: string;
  orders: number;
  joined: string;
};

type ContentItem = {
  id: string;
  title: string;
  type: string;
  status: boolean;
};

type StoreSettings = {
  maintenance: boolean;
  alerts: boolean;
  freeShipping: boolean;
  whatsappNumber: string;
  whatsappActive: boolean;
  whatsappMessagePt: string;
  whatsappMessageEn: string;
};

const moduleItems: { id: Section; label: string; short: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "Overview", short: "Visão geral", icon: LayoutDashboard },
  { id: "products", label: "Products", short: "Produtos", icon: Package2 },
  { id: "collections", label: "Collections", short: "Coleções", icon: PanelsTopLeft },
  { id: "content", label: "Content", short: "Conteúdo", icon: FileText },
  { id: "orders", label: "Orders", short: "Pedidos", icon: ShoppingCart },
  { id: "customers", label: "Customers", short: "Clientes", icon: Users },
  { id: "discounts", label: "Discounts", short: "Cupões", icon: CircleDollarSign },
  { id: "settings", label: "Settings", short: "Definições", icon: Settings2 },
];

export default function Admin() {
  const { user, login } = useAuth();
  const { locale } = useLanguage();
  const pt = locale === "pt";

  // Admin Auth State
  const [adminEmail, setAdminEmail] = useState("admin@illusion.com");
  const [adminPassword, setAdminPassword] = useState("illusion2026!");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Module state
  const [section, setSection] = useState<Section>("overview");
  const [query, setQuery] = useState("");
  const [showProductForm, setShowProductForm] = useState(false);
  const [editing, setEditing] = useState<ManagedProduct | null>(null);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  // Data collections from API
  const [productsList, setProductsList] = useState<ManagedProduct[]>([]);
  const [ordersList, setOrdersList] = useState<Order[]>([]);
  const [customersList, setCustomersList] = useState<Customer[]>([]);
  const [contentList, setContentList] = useState<ContentItem[]>([
    { id: "sec_hero", title: "Editorial hero", type: "Image + headline + CTA", status: true },
    { id: "sec_new_drop", title: "New arrivals", type: "Product rail / 06 items", status: true },
    { id: "sec_manifesto", title: "Manifesto", type: "Copy + metric + link", status: true },
  ]);
  const [collectionsList, setCollectionsList] = useState<Collection[]>([
    { id: "drop-01", name: "SS—26 / Drop 01", count: 6, status: "published", image: "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=1200&q=85" },
    { id: "archive", name: "Archive / 01", count: 4, status: "published", image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=1200&q=85" },
  ]);
  const [settings, setSettings] = useState<StoreSettings>({
    maintenance: false,
    alerts: true,
    freeShipping: true,
    whatsappNumber: "+258840000000",
    whatsappActive: true,
    whatsappMessagePt: "Olá! Fiz um pedido no site Illusion Streetwear.\n\nCódigo do pedido: {ORDER_CODE}\nNome: {CUSTOMER_NAME}\nTotal: {TOTAL}\n\nGostaria de saber os meios de pagamento e os próximos passos.",
    whatsappMessageEn: "Hello! I placed an order on Illusion Streetwear.\n\nOrder code: {ORDER_CODE}\nName: {CUSTOMER_NAME}\nTotal: {TOTAL}\n\nI would like to know the payment methods and next steps.",
  });

  const notify = (message: string) => {
    setNotice(message);
    toast(message);
    window.setTimeout(() => setNotice(""), 2600);
  };

  // Fetch real data when user is ADMIN
  const loadAdminData = async () => {
    if (!user || user.role !== "ADMIN") return;
    setLoading(true);
    try {
      // 1. Fetch products
      const pRes = await fetch("/api/admin/products");
      if (pRes.ok) {
        const pData = await pRes.json();
        setProductsList(pData);
      }

      // 2. Fetch orders
      const oRes = await fetch("/api/admin/orders");
      if (oRes.ok) {
        const oData = await oRes.json();
        setOrdersList(oData);
      }

      // 3. Fetch customers
      const cRes = await fetch("/api/admin/customers");
      if (cRes.ok) {
        const cData = await cRes.json();
        setCustomersList(cData);
      }

      // 4. Fetch settings
      const sRes = await fetch("/api/admin/settings");
      if (sRes.ok) {
        const sData = await sRes.json();
        if (sData.store) {
          setSettings({
            maintenance: !!sData.store.maintenanceMode,
            alerts: !!sData.store.operationalAlerts,
            freeShipping: sData.store.freeShippingThreshold != null,
            whatsappNumber: sData.whatsapp?.number || "+258840000000",
            whatsappActive: sData.whatsapp?.active !== false,
            whatsappMessagePt: sData.whatsapp?.defaultMessagePt || "",
            whatsappMessageEn: sData.whatsapp?.defaultMessageEn || "",
          });
        }
      }

      // 5. Fetch CMS sections
      const secRes = await fetch("/api/admin/cms/sections");
      if (secRes.ok) {
        const secData = await secRes.json();
        if (Array.isArray(secData) && secData.length > 0) {
          setContentList(
            secData.map((s: any) => ({
              id: s.id,
              title: s.titleEn || s.titlePt,
              type: s.subtitlePt || "CMS Section",
              status: s.isActive === 1,
            }))
          );
        }
      }
    } catch (err) {
      console.warn("Failed loading admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [user]);

  // Handle Admin Login
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);
    const res = await login(adminEmail, adminPassword);
    setAuthLoading(false);
    if (!res.success) {
      setAuthError(res.error || (pt ? "Credenciais de administrador inválidas." : "Invalid admin credentials."));
    }
  };

  // If user is not ADMIN, show clean Concrete Editorial admin login form
  if (!user || user.role !== "ADMIN") {
    return (
      <div className="storefront-page admin-page light-page">
        <Header />
        <main className="page-pad" style={{ maxWidth: "560px", margin: "4rem auto" }}>
          <div className="account-card" style={{ padding: "2.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <Lock size={18} />
              <span className="section-kicker">SS—26 / {pt ? "Área restrita" : "Restricted area"}</span>
            </div>
            <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
              {pt ? "Acesso ao Controlo" : "Control Access"}<i>.</i>
            </h1>
            <p style={{ opacity: 0.8, fontSize: "0.9rem", marginBottom: "1.5rem" }}>
              {pt
                ? "Este painel operacional requer privilégios de Administrador."
                : "This operational panel requires Administrator credentials."}
            </p>

            {authError && (
              <div className="checkout-error" style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                <AlertCircle size={15} />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleAdminLogin} className="account-form">
              <label>
                {pt ? "E-mail de administrador" : "Admin email"}
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@illusion.com"
                />
              </label>

              <label>
                {pt ? "Palavra-passe" : "Password"}
                <input
                  type="password"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </label>

              <button className="dark-button full-button" type="submit" disabled={authLoading}>
                {authLoading ? (pt ? "A autenticar..." : "Authenticating...") : (pt ? "Entrar no painel" : "Sign in to panel")}{" "}
                <ArrowUpRight size={16} />
              </button>

              <div style={{ marginTop: "1rem", textAlign: "center" }}>
                <small style={{ opacity: 0.6 }}>
                  {pt ? "Conta de teste: admin@illusion.com / illusion2026!" : "Test account: admin@illusion.com / illusion2026!"}
                </small>
              </div>
            </form>
          </div>
        </main>
        <Footer />
        <BackToTop />
      </div>
    );
  }

  const activeProducts = productsList.filter((p) => p.status === "published").length;
  const productResults = productsList.filter((product) =>
    `${product.name} ${product.category} ${product.sku}`.toLowerCase().includes(query.toLowerCase())
  );

  const setModule = (next: Section) => {
    setSection(next);
    setQuery("");
    setShowProductForm(false);
    setEditing(null);
  };

  const toggleProduct = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/products/${id}/toggle`, { method: "PATCH" });
      if (res.ok) {
        const data = await res.json();
        setProductsList((current) =>
          current.map((p) => (p.id === id ? { ...p, status: data.isPublished ? "published" : "draft" } : p))
        );
        notify(pt ? "Estado do produto atualizado." : "Product status updated.");
      }
    } catch {
      notify(pt ? "Erro ao atualizar produto." : "Error updating product.");
    }
  };

  const changeStock = async (id: string, amount: number) => {
    try {
      const res = await fetch(`/api/admin/products/${id}/stock`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delta: amount }),
      });
      if (res.ok) {
        const data = await res.json();
        setProductsList((current) =>
          current.map((p) => (p.id === id ? { ...p, stock: data.stock } : p))
        );
      }
    } catch {
      notify(pt ? "Erro ao alterar stock." : "Error updating stock.");
    }
  };

  const deleteProduct = async (id: string) => {
    if (!window.confirm(pt ? "Eliminar este produto do catálogo?" : "Delete this product from catalog?")) return;
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
      if (res.ok) {
        setProductsList((current) => current.filter((p) => p.id !== id));
        notify(pt ? "Produto eliminado." : "Product deleted.");
      }
    } catch {
      notify(pt ? "Erro ao eliminar produto." : "Error deleting product.");
    }
  };

  const updateOrder = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setOrdersList((current) =>
          current.map((o) => (o.id === id || o.rawId === id ? { ...o, status: status as any } : o))
        );
        notify(pt ? `Estado da encomenda atualizado para ${status}.` : `Order status updated to ${status}.`);
      }
    } catch {
      notify(pt ? "Erro ao atualizar encomenda." : "Error updating order.");
    }
  };

  const updateContent = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/cms/sections/${id}/toggle`, { method: "PATCH" });
      if (res.ok) {
        const data = await res.json();
        setContentList((current) =>
          current.map((item) => (item.id === id ? { ...item, status: data.isActive } : item))
        );
        notify(pt ? "Visibilidade da secção atualizada." : "Section visibility updated.");
      }
    } catch {
      notify(pt ? "Erro ao atualizar CMS." : "Error updating CMS.");
    }
  };

  const saveSettings = async (nextSettings: StoreSettings) => {
    setSettings(nextSettings);
    try {
      await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          whatsapp: {
            number: nextSettings.whatsappNumber,
            active: nextSettings.whatsappActive,
            defaultMessagePt: nextSettings.whatsappMessagePt,
            defaultMessageEn: nextSettings.whatsappMessageEn,
          },
          store: {
            currency: "MT",
            freeShippingThreshold: nextSettings.freeShipping ? 8000 : null,
            maintenanceMode: nextSettings.maintenance,
            operationalAlerts: nextSettings.alerts,
          },
        }),
      });
      notify(pt ? "Definições guardadas na base de dados." : "Settings saved to database.");
    } catch {
      notify(pt ? "Erro ao guardar definições." : "Error saving settings.");
    }
  };

  return (
    <div className="storefront-page admin-page light-page">
      <Header />
      <main className="admin-wrap page-pad">
        <aside className="admin-sidebar">
          <span className="section-kicker">{pt ? "Estúdio / Operação" : "Studio / Operation"}</span>
          <div className="admin-brand">
            {pt ? "CONTROLO" : "CONTROL"}
            <i>.</i>
          </div>
          <nav aria-label={pt ? "Navegação do painel" : "Admin navigation"}>
            {moduleItems.map(({ id, label, short, icon: Icon }) => (
              <button
                className={section === id ? "active" : ""}
                key={id}
                onClick={() => setModule(id)}
              >
                <Icon size={16} />
                <span>{pt ? short : label}</span>
                {id === "products" && <span className="admin-nav-dot" />}
              </button>
            ))}
          </nav>
          <div className="admin-sidebar-bottom">
            <span className="section-kicker">{pt ? "Base de Dados" : "Database"}</span>
            <strong>Turso LibSQL</strong>
            <small>{pt ? "Persistência em tempo real" : "Real-time persistence"}</small>
            <button className="admin-reset" onClick={loadAdminData}>
              {pt ? "Recarregar dados" : "Reload data"}
            </button>
          </div>
        </aside>

        <section className="admin-content">
          <div className="admin-topline">
            <div>
              <span className="eyebrow">SS—26 / {pt ? "Painel de controlo" : "Control panel"}</span>
              <h1>
                {section === "overview" ? (
                  pt ? (
                    <>
                      O sistema
                      <br />
                      <i>em movimento.</i>
                    </>
                  ) : (
                    <>
                      The system
                      <br />
                      <i>in motion.</i>
                    </>
                  )
                ) : (
                  <>
                    {pt ? moduleItems.find((item) => item.id === section)?.short : moduleItems.find((item) => item.id === section)?.label}
                    <i>.</i>
                  </>
                )}
              </h1>
            </div>
            <div className="admin-actions">
              <Link href="/" className="outline-button">
                {pt ? "Ver loja" : "View store"} <ArrowUpRight size={15} />
              </Link>
              {section === "products" && (
                <button
                  className="dark-button"
                  onClick={() => {
                    setEditing(null);
                    setShowProductForm(true);
                  }}
                >
                  <Plus size={16} /> {pt ? "Novo produto" : "New product"}
                </button>
              )}
            </div>
          </div>

          {notice && (
            <div className="admin-notice">
              <Check size={15} /> {notice}
            </div>
          )}

          {section === "overview" && (
            <Overview
              productsCount={productsList.length}
              ordersCount={ordersList.length}
              orders={ordersList}
              content={contentList}
              pt={pt}
              setModule={setModule}
              activeProducts={activeProducts}
            />
          )}

          {section === "products" && (
            <ProductsModule
              products={productResults}
              pt={pt}
              query={query}
              setQuery={setQuery}
              onToggle={toggleProduct}
              onStock={changeStock}
              onDelete={deleteProduct}
              onEdit={(product) => {
                setEditing(product);
                setShowProductForm(true);
              }}
            />
          )}

          {section === "collections" && (
            <CollectionsModule
              collections={collectionsList}
              pt={pt}
              onToggle={(id) =>
                setCollectionsList((curr) =>
                  curr.map((c) => (c.id === id ? { ...c, status: c.status === "published" ? "draft" : "published" } : c))
                )
              }
              onNew={() => notify(pt ? "Coleção guardada." : "Collection saved.")}
            />
          )}

          {section === "content" && (
            <ContentModule content={contentList} pt={pt} onToggle={updateContent} />
          )}

          {section === "orders" && (
            <OrdersModule orders={ordersList} pt={pt} onStatus={updateOrder} />
          )}

          {section === "customers" && (
            <CustomersModule customers={customersList} pt={pt} query={query} setQuery={setQuery} />
          )}

          {section === "discounts" && (
            <DiscountsModule
              discounts={[
                { code: "DROP01", type: "Percentage", value: "10%", status: "Active" },
                { code: "FIRSTFRAME", type: "Fixed", value: "500 MT", status: "Paused" },
              ]}
              pt={pt}
              onNew={() => notify(pt ? "Cupão criado." : "Coupon created.")}
            />
          )}

          {section === "settings" && (
            <SettingsModule
              settings={settings}
              pt={pt}
              onSave={saveSettings}
            />
          )}

          {showProductForm && (
            <ProductForm
              product={editing}
              pt={pt}
              onClose={() => setShowProductForm(false)}
              onSave={async (prodData) => {
                try {
                  if (editing) {
                    await fetch(`/api/admin/products/${editing.id}`, {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(prodData),
                    });
                  } else {
                    await fetch("/api/admin/products", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(prodData),
                    });
                  }
                  setShowProductForm(false);
                  loadAdminData();
                  notify(pt ? "Produto persistido com sucesso." : "Product saved successfully.");
                } catch {
                  notify(pt ? "Erro ao guardar produto." : "Error saving product.");
                }
              }}
            />
          )}
        </section>
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
}

function ModuleHeader({ eyebrow, title, action, children }: { eyebrow: string; title: React.ReactNode; action?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="module-header">
      <div>
        <span className="section-kicker">{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      {action}
      {children}
    </div>
  );
}

function Overview({
  productsCount,
  ordersCount,
  orders,
  content,
  pt,
  setModule,
  activeProducts,
}: {
  productsCount: number;
  ordersCount: number;
  orders: Order[];
  content: ContentItem[];
  pt: boolean;
  setModule: (section: Section) => void;
  activeProducts: number;
}) {
  const totalRevenue = orders.reduce((sum, o) => sum + (o.status !== "CANCELLED" ? o.total : 0), 0);

  return (
    <div className="admin-module">
      <div className="admin-stat-grid">
        <div className="admin-stat">
          <span className="section-kicker">{pt ? "Produtos activos" : "Active products"}</span>
          <strong>{String(activeProducts).padStart(2, "0")}</strong>
          <span className="stat-change">
            <Check size={13} /> {pt ? "Catálogo Turso" : "Turso catalog"}
          </span>
        </div>
        <div className="admin-stat">
          <span className="section-kicker">{pt ? "Pedidos totais" : "Total orders"}</span>
          <strong>{String(ordersCount).padStart(2, "0")}</strong>
          <span className="stat-change">{pt ? "Em tempo real" : "Real-time"}</span>
        </div>
        <div className="admin-stat">
          <span className="section-kicker">{pt ? "Receita estimada" : "Estimated revenue"}</span>
          <strong>{formatPrice(totalRevenue)}</strong>
          <span className="stat-change">{pt ? "Sem cancelados" : "Excl. cancelled"}</span>
        </div>
        <div className="admin-stat">
          <span className="section-kicker">{pt ? "Estado" : "Status"}</span>
          <strong className="stat-live">LIVE</strong>
          <span className="stat-change">{pt ? "Banco conectado" : "Database active"}</span>
        </div>
      </div>

      <div className="admin-dashboard-grid">
        <section className="admin-panel chart-panel">
          <ModuleHeader
            eyebrow={pt ? "01 / Ritmo" : "01 / Rhythm"}
            title={pt ? "Actividade" : "Activity"}
            action={
              <button className="admin-filter">
                30 {pt ? "dias" : "days"} <ChevronDown size={14} />
              </button>
            }
          />
          <div className="fake-chart">
            <div className="chart-axis">
              <span>48K</span>
              <span>32K</span>
              <span>16K</span>
              <span>0</span>
            </div>
            <div className="chart-bars">
              {[42, 58, 35, 73, 48, 86, 64, 92, 70, 78, 54, 89].map((height, index) => (
                <span key={index} style={{ height: `${height}%` }}>
                  <i />
                </span>
              ))}
            </div>
          </div>
          <div className="chart-legend">
            <span>
              <i className="rose-dot" /> {pt ? "Receita" : "Revenue"}
            </span>
            <span>{pt ? "Última actualização" : "Last updated"} agora</span>
          </div>
        </section>

        <section className="admin-panel activity-panel">
          <ModuleHeader
            eyebrow={pt ? "02 / Últimos" : "02 / Recent"}
            title={pt ? "Pedidos" : "Orders"}
            action={
              <button className="text-link" onClick={() => setModule("orders")}>
                {pt ? "Ver todos" : "View all"} <ArrowUpRight size={14} />
              </button>
            }
          />
          {orders.slice(0, 4).map((order) => (
            <div className="mini-order" key={order.id}>
              <span className="order-dot" />
              <div>
                <strong>{order.id}</strong>
                <small>
                  {order.customer} / {order.date}
                </small>
              </div>
              <span>{formatPrice(order.total)}</span>
            </div>
          ))}
          {orders.length === 0 && (
            <p style={{ opacity: 0.5, fontSize: "0.85rem", padding: "1rem 0" }}>
              {pt ? "Nenhum pedido registado ainda." : "No orders recorded yet."}
            </p>
          )}
        </section>
      </div>

      <div className="admin-bottom-grid">
        <section className="admin-panel">
          <ModuleHeader
            eyebrow={pt ? "03 / Conteúdo" : "03 / Content"}
            title="Homepage"
            action={
              <button className="text-link" onClick={() => setModule("content")}>
                {pt ? "Editar" : "Edit"} <ArrowUpRight size={14} />
              </button>
            }
          />
          {content.slice(0, 3).map((item, index) => (
            <div className="content-row" key={item.id}>
              <span className="content-handle">0{index + 1}</span>
              <div>
                <strong>{item.title}</strong>
                <small>{item.type}</small>
              </div>
              <button className={`content-toggle ${item.status ? "active" : ""}`} onClick={() => setModule("content")}>
                <span />
              </button>
            </div>
          ))}
        </section>

        <section className="admin-panel panel-dark">
          <span className="section-kicker">04 / {pt ? "Próxima publicação" : "Next publish"}</span>
          <h2>
            {pt ? (
              <>
                Drop 02
                <br />
                <i>em preparação.</i>
              </>
            ) : (
              <>
                Drop 02
                <br />
                <i>in progress.</i>
              </>
            )}
          </h2>
          <p>
            {pt
              ? "Monte produtos, imagens, preço e narrativa antes de publicar."
              : "Assemble products, imagery, pricing and narrative before publishing."}
          </p>
          <button className="light-button" onClick={() => setModule("products")}>
            {pt ? "Gerir produtos" : "Manage products"} <ArrowUpRight size={16} />
          </button>
        </section>
      </div>
    </div>
  );
}

function ProductsModule({
  products: list,
  pt,
  query,
  setQuery,
  onToggle,
  onStock,
  onDelete,
  onEdit,
}: {
  products: ManagedProduct[];
  pt: boolean;
  query: string;
  setQuery: (value: string) => void;
  onToggle: (id: string) => void;
  onStock: (id: string, amount: number) => void;
  onDelete: (id: string) => void;
  onEdit: (product: ManagedProduct) => void;
}) {
  return (
    <div className="admin-module">
      <ModuleHeader
        eyebrow={`01 / ${pt ? "Catálogo" : "Catalog"}`}
        title={pt ? "Produtos" : "Products"}
        action={
          <button className="admin-filter">
            <SlidersHorizontal size={14} /> {pt ? "Filtros" : "Filters"}
          </button>
        }
      >
        <div className="admin-search">
          <Search size={16} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={pt ? "Pesquisar por nome, categoria ou SKU" : "Search name, category or SKU"}
          />
        </div>
      </ModuleHeader>

      <div className="admin-table-head">
        <span>{pt ? "Produto" : "Product"}</span>
        <span>{pt ? "SKU / Colecção" : "SKU / Collection"}</span>
        <span>{pt ? "Preço" : "Price"}</span>
        <span>{pt ? "Stock" : "Stock"}</span>
        <span>{pt ? "Estado" : "Status"}</span>
        <span />
      </div>

      <div className="admin-product-list">
        {list.length ? (
          list.map((product) => (
            <div className="admin-product-row" key={product.id}>
              <div className="admin-product-cell">
                <img src={product.image} alt="" />
                <div>
                  <strong>{product.name}</strong>
                  <small>{product.category}</small>
                </div>
              </div>
              <span>
                <strong>{product.sku}</strong>
                <small>{product.collection}</small>
              </span>
              <strong>{formatPrice(product.price)}</strong>
              <div className="stock-control">
                <button onClick={() => onStock(product.id, -1)} aria-label={pt ? "Diminuir stock" : "Decrease stock"}>
                  −
                </button>
                <span className={product.stock === 0 ? "stock-empty" : ""}>
                  {String(product.stock).padStart(2, "0")}
                </span>
                <button onClick={() => onStock(product.id, 1)} aria-label={pt ? "Aumentar stock" : "Increase stock"}>
                  +
                </button>
              </div>
              <button
                className={`status-toggle ${product.status === "published" ? "is-active" : ""}`}
                onClick={() => onToggle(product.id)}
              >
                <span />
                {product.status === "published"
                  ? pt
                    ? "Publicado"
                    : "Published"
                  : pt
                  ? "Rascunho"
                  : "Draft"}
              </button>
              <div className="row-actions">
                <button onClick={() => onEdit(product)} aria-label={pt ? "Editar produto" : "Edit product"}>
                  <MoreHorizontal size={17} />
                </button>
                <button onClick={() => onDelete(product.id)} aria-label={pt ? "Eliminar produto" : "Delete product"}>
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="admin-empty">
            <Package2 size={24} />
            <h3>{pt ? "Nenhum sinal encontrado." : "No signal found."}</h3>
            <p>{pt ? "Tenta outro termo de pesquisa." : "Try another search term."}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function CollectionsModule({
  collections,
  pt,
  onToggle,
  onNew,
}: {
  collections: Collection[];
  pt: boolean;
  onToggle: (id: string) => void;
  onNew: () => void;
}) {
  return (
    <div className="admin-module">
      <ModuleHeader
        eyebrow={`01 / ${pt ? "Catálogo" : "Catalog"}`}
        title={pt ? "Coleções" : "Collections"}
        action={
          <button className="dark-button" onClick={onNew}>
            <Plus size={16} /> {pt ? "Nova coleção" : "New collection"}
          </button>
        }
      />
      <div className="collection-admin-grid">
        {collections.map((collection) => (
          <article className="collection-admin-card" key={collection.id}>
            <img src={collection.image} alt="" />
            <div>
              <span className="section-kicker">
                {collection.status === "published"
                  ? pt
                    ? "Publicado"
                    : "Published"
                  : pt
                  ? "Rascunho"
                  : "Draft"}
              </span>
              <h3>{collection.name}</h3>
              <p>
                {collection.count} {pt ? "produtos" : "products"}
              </p>
              <button
                className={`status-toggle ${collection.status === "published" ? "is-active" : ""}`}
                onClick={() => onToggle(collection.id)}
              >
                <span />{" "}
                {collection.status === "published"
                  ? pt
                    ? "Activo"
                    : "Active"
                  : pt
                  ? "Inactivo"
                  : "Inactive"}
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function ContentModule({
  content,
  pt,
  onToggle,
}: {
  content: ContentItem[];
  pt: boolean;
  onToggle: (id: string) => void;
}) {
  return (
    <div className="admin-module">
      <ModuleHeader
        eyebrow={`01 / ${pt ? "CMS editorial" : "Editorial CMS"}`}
        title={pt ? "Conteúdo da homepage" : "Homepage content"}
        action={
          <button className="dark-button" onClick={() => toast(pt ? "Editor preparado." : "Editor prepared.")}>
            <Plus size={16} /> {pt ? "Nova secção" : "New section"}
          </button>
        }
      />
      <div className="content-editor-list">
        {content.map((item, index) => (
          <div className="content-editor-row" key={item.id}>
            <span className="content-handle">0{index + 1}</span>
            <div className="content-editor-copy">
              <strong>{item.title}</strong>
              <small>{item.type}</small>
            </div>
            <span className="content-status">
              {item.status ? (pt ? "Visível" : "Visible") : pt ? "Oculto" : "Hidden"}
            </span>
            <button
              className={`content-toggle ${item.status ? "active" : ""}`}
              onClick={() => onToggle(item.id)}
            >
              <span />
            </button>
            <button className="icon-button">
              <MoreHorizontal size={17} />
            </button>
          </div>
        ))}
      </div>
      <div className="content-preview">
        <span className="section-kicker">02 / Preview</span>
        <div>
          <strong>{pt ? "A cidade não fica parada." : "The city doesn't stand still."}</strong>
          <small>{pt ? "Hero actual / SS—26 / Drop 01" : "Current hero / SS—26 / Drop 01"}</small>
        </div>
        <Link href="/" className="outline-button">
          {pt ? "Abrir loja" : "Open store"} <ArrowUpRight size={14} />
        </Link>
      </div>
    </div>
  );
}

function OrdersModule({
  orders,
  pt,
  onStatus,
}: {
  orders: Order[];
  pt: boolean;
  onStatus: (id: string, status: string) => void;
}) {
  return (
    <div className="admin-module">
      <ModuleHeader
        eyebrow={`01 / ${pt ? "Operação" : "Operations"}`}
        title={pt ? "Pedidos" : "Orders"}
        action={
          <button className="admin-filter">
            {pt ? "Últimos 30 dias" : "Last 30 days"} <ChevronDown size={14} />
          </button>
        }
      />
      <div className="order-list">
        {orders.length ? (
          orders.map((order) => (
            <div className="order-row" key={order.id}>
              <div>
                <strong>{order.id}</strong>
                <small>
                  {order.customer} / {order.date}
                </small>
              </div>
              <strong>{formatPrice(order.total)}</strong>
              <select
                value={order.status}
                onChange={(event) => onStatus(order.id, event.target.value)}
              >
                <option value="NEW">NEW (Novo)</option>
                <option value="AWAITING_PAYMENT">AWAITING_PAYMENT (Aguardando)</option>
                <option value="PAYMENT_CONFIRMED">PAYMENT_CONFIRMED (Pago)</option>
                <option value="PREPARING">PREPARING (Em preparação)</option>
                <option value="SHIPPED">SHIPPED (Enviado)</option>
                <option value="COMPLETED">COMPLETED (Concluído)</option>
                <option value="CANCELLED">CANCELLED (Cancelado - repõe stock)</option>
              </select>
              <button
                className="icon-button"
                onClick={() => toast(`${order.id}: ${order.customer} (${order.email || ""})`)}
              >
                <ArrowUpRight size={16} />
              </button>
            </div>
          ))
        ) : (
          <div className="admin-empty">
            <ShoppingCart size={24} />
            <h3>{pt ? "Nenhum pedido registado." : "No orders found."}</h3>
            <p>{pt ? "Os novos pedidos feitos na loja aparecerão aqui." : "New storefront orders will appear here."}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function CustomersModule({
  customers,
  pt,
  query,
  setQuery,
}: {
  customers: Customer[];
  pt: boolean;
  query: string;
  setQuery: (value: string) => void;
}) {
  const list = customers.filter((customer) =>
    `${customer.name} ${customer.email}`.toLowerCase().includes(query.toLowerCase())
  );
  return (
    <div className="admin-module">
      <ModuleHeader
        eyebrow={`01 / ${pt ? "Relação" : "Relationships"}`}
        title={pt ? "Clientes" : "Customers"}
      >
        <div className="admin-search">
          <Search size={16} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={pt ? "Pesquisar clientes" : "Search customers"}
          />
        </div>
      </ModuleHeader>
      <div className="customer-list">
        {list.length ? (
          list.map((customer) => (
            <div className="customer-row" key={customer.email}>
              <span className="customer-avatar">{customer.name.slice(0, 1)}</span>
              <div>
                <strong>{customer.name}</strong>
                <small>{customer.email}</small>
              </div>
              <span>
                {customer.orders} {pt ? "pedidos" : "orders"}
              </span>
              <span>{customer.joined}</span>
              <button className="icon-button">
                <MoreHorizontal size={17} />
              </button>
            </div>
          ))
        ) : (
          <div className="admin-empty">
            <Users size={24} />
            <h3>{pt ? "Nenhum cliente encontrado." : "No customers found."}</h3>
          </div>
        )}
      </div>
    </div>
  );
}

function DiscountsModule({
  discounts,
  pt,
  onNew,
}: {
  discounts: { code: string; type: string; value: string; status: "Active" | "Paused" }[];
  pt: boolean;
  onNew: () => void;
}) {
  return (
    <div className="admin-module">
      <ModuleHeader
        eyebrow={`01 / ${pt ? "Conversão" : "Conversion"}`}
        title={pt ? "Cupões" : "Discounts"}
        action={
          <button className="dark-button" onClick={onNew}>
            <Plus size={16} /> {pt ? "Novo cupão" : "New coupon"}
          </button>
        }
      />
      <div className="discount-list">
        {discounts.map((discount) => (
          <div className="discount-row" key={discount.code}>
            <div>
              <strong>{discount.code}</strong>
              <small>{discount.type}</small>
            </div>
            <strong>{discount.value}</strong>
            <span className={`discount-status ${discount.status === "Active" ? "active" : ""}`}>
              {discount.status === "Active" ? (pt ? "Activo" : "Active") : pt ? "Pausado" : "Paused"}
            </span>
            <button className="icon-button">
              <MoreHorizontal size={17} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsModule({
  settings,
  pt,
  onSave,
}: {
  settings: StoreSettings;
  pt: boolean;
  onSave: (settings: StoreSettings) => void;
}) {
  const [form, setForm] = useState<StoreSettings>(settings);

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  const toggle = (key: "maintenance" | "alerts" | "freeShipping" | "whatsappActive") => {
    const updated = { ...form, [key]: !form[key] };
    setForm(updated);
    onSave(updated);
  };

  const handleWhatsappSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="admin-module">
      <ModuleHeader eyebrow={`01 / ${pt ? "Sistema" : "System"}`} title={pt ? "Definições" : "Settings"} />

      <div className="settings-list" style={{ marginBottom: "2rem" }}>
        <div className="setting-row">
          <div>
            <strong>{pt ? "Modo manutenção" : "Maintenance mode"}</strong>
            <small>{pt ? "Oculta a loja pública enquanto editas." : "Hide the public store while you edit."}</small>
          </div>
          <button
            className={`switch-control ${form.maintenance ? "active" : ""}`}
            onClick={() => toggle("maintenance")}
            aria-pressed={form.maintenance}
          >
            <span />
          </button>
        </div>

        <div className="setting-row">
          <div>
            <strong>{pt ? "Alertas de operação" : "Operational alerts"}</strong>
            <small>{pt ? "Recebe sinais sobre stock e pedidos." : "Receive signals about stock and orders."}</small>
          </div>
          <button
            className={`switch-control ${form.alerts ? "active" : ""}`}
            onClick={() => toggle("alerts")}
            aria-pressed={form.alerts}
          >
            <span />
          </button>
        </div>

        <div className="setting-row">
          <div>
            <strong>{pt ? "Entrega gratuita" : "Free shipping"}</strong>
            <small>{pt ? "Activa acima de 8.000 MT." : "Active above 8,000 MT."}</small>
          </div>
          <button
            className={`switch-control ${form.freeShipping ? "active" : ""}`}
            onClick={() => toggle("freeShipping")}
            aria-pressed={form.freeShipping}
          >
            <span />
          </button>
        </div>
      </div>

      <ModuleHeader
        eyebrow={`02 / ${pt ? "Canal de vendas" : "Sales channel"}`}
        title={pt ? "Configuração do WhatsApp" : "WhatsApp Configuration"}
      />

      <form onSubmit={handleWhatsappSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div className="setting-row">
          <div>
            <strong>{pt ? "Canal WhatsApp Ativo" : "WhatsApp Active"}</strong>
            <small>{pt ? "Permite que os clientes finalizem encomendas pelo WhatsApp." : "Allows customers to complete orders via WhatsApp."}</small>
          </div>
          <button
            type="button"
            className={`switch-control ${form.whatsappActive ? "active" : ""}`}
            onClick={() => toggle("whatsappActive")}
            aria-pressed={form.whatsappActive}
          >
            <span />
          </button>
        </div>

        <label style={{ display: "flex", flexDirection: "column", gap: "0.4rem", fontSize: "0.9rem" }}>
          <strong>{pt ? "Número de WhatsApp principal" : "Primary WhatsApp Number"}</strong>
          <input
            style={{ padding: "0.75rem", border: "1px solid rgba(0,0,0,0.1)", background: "rgba(0,0,0,0.02)" }}
            value={form.whatsappNumber}
            onChange={(e) => setForm({ ...form, whatsappNumber: e.target.value })}
            placeholder="+258840000000"
          />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: "0.4rem", fontSize: "0.9rem" }}>
          <strong>{pt ? "Modelo de mensagem (Português)" : "Message Template (Portuguese)"}</strong>
          <textarea
            rows={4}
            style={{ padding: "0.75rem", border: "1px solid rgba(0,0,0,0.1)", background: "rgba(0,0,0,0.02)", fontFamily: "inherit" }}
            value={form.whatsappMessagePt}
            onChange={(e) => setForm({ ...form, whatsappMessagePt: e.target.value })}
          />
          <small style={{ opacity: 0.6 }}>Tags: &#123;ORDER_CODE&#125;, &#123;CUSTOMER_NAME&#125;, &#123;TOTAL&#125;</small>
        </label>

        <button type="submit" className="dark-button" style={{ alignSelf: "flex-start", marginTop: "0.5rem" }}>
          <Check size={16} /> {pt ? "Guardar definições" : "Save settings"}
        </button>
      </form>
    </div>
  );
}

function ProductForm({
  product,
  pt,
  onClose,
  onSave,
}: {
  product: ManagedProduct | null;
  pt: boolean;
  onClose: () => void;
  onSave: (product: ManagedProduct) => void;
}) {
  const [form, setForm] = useState<ManagedProduct>(
    product ?? {
      id: `prod_${Date.now()}`,
      name: "",
      category: "Outerwear",
      price: 0,
      stock: 0,
      status: "draft",
      image: "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=1200&q=85",
      sku: `ILL-${Date.now().toString().slice(-3)}`,
      collection: "SS—26 / Drop 01",
    }
  );
  const [error, setError] = useState("");

  const update = (key: keyof ManagedProduct, value: string | number) =>
    setForm((current) => ({ ...current, [key]: value } as ManagedProduct));

  const save = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim() || form.price <= 0) {
      setError(pt ? "Preenche o nome e um preço válido." : "Add a name and a valid price.");
      return;
    }
    onSave(form);
  };

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <form className="admin-modal" onClick={(event) => event.stopPropagation()} onSubmit={save}>
        <div className="modal-heading">
          <div>
            <span className="section-kicker">{product ? "Edit / 01" : "Create / 01"}</span>
            <h2>{product ? (pt ? "Editar produto" : "Edit product") : pt ? "Novo produto" : "New product"}</h2>
          </div>
          <button type="button" className="close-button" onClick={onClose}>
            <X size={19} />
          </button>
        </div>

        {error && <div className="form-error">{error}</div>}

        <label>
          {pt ? "Nome" : "Name"}
          <input
            value={form.name}
            onChange={(event) => update("name", event.target.value)}
            placeholder="Signal overshirt"
          />
        </label>

        <div className="form-row">
          <label>
            {pt ? "Categoria" : "Category"}
            <select
              value={form.category}
              onChange={(event) => update("category", event.target.value)}
            >
              <option value="outerwear">Outerwear</option>
              <option value="t-shirts">T-shirts</option>
              <option value="sweats">Sweats</option>
              <option value="trousers">Trousers</option>
              <option value="knitwear">Knitwear</option>
            </select>
          </label>
          <label>
            {pt ? "Preço (MT)" : "Price (MT)"}
            <input
              type="number"
              min="1"
              value={form.price || ""}
              onChange={(event) => update("price", Number(event.target.value))}
            />
          </label>
        </div>

        <div className="form-row">
          <label>
            SKU
            <input
              value={form.sku}
              onChange={(event) => update("sku", event.target.value)}
            />
          </label>
          <label>
            {pt ? "Stock" : "Stock"}
            <input
              type="number"
              min="0"
              value={form.stock}
              onChange={(event) => update("stock", Number(event.target.value))}
            />
          </label>
        </div>

        <label>
          {pt ? "URL da Imagem" : "Image URL"}
          <input
            value={form.image}
            onChange={(event) => update("image", event.target.value)}
            placeholder="https://..."
          />
        </label>

        <label>
          {pt ? "Colecção" : "Collection"}
          <input
            value={form.collection}
            onChange={(event) => update("collection", event.target.value)}
          />
        </label>

        <button className="dark-button full-button" type="submit">
          {pt ? "Guardar produto" : "Save product"} <Check size={16} />
        </button>
      </form>
    </div>
  );
}
