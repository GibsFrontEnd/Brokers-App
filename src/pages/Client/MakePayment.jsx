// Paying for a proposal. Not connected to a payment service yet, so this is a safe preview: it shows the
// amount and the ways to pay, collects no card details and never says a payment went through.
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, Building, CreditCard, Info, Smartphone, UserRound } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { DetailCard, DetailRow, Notice, PageHeader, btnPrimary, btnSecondary } from "../../components/UI/PageKit";

const METHODS = [
  { value: "card", label: "Debit or credit card", icon: CreditCard, text: "You will be taken to a secure card page to pay." },
  { value: "bank", label: "Bank transfer", icon: Building, text: "You will be given the account details to transfer to." },
  { value: "ussd", label: "USSD", icon: Smartphone, text: "You will get a code to dial on your phone." },
];

const MakePayment = () => {
  const { state, pathname } = useLocation();
  const { user } = useAuth();
  const [method, setMethod] = useState("");
  const [tried, setTried] = useState(false);

  // Get payment details from navigation state
  const amount = state?.amount || "24,000.00";
  // The proposal pages live under /admin/client (admin) and /client (sub agents).
  const base = pathname.startsWith("/admin") ? "/admin/client" : "/client";
  const chosen = METHODS.find((m) => m.value === method);

  return (
    <div className="space-y-6">
      <div>
        <Link to={`${base}/add-proposal`} className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" />
          Back to the proposal
        </Link>
        <PageHeader title="Make payment" description="Pay the premium for this proposal." />
      </div>

      <div className="flex items-start gap-2.5 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <span>Online payment isn't available yet. Nothing is charged on this page.</span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-6">
          {/* Payment method */}
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
              <h2 className="text-base font-semibold text-slate-900">How would you like to pay?</h2>
            </div>
            <div role="radiogroup" aria-label="Payment method" className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-3 sm:p-6">
              {METHODS.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  role="radio"
                  aria-checked={method === m.value}
                  onClick={() => {
                    setMethod(m.value);
                    setTried(false);
                  }}
                  className={`flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition ${
                    method === m.value ? "border-[#155dfd] bg-blue-50/60 ring-2 ring-blue-100" : "border-slate-200 hover:border-blue-200 hover:bg-slate-50"
                  }`}
                >
                  <span className={`grid h-9 w-9 place-items-center rounded-lg ${method === m.value ? "bg-[#155dfd] text-white" : "bg-slate-100 text-slate-600"}`}>
                    <m.icon className="h-4 w-4" />
                  </span>
                  <span className="text-sm font-semibold text-slate-900">{m.label}</span>
                </button>
              ))}
            </div>
            {chosen && <p className="border-t border-slate-100 px-5 py-3 text-sm text-slate-600 sm:px-6">{chosen.text}</p>}
          </section>

          <DetailCard icon={UserRound} title="Payer">
            <DetailRow label="Name" value={user?.username} />
            <DetailRow label="Email" value={user?.email} />
          </DetailCard>
        </div>

        {/* Amount and action */}
        <aside className="space-y-4">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Amount due</p>
            <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">₦{amount}</p>
            <button type="button" onClick={() => setTried(true)} disabled={!method} className={`${btnPrimary} mt-5 w-full`}>
              <CreditCard className="h-4 w-4" />
              Continue to payment
            </button>
            <Link to={`${base}/business-proposals`} className={`${btnSecondary} mt-2 w-full`}>
              Back to proposals
            </Link>
          </section>
          {tried && (
            <Notice tone="error">
              Payments can't be taken online yet, so nothing was charged. Please pay through your usual channel for now.
            </Notice>
          )}
        </aside>
      </div>
    </div>
  );
};

export default MakePayment;
