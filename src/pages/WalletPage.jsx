import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { ArrowDownLeft, ArrowUpRight, Loader2, Receipt, Wallet } from "lucide-react";
import PaymentService from "../services/PaymentServices";
import useProfileEmail, { isEmail } from "../components/Payment/useProfileEmail";
import { PAYMENT_RETURN_KEY } from "../components/Payment/PaymentModal";
import {
  EmptyState,
  Field,
  LoadingState,
  Notice,
  PageHeader,
  StatTile,
  btnPrimary,
  inputCls,
} from "../components/UI/PageKit";
import { naira } from "../shared/policyFormat";

const QUICK_AMOUNTS = [5000, 10000, 20000, 50000];

// The API stores UTC without a zone marker.
const formatWhen = (value) => {
  const d = new Date(/[zZ]|[+-]\d\d:\d\d$/.test(value) ? value : `${value}Z`);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

const WalletPage = () => {
  const { pathname } = useLocation();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [funding, setFunding] = useState(false);
  const [error, setError] = useState("");
  // Paystack needs an email. Start with the profile email; the user can change it for this payment.
  const profileEmail = useProfileEmail();
  const [typedEmail, setTypedEmail] = useState(null); // null until the user edits the field
  const email = typedEmail ?? profileEmail;

  const load = useCallback(async () => {
    try {
      const [w, t] = await Promise.all([PaymentService.getWallet(), PaymentService.getWalletTransactions()]);
      setBalance(w.balance);
      setTransactions(t);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleFund = async (e) => {
    e.preventDefault();
    const value = parseFloat(amount);
    if (!value || value < 100) {
      setError("Enter an amount of at least ₦100.");
      return;
    }
    const payerEmail = email.trim();
    if (!isEmail(payerEmail)) {
      setError("Enter a valid email address for the payment receipt.");
      return;
    }
    setFunding(true);
    setError("");
    try {
      const res = await PaymentService.fundWallet(value, payerEmail);
      sessionStorage.setItem(PAYMENT_RETURN_KEY, pathname);
      window.location.href = res.authorizationUrl;
    } catch (err) {
      setError(err.message);
      setFunding(false);
    }
  };

  if (loading) return <LoadingState label="Loading your wallet…" />;

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <PageHeader title="Wallet" description="Fund your wallet to pay for certificates without entering card details each time." />

      {error && <Notice tone="error" onClose={() => setError("")}>{error}</Notice>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <div className="space-y-6">
          <StatTile label="Available balance" value={naira(balance) || "₦0"} icon={Wallet} hint="Spendable on certificates" />

          <form onSubmit={handleFund} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">Add money</h2>
            <Field label="Amount (₦)">
              <input
                type="number"
                min="100"
                step="0.01"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 10000"
                className={inputCls}
              />
            </Field>
            <Field label="Email for the receipt">
              <input
                type="email"
                value={email}
                onChange={(e) => setTypedEmail(e.target.value)}
                placeholder="you@example.com"
                className={inputCls}
              />
            </Field>
            <div className="flex flex-wrap gap-2">
              {QUICK_AMOUNTS.map((a) => (
                <button
                  type="button"
                  key={a}
                  onClick={() => setAmount(String(a))}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 transition hover:border-[#155dfd] hover:text-[#155dfd]"
                >
                  {naira(a)}
                </button>
              ))}
            </div>
            <button type="submit" disabled={funding} className={`${btnPrimary} w-full`}>
              {funding && <Loader2 className="h-4 w-4 animate-spin" />}
              {funding ? "Redirecting to Paystack…" : "Fund wallet"}
            </button>
            <p className="text-xs text-slate-500">You will be taken to Paystack to pay by card or bank transfer.</p>
          </form>
        </div>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <h2 className="border-b border-slate-100 px-5 py-3.5 text-sm font-semibold text-slate-900">Transactions</h2>
          {transactions.length === 0 ? (
            <EmptyState icon={Receipt} title="No transactions yet" text="Top-ups and certificate payments will show up here." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {transactions.map((t) => {
                const credit = t.type === "Credit";
                const Icon = credit ? ArrowDownLeft : ArrowUpRight;
                return (
                  <li key={t.id} className="flex items-center gap-3 px-5 py-3.5">
                    <span
                      className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${
                        credit ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                      }`}
                    >
                      <Icon className="h-[18px] w-[18px]" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">{t.description}</p>
                      <p className="text-xs text-slate-500">{formatWhen(t.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${credit ? "text-emerald-700" : "text-rose-700"}`}>
                        {credit ? "+" : "−"}
                        {naira(t.amount)}
                      </p>
                      <p className="text-xs text-slate-500">Balance {naira(t.balanceAfter)}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
};

export default WalletPage;
