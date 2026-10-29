import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import PaymentService from "../services/PaymentServices";
import { PAYMENT_RETURN_KEY } from "../components/Payment/PaymentModal";
import { LoadingState, btnPrimary } from "../components/UI/PageKit";
import { naira } from "../shared/policyFormat";

// Paystack redirects here with ?reference=...&trxref=... after a card payment.
const PaymentCallback = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const reference = params.get("reference") || params.get("trxref");
  const [state, setState] = useState({ phase: "verifying", message: "" });
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return; // StrictMode runs effects twice
    started.current = true;

    if (!reference) {
      setState({ phase: "failed", message: "No payment reference was found." });
      return;
    }

    PaymentService.verify(reference)
      .then((res) => setState({ phase: "success", message: res.message, res }))
      .catch((e) => setState({ phase: "failed", message: e.message }));
  }, [reference]);

  const goBack = () => {
    const path = sessionStorage.getItem(PAYMENT_RETURN_KEY) || "/";
    sessionStorage.removeItem(PAYMENT_RETURN_KEY);
    navigate(path, { replace: true });
  };

  const { phase, message, res } = state;

  if (phase === "verifying") {
    return (
      <div className="min-h-screen bg-slate-50">
        <LoadingState label="Confirming your payment…" />
      </div>
    );
  }

  const ok = phase === "success";
  const Icon = ok ? CheckCircle2 : AlertCircle;
  const isFunding = res?.purpose === "WalletFunding";

  return (
    <div className="grid min-h-screen place-items-center bg-slate-50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <span
          className={`mx-auto grid h-14 w-14 place-items-center rounded-full ${
            ok ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
          }`}
        >
          <Icon className="h-7 w-7" />
        </span>
        <h1 className="mt-4 text-xl font-bold tracking-tight text-slate-900">
          {ok ? "Payment successful" : "Payment not completed"}
        </h1>
        <p className="mt-1.5 text-sm text-slate-600">
          {ok
            ? isFunding
              ? `Your wallet has been funded${res?.amount ? ` with ${naira(res.amount)}` : ""}.`
              : `Certificate ${res?.certNo || ""} has been paid for.`
            : message}
        </p>
        {ok && res?.walletBalance != null && isFunding && (
          <p className="mt-1 text-sm text-slate-500">New balance: {naira(res.walletBalance)}</p>
        )}
        <button type="button" onClick={goBack} className={`${btnPrimary} mt-6`}>
          Continue
        </button>
      </div>
    </div>
  );
};

export default PaymentCallback;
