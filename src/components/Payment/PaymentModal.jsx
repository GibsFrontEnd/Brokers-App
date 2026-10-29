import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { CheckCircle2, CreditCard, Loader2, Wallet } from "lucide-react";
import PaymentService from "../../services/PaymentServices";
import useProfileEmail, { isEmail } from "./useProfileEmail";
import { Field, Modal, Notice, btnPrimary, btnSecondary, inputCls } from "../UI/PageKit";
import { naira } from "../../shared/policyFormat";

export const PAYMENT_RETURN_KEY = "paymentReturnPath";

const METHODS = [
  {
    key: "card",
    icon: CreditCard,
    title: "Pay online",
    text: "Card or bank transfer through Paystack.",
  },
  {
    key: "wallet",
    icon: Wallet,
    title: "Wallet",
    text: null, // filled in with the balance
  },
];

/**
 * Shown right after a certificate is saved. Lets the user pay by card
 * (Paystack) or from their wallet, or pay later.
 *
 * onClose(paid) runs when the dialog should go away; paid is true only when
 * the certificate was paid here (card payments leave the page for Paystack).
 */
const PaymentModal = ({ certNo, email, returnPath, onClose }) => {
  const { pathname } = useLocation();
  const walletPath = pathname.startsWith("/client") ? "/client/wallet" : "/brokers/wallet";

  const [status, setStatus] = useState(null);
  const [method, setMethod] = useState("card");
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const [paid, setPaid] = useState(false);

  // Paystack needs an email. Start with the profile email; the user can change it for this payment.
  const profileEmail = useProfileEmail();
  const defaultEmail = profileEmail || (isEmail(email) ? email.trim() : "");
  const [typedEmail, setTypedEmail] = useState(null); // null until the user edits the field
  const payerEmail = (typedEmail ?? defaultEmail).trim();

  useEffect(() => {
    let cancelled = false;
    PaymentService.getCertificateStatus(certNo)
      .then((s) => !cancelled && setStatus(s))
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [certNo]);

  const amount = status?.amount || 0;
  const balance = status?.walletBalance || 0;
  const alreadyPaid = status?.status === "Paid";
  const insufficient = method === "wallet" && balance < amount;

  const handlePay = async () => {
    setPaying(true);
    setError("");
    try {
      if (method === "card") {
        if (!isEmail(payerEmail)) {
          setError("Enter a valid email address for the payment receipt.");
          return;
        }
        const res = await PaymentService.payCertificateByCard(certNo, payerEmail);
        sessionStorage.setItem(PAYMENT_RETURN_KEY, returnPath || "/");
        window.location.href = res.authorizationUrl;
        return; // leaving the page for Paystack
      }
      await PaymentService.payCertificateByWallet(certNo);
      setPaid(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setPaying(false);
    }
  };

  if (paid || alreadyPaid) {
    return (
      <Modal title={paid ? "Payment successful" : "Already paid"} onClose={() => onClose(true)} size="max-w-md">
        <div className="px-6 py-8 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-6 w-6" />
          </span>
          <p className="mt-4 font-semibold text-slate-900">Certificate {certNo} is paid for.</p>
          <button type="button" onClick={() => onClose(true)} className={`${btnPrimary} mt-6`}>
            Done
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      title="Pay for certificate"
      subtitle={`Certificate ${certNo} has been saved`}
      onClose={() => !paying && onClose(false)}
      size="max-w-md"
    >
      <div className="space-y-5 overflow-y-auto px-6 py-5">
        <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
          <span className="text-sm text-slate-600">Amount due</span>
          <span className="text-xl font-bold tracking-tight text-slate-900">
            {loading ? "…" : naira(amount) || "₦0"}
          </span>
        </div>

        <fieldset className="space-y-2.5" disabled={loading || paying}>
          <legend className="sr-only">Payment method</legend>
          {METHODS.map((m) => {
            const selected = method === m.key;
            return (
              <label
                key={m.key}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 transition ${
                  selected
                    ? "border-[#155dfd] bg-blue-50/60 ring-4 ring-blue-100"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <input
                  type="radio"
                  name="payMethod"
                  checked={selected}
                  onChange={() => setMethod(m.key)}
                  className="sr-only"
                />
                <span
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
                    selected ? "bg-[#155dfd] text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  <m.icon className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-slate-900">{m.title}</span>
                  <span className="block text-xs text-slate-500">
                    {m.text ?? `Balance: ${naira(balance) || "₦0"}`}
                  </span>
                </span>
              </label>
            );
          })}
        </fieldset>

        {method === "card" && (
          <Field label="Email for the receipt">
            <input
              type="email"
              value={typedEmail ?? defaultEmail}
              onChange={(e) => setTypedEmail(e.target.value)}
              placeholder="you@example.com"
              className={inputCls}
            />
          </Field>
        )}

        {insufficient && !loading && (
          <Notice tone="error">
            Your wallet balance is not enough.{" "}
            <Link to={walletPath} className="font-semibold underline">
              Fund your wallet
            </Link>{" "}
            or pay online.
          </Notice>
        )}
        {error && <Notice tone="error">{error}</Notice>}
      </div>

      <div className="flex shrink-0 justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-6 py-4">
        <button type="button" onClick={() => onClose(false)} disabled={paying} className={btnSecondary}>
          Pay later
        </button>
        <button
          type="button"
          onClick={handlePay}
          disabled={paying || loading || !amount || insufficient}
          className={btnPrimary}
        >
          {paying && <Loader2 className="h-4 w-4 animate-spin" />}
          {paying ? "Processing…" : `Pay ${naira(amount) || ""}`}
        </button>
      </div>
    </Modal>
  );
};

export default PaymentModal;
