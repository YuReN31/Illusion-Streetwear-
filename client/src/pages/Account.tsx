/* Concrete Editorial: conta real de cliente com autenticação, consulta de pedidos próprios e proteção de sessão. */
import { useEffect, useState } from "react";
import { ArrowUpRight, LogOut, PackageCheck, AlertCircle, CheckCircle2, MessageSquare } from "lucide-react";
import { Link } from "wouter";
import { Footer, Header, SectionLabel, CartDrawer, BackToTop } from "@/components/StorefrontShell";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatPrice } from "@/lib/storeData";

type CustomerOrder = {
  id: string;
  orderCode: string;
  total: number;
  status: string;
  createdAt: number;
  whatsappUrl: string;
  items: Array<{
    id: string;
    nameAtPurchase: string;
    sizeAtPurchase: string;
    quantity: number;
    subtotal: number;
    imageAtPurchase: string;
  }>;
};

export default function Account() {
  const { user, login, register, logout, loading } = useAuth();
  const { locale, t } = useLanguage();
  const pt = locale === "pt";

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Orders list for logged-in user
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setOrdersLoading(true);
      fetch("/api/orders/my")
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => setOrders(data))
        .catch(() => setOrders([]))
        .finally(() => setOrdersLoading(false));
    } else {
      setOrders([]);
    }
  }, [user]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setInfoMessage("");
    setSubmitting(true);

    try {
      if (mode === "register") {
        if (!name.trim()) {
          setError(pt ? "Por favor, introduz o teu nome." : "Please enter your name.");
          setSubmitting(false);
          return;
        }
        const res = await register(name, email, password);
        if (!res.success) {
          setError(res.error || (pt ? "Erro ao criar conta." : "Error creating account."));
        }
      } else {
        const res = await login(email, password);
        if (!res.success) {
          setError(res.error || (pt ? "Credenciais inválidas." : "Invalid credentials."));
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = () => {
    setInfoMessage(
      pt
        ? "A recuperação de senha por e-mail será disponibilizada futuramente. Se precisares de ajuda, contacta o nosso suporte via WhatsApp."
        : "Email password recovery will be available in an upcoming release. Please reach out to our WhatsApp support if needed."
    );
  };

  return (
    <div className="storefront-page light-page">
      <Header />
      <CartDrawer />
      <main className="account-page page-pad">
        <div className="account-grid">
          <div className="account-title">
            <SectionLabel index="01">{t("account")}</SectionLabel>
            <h1>
              {user ? (
                <>
                  {t("accountTitle")}
                  <br />
                  {user.name}.
                </>
              ) : (
                <>
                  {t("accountTitle")}
                  <br />
                  <i>{pt ? "Fica perto." : "Stay close."}</i>
                </>
              )}
            </h1>
            {user?.role === "ADMIN" && (
              <div style={{ marginTop: "1rem" }}>
                <Link href="/admin" className="dark-button">
                  {pt ? "Aceder ao Painel Admin" : "Access Admin Panel"} <ArrowUpRight size={15} />
                </Link>
              </div>
            )}
          </div>

          <div className="account-card">
            {loading ? (
              <div style={{ padding: "2rem 0", opacity: 0.6 }}>
                {pt ? "A carregar sessão..." : "Loading session..."}
              </div>
            ) : user ? (
              <div className="account-logged">
                <span className="account-avatar">
                  {user.name.slice(0, 1).toUpperCase()}
                </span>
                <span className="section-kicker">
                  {user.role === "ADMIN" ? "Admin / Operador" : (pt ? "Cliente registado" : "Registered customer")}
                </span>
                <h2>{user.name}</h2>
                <p>{user.email}</p>

                <div className="account-stats">
                  <div>
                    <strong>{String(orders.length).padStart(2, "0")}</strong>
                    <span>{pt ? "Pedidos" : "Orders"}</span>
                  </div>
                  <div>
                    <strong>MZN</strong>
                    <span>{pt ? "Moeda" : "Currency"}</span>
                  </div>
                  <div>
                    <strong>Maputo</strong>
                    <span>{pt ? "Região" : "Region"}</span>
                  </div>
                </div>

                <div style={{ marginTop: "2rem", width: "100%" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <h3 style={{ fontSize: "1.1rem", fontWeight: 600 }}>
                      {pt ? "Os teus pedidos" : "Your orders"}
                    </h3>
                  </div>

                  {ordersLoading ? (
                    <p style={{ fontSize: "0.9rem", opacity: 0.6 }}>
                      {pt ? "A consultar pedidos..." : "Loading orders..."}
                    </p>
                  ) : orders.length === 0 ? (
                    <div style={{ padding: "1.5rem 0", opacity: 0.7, borderTop: "1px solid rgba(0,0,0,0.08)" }}>
                      <p style={{ margin: 0, fontSize: "0.9rem" }}>
                        {pt ? "Ainda não fizeste nenhum pedido." : "You have not placed any orders yet."}
                      </p>
                      <Link href="/shop" className="text-link" style={{ marginTop: "0.5rem", display: "inline-flex" }}>
                        {t("explore")} <ArrowUpRight size={14} />
                      </Link>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                      {orders.map((ord) => (
                        <div
                          key={ord.id}
                          style={{
                            padding: "1rem",
                            border: "1px solid rgba(0,0,0,0.1)",
                            background: "rgba(0,0,0,0.02)",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                            <strong style={{ letterSpacing: "0.05em" }}>{ord.orderCode}</strong>
                            <span
                              style={{
                                fontSize: "0.75rem",
                                padding: "0.2rem 0.6rem",
                                background: "#0d0d0d",
                                color: "#fff",
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                              }}
                            >
                              {ord.status}
                            </span>
                          </div>

                          <div style={{ fontSize: "0.85rem", opacity: 0.7, marginBottom: "0.75rem" }}>
                            {new Date(ord.createdAt).toLocaleDateString("pt-MZ", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}{" "}
                            • {formatPrice(ord.total)}
                          </div>

                          {ord.items && ord.items.length > 0 && (
                            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
                              {ord.items.map((it) => (
                                <div
                                  key={it.id}
                                  style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem" }}
                                >
                                  <img
                                    src={it.imageAtPurchase}
                                    alt=""
                                    style={{ width: "24px", height: "30px", objectFit: "cover" }}
                                  />
                                  <span>
                                    {it.nameAtPurchase} ({it.sizeAtPurchase}) × {it.quantity}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}

                          {ord.whatsappUrl && (
                            <a
                              href={ord.whatsappUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-link"
                              style={{ fontSize: "0.85rem" }}
                            >
                              <MessageSquare size={13} /> {pt ? "Contactar via WhatsApp" : "Contact on WhatsApp"}
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button className="outline-button" onClick={logout} style={{ marginTop: "2rem" }}>
                  <LogOut size={15} /> {t("signOut")}
                </button>
              </div>
            ) : (
              <form className="account-form" onSubmit={handleSubmit}>
                <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem", borderBottom: "1px solid rgba(0,0,0,0.1)", paddingBottom: "0.5rem" }}>
                  <button
                    type="button"
                    onClick={() => { setMode("login"); setError(""); }}
                    style={{
                      background: "none",
                      border: "none",
                      fontWeight: mode === "login" ? 700 : 400,
                      borderBottom: mode === "login" ? "2px solid #0d0d0d" : "none",
                      paddingBottom: "0.25rem",
                      cursor: "pointer",
                      fontSize: "0.95rem",
                    }}
                  >
                    {pt ? "Iniciar sessão" : "Sign in"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMode("register"); setError(""); }}
                    style={{
                      background: "none",
                      border: "none",
                      fontWeight: mode === "register" ? 700 : 400,
                      borderBottom: mode === "register" ? "2px solid #0d0d0d" : "none",
                      paddingBottom: "0.25rem",
                      cursor: "pointer",
                      fontSize: "0.95rem",
                    }}
                  >
                    {pt ? "Criar conta" : "Create account"}
                  </button>
                </div>

                <span className="section-kicker">
                  {mode === "register"
                    ? (pt ? "Novo membro / Registo" : "New member / Register")
                    : (pt ? "Membro existente / Entrada" : "Existing member / Sign in")}
                </span>

                <p>{t("accountIntro")}</p>

                {error && (
                  <div className="checkout-error" style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                    <AlertCircle size={15} />
                    <span>{error}</span>
                  </div>
                )}

                {infoMessage && (
                  <div className="checkout-notice" style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                    <CheckCircle2 size={15} />
                    <span>{infoMessage}</span>
                  </div>
                )}

                {mode === "register" && (
                  <label>
                    {pt ? "Nome completo" : "Full name"}
                    <input
                      required
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder={pt ? "Ex: Amélia Mondlane" : "Ex: Alex Mercer"}
                    />
                  </label>
                )}

                <label>
                  {t("email")}
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@email.com"
                  />
                </label>

                <label>
                  {pt ? "Palavra-passe" : "Password"}
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="••••••••"
                  />
                </label>

                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "0.5rem" }}>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    style={{ background: "none", border: "none", fontSize: "0.8rem", textDecoration: "underline", cursor: "pointer", opacity: 0.7 }}
                  >
                    {pt ? "Esqueceu a senha?" : "Forgot password?"}
                  </button>
                </div>

                <button className="dark-button full-button" type="submit" disabled={submitting}>
                  {submitting
                    ? (pt ? "A processar..." : "Processing...")
                    : (mode === "register" ? (pt ? "Criar conta" : "Create account") : t("continue"))}{" "}
                  <ArrowUpRight size={16} />
                </button>

                <small style={{ marginTop: "1rem", display: "block" }}>
                  {pt
                    ? "Acesso seguro à tua conta. Os teus dados e encomendas ficam associados ao teu perfil."
                    : "Secure access to your account. Your details and orders remain associated with your profile."}
                </small>
              </form>
            )}
          </div>
        </div>

        <section className="account-bottom">
          <span className="section-kicker">New here?</span>
          <Link href="/shop" className="text-link">
            {t("explore")} <ArrowUpRight size={16} />
          </Link>
        </section>
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
}
