/* Concrete Editorial: checkout com criação real de pedido no servidor, código único PED-XXXXXX e encaminhamento para WhatsApp. */
import { useState, useEffect } from "react";
import { ArrowLeft, ArrowUpRight, Check, MessageSquare, ShieldCheck, AlertCircle } from "lucide-react";
import { Link, useLocation } from "wouter";
import { CartDrawer, Header } from "@/components/StorefrontShell";
import { formatPrice } from "@/lib/storeData";
import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";

type CreatedOrder = {
  id: string;
  orderCode: string;
  total: number;
  subtotal: number;
  customerName: string;
  customerEmail: string;
  whatsappUrl: string;
  whatsappActive: boolean;
};

export default function Checkout() {
  const { lines, subtotal, setCartOpen, clearCart } = useCart();
  const { t, locale } = useLanguage();
  const { user } = useAuth();
  const pt = locale === "pt";
  const [, setLocation] = useLocation();

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("Maputo");
  const [postalCode, setPostalCode] = useState("");
  const [notes, setNotes] = useState("");

  const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [createdOrder, setCreatedOrder] = useState<CreatedOrder | null>(null);

  useEffect(() => {
    if (user) {
      if (!name) setName(user.name);
      if (!email) setEmail(user.email);
    }
  }, [user]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (lines.length === 0) return;

    setStatus("processing");
    setErrorMessage("");

    try {
      const payload = {
        customerName: name.trim(),
        customerEmail: email.trim(),
        customerPhone: phone.trim(),
        deliveryAddress: address.trim(),
        city: city.trim(),
        postalCode: postalCode.trim(),
        notes: notes.trim(),
        items: lines.map((l) => ({
          slug: l.product.slug,
          size: l.size,
          quantity: l.quantity,
        })),
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setErrorMessage(
          data.error || (pt ? "Não foi possível criar o pedido. Verifica os dados." : "Could not create order. Please check details.")
        );
        return;
      }

      setCreatedOrder(data.order);
      setStatus("success");
      clearCart();
    } catch {
      setStatus("error");
      setErrorMessage(pt ? "Erro de conexão ao criar pedido." : "Network error creating order.");
    }
  };

  if (status === "success" && createdOrder) {
    return (
      <div className="storefront-page light-page">
        <Header />
        <CartDrawer />
        <main className="checkout-page page-pad">
          <div className="checkout-success">
            <span className="success-mark">
              <Check size={24} />
            </span>
            <span className="section-kicker">
              {pt ? "Pedido criado com sucesso" : "Order successfully created"}
            </span>
            <h1>
              {createdOrder.orderCode}
              <br />
              <i>See you outside.</i>
            </h1>
            <p>
              {pt
                ? `O seu pedido no valor de ${formatPrice(createdOrder.total)} foi reservado no sistema. Finalize agora os detalhes de entrega e pagamento com a nossa equipa pelo WhatsApp.`
                : `Your order totaling ${formatPrice(createdOrder.total)} has been reserved in our system. Finalize delivery and payment with our team via WhatsApp.`}
            </p>

            <div className="order-code-box">
              <span className="code-label">{pt ? "Código de referência:" : "Reference code:"}</span>
              <strong className="code-value">{createdOrder.orderCode}</strong>
            </div>

            {createdOrder.whatsappActive ? (
              <a
                href={createdOrder.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="dark-button full-button"
                style={{ justifyContent: "center", textDecoration: "none" }}
              >
                <MessageSquare size={17} />
                {pt ? "Finalizar pelo WhatsApp" : "Finalize on WhatsApp"}
                <ArrowUpRight size={16} />
              </a>
            ) : (
              <div className="checkout-notice">
                {pt
                  ? "O atendimento via WhatsApp está temporariamente indisponível. Guarde o seu código de pedido."
                  : "WhatsApp customer service is temporarily unavailable. Please keep your order code."}
              </div>
            )}

            <div style={{ marginTop: "1rem" }}>
              <Link href="/shop" className="outline-button">
                {pt ? "Continuar a explorar" : "Continue exploring"} <ArrowUpRight size={16} />
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="storefront-page light-page">
      <Header />
      <CartDrawer />
      <main className="checkout-page page-pad">
        <div className="checkout-top">
          <Link href="/shop" className="back-link">
            <ArrowLeft size={15} /> {t("back")}
          </Link>
          <span className="checkout-steps">
            <b>01</b> {pt ? "Dados de entrega" : "Delivery details"} <span />{" "}
            <b className="muted-step">02</b> {pt ? "WhatsApp" : "WhatsApp"}
          </span>
        </div>

        <div className="checkout-grid">
          <form className="checkout-form" onSubmit={submit}>
            <SectionHeading number="01" title={pt ? "Os teus dados" : "Your details"} />

            <div className="form-row">
              <label>
                {pt ? "Nome completo" : "Full name"}
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={pt ? "Ex: Amélia Mondlane" : "Ex: Alex Mercer"}
                />
              </label>
              <label>
                {pt ? "Telefone / WhatsApp" : "Phone / WhatsApp"}
                <input
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+258 84 000 0000"
                />
              </label>
            </div>

            <label>
              {pt ? "Endereço de e-mail" : "Email address"}
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
              />
            </label>

            <label>
              {pt ? "Endereço de entrega" : "Delivery address"}
              <input
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={pt ? "Rua, Bairro e Número da porta" : "Street and apartment/door"}
              />
            </label>

            <div className="form-row">
              <label>
                {pt ? "Cidade" : "City"}
                <input
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Maputo"
                />
              </label>
              <label>
                {pt ? "Código postal (opcional)" : "Postal code (optional)"}
                <input
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="1100"
                />
              </label>
            </div>

            <label>
              {pt ? "Notas para a entrega (opcional)" : "Delivery notes (optional)"}
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={pt ? "Ex: Ponto de referência, melhor horário" : "Ex: Reference landmark"}
              />
            </label>

            <SectionHeading number="02" title={pt ? "Finalização do pedido" : "Order completion"} />

            <div className="checkout-method-box">
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <MessageSquare size={20} />
                <div>
                  <strong>{pt ? "Atendimento & Pagamento via WhatsApp" : "WhatsApp Service & Payment"}</strong>
                  <p style={{ margin: "0.25rem 0 0", fontSize: "0.85rem", opacity: 0.8 }}>
                    {pt
                      ? "O stock é reservado agora. Você receberá um código único para coordenar pagamento e entrega diretamente no WhatsApp."
                      : "Stock is reserved now. You will receive a unique code to coordinate payment and delivery on WhatsApp."}
                  </p>
                </div>
              </div>
            </div>

            <p className="demo-payment-note">
              <ShieldCheck size={14} />{" "}
              {pt
                ? "Nenhum pagamento com cartão é cobrado agora. Pagamento por M-Pesa / Emola ou transferência após validação no WhatsApp."
                : "No card payment required online. Settle via mobile money or wire transfer on WhatsApp."}
            </p>

            {status === "error" && (
              <div className="checkout-error" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <AlertCircle size={16} />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              className="dark-button full-button"
              type="submit"
              disabled={status === "processing" || lines.length === 0}
            >
              {status === "processing"
                ? (pt ? "A validar stock e a criar pedido..." : "Validating stock & creating order...")
                : (pt ? "Confirmar pedido & Gerar WhatsApp" : "Confirm order & Generate WhatsApp")}{" "}
              <ArrowUpRight size={16} />
            </button>
          </form>

          <aside className="checkout-summary">
            <div className="summary-label">
              <span>{pt ? "Resumo" : "Summary"}</span>
              <span>{lines.length} {pt ? "itens" : "items"}</span>
            </div>

            {lines.length === 0 ? (
              <div className="checkout-empty">
                <p>{t("emptyBag")}</p>
                <button
                  type="button"
                  className="text-link-button"
                  onClick={() => {
                    setCartOpen(false);
                    setLocation("/shop");
                  }}
                >
                  {t("explore")} <ArrowUpRight size={16} />
                </button>
              </div>
            ) : (
              <>
                {lines.map((line) => (
                  <div className="summary-line" key={`${line.product.slug}-${line.size}`}>
                    <img src={line.product.image} alt={line.product.name} />
                    <div>
                      <strong>{line.product.name}</strong>
                      <span>
                        {line.size} / {pt ? "Qtd" : "Qty"} {line.quantity}
                      </span>
                    </div>
                    <b>
                      {formatPrice((line.product.promoPrice ?? line.product.price) * line.quantity)}
                    </b>
                  </div>
                ))}
                <div className="summary-total">
                  <span>{t("subtotal")}</span>
                  <strong>{formatPrice(subtotal)}</strong>
                </div>
              </>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}

function SectionHeading({ number, title }: { number: string; title: string }) {
  return (
    <div className="checkout-heading">
      <span>{number}</span>
      <h2>{title}</h2>
    </div>
  );
}
