import { Link } from "react-router-dom";
import { FileCheck2, KeyRound, Users } from "lucide-react";
import BrandMark from "../BrandMark";

const HIGHLIGHTS = [
  {
    icon: FileCheck2,
    title: "Certificates in minutes",
    text: "Issue Motor, Marine, Compulsory and NIIP certificates and download them at once.",
  },
  {
    icon: KeyRound,
    title: "PIN allocation",
    text: "Allocate certificate PINs to agents and see every balance as it moves.",
  },
  {
    icon: Users,
    title: "Agents and clients",
    text: "Onboard super agents and sub agents and keep each client's records together.",
  },
];

// A light illustration for the left panel: a certificate, a PIN card and an approval check.
const Illustration = () => (
  <svg
    viewBox="0 0 420 220"
    className="h-[clamp(6rem,29vh,20rem)] w-auto max-w-full"
    role="img"
    aria-label="Insurance certificate, PIN card and approval check"
  >
    <ellipse cx="210" cy="205" rx="170" ry="10" fill="#000" opacity="0.25" />
    <path d="M70 70 L120 52 L170 70 V130 C170 160 148 178 120 190 C92 178 70 160 70 130 Z" fill="#3b82f6" />
    <path d="M70 70 L120 52 V190 C92 178 70 160 70 130 Z" fill="#2563eb" />
    <path d="M97 120 l17 17 l30 -34" fill="none" stroke="#fff" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
    {/* Certificate */}
    <rect x="150" y="22" width="120" height="156" rx="12" fill="#fff" />
    <rect x="164" y="38" width="60" height="7" rx="3.5" fill="#0f172a" />
    <rect x="164" y="52" width="36" height="5" rx="2.5" fill="#94a3b8" />
    <rect x="164" y="72" width="92" height="5" rx="2.5" fill="#e2e8f0" />
    <rect x="164" y="84" width="92" height="5" rx="2.5" fill="#e2e8f0" />
    <rect x="164" y="96" width="70" height="5" rx="2.5" fill="#e2e8f0" />
    <rect x="164" y="114" width="92" height="22" rx="6" fill="#dbeafe" />
    <rect x="172" y="122" width="44" height="6" rx="3" fill="#2563eb" />
    <circle cx="246" cy="158" r="10" fill="none" stroke="#f59e0b" strokeWidth="3" />
    <rect x="164" y="155" width="50" height="6" rx="3" fill="#cbd5e1" />
    {/* PIN card */}
    <rect x="262" y="58" width="130" height="100" rx="12" fill="#fff" />
    <rect x="276" y="72" width="44" height="6" rx="3" fill="#0f172a" />
    <rect x="276" y="84" width="28" height="5" rx="2.5" fill="#94a3b8" />
    {[0, 1, 2, 3].map((i) => (
      <rect key={i} x={276 + i * 26} y="102" width="20" height="24" rx="5" fill={i < 3 ? "#dbeafe" : "#f1f5f9"} />
    ))}
    {[0, 1, 2].map((i) => (
      <circle key={i} cx={286 + i * 26} cy="114" r="3.5" fill="#2563eb" />
    ))}
    <rect x="276" y="138" width="80" height="6" rx="3" fill="#e2e8f0" />
    <rect x="276" y="138" width="52" height="6" rx="3" fill="#3b82f6" />
    <circle cx="238" cy="168" r="20" fill="#16a34a" />
    <path d="M229 168 l7 7 l12 -14" fill="none" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/**
 * The branded page shared by the auth screens: the brand panel on the left (large screens)
 * and the page's own content, centred, on the right.
 */
const AuthShell = ({
  blurb = "Sign in to issue certificates, manage PINs and look after your agents and clients.",
  children,
}) => (
  <div className="grid min-h-dvh w-full bg-white lg:h-dvh lg:overflow-hidden lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
    {/* Left: brand panel (desktop only) */}
    <aside className="relative hidden flex-col overflow-hidden bg-gradient-to-b from-[#0b1f4d] via-[#0d2a66] to-[#0a1a3f] px-10 py-8 text-white lg:flex [@media(max-height:760px)]:py-5">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl"
      />

      {/* Everything sits in the middle of the panel */}
      <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center gap-6">
        <div className="w-full max-w-md">
          <Link to="/" className="flex items-center gap-3">
            <BrandMark className="h-14 w-14 text-2xl shadow-lg shadow-black/20 [@media(max-height:760px)]:h-11 [@media(max-height:760px)]:w-11 [@media(max-height:760px)]:text-xl" />
            <span>
              <span className="block text-sm font-semibold leading-tight">GIBS Brokers Portal</span>
              <span className="block text-[11px] text-blue-200/80">Powered by Intteck Global Systems</span>
            </span>
          </Link>

          <h2 className="mt-8 text-4xl font-bold leading-[1.15] tracking-tight xl:text-[2.75rem] [@media(max-height:900px)]:mt-6 [@media(max-height:900px)]:text-3xl xl:[@media(max-height:900px)]:text-4xl [@media(max-height:760px)]:mt-4 [@media(max-height:760px)]:text-2xl xl:[@media(max-height:760px)]:text-2xl">
            Every policy, from PIN to <span className="text-blue-300">printed certificate.</span>
          </h2>
          <p className="mt-4 text-sm text-blue-100/80 [@media(max-height:760px)]:mt-2 [@media(max-height:760px)]:text-xs">
            {blurb}
          </p>
          <ul className="mt-6 space-y-3.5 [@media(max-height:900px)]:mt-4 [@media(max-height:900px)]:space-y-2.5 [@media(max-height:760px)]:mt-3 [@media(max-height:760px)]:space-y-2">
            {HIGHLIGHTS.map((h) => (
              <li key={h.title} className="flex items-start gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/10 ring-1 ring-white/10 [@media(max-height:760px)]:h-8 [@media(max-height:760px)]:w-8">
                  <h.icon className="h-4 w-4 text-blue-200" />
                </span>
                <span>
                  <span className="block text-sm font-semibold [@media(max-height:760px)]:text-[13px]">{h.title}</span>
                  <span className="block text-xs text-blue-100/70 [@media(max-height:760px)]:text-[11px]">{h.text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex w-full justify-center [@media(max-height:560px)]:hidden">
          <Illustration />
        </div>
      </div>

      <p className="relative text-center text-xs text-blue-200/60">
        © {new Date().getFullYear()} GIBS Brokers Portal. Powered by Intteck Global Systems.
      </p>
    </aside>

    {/* Right: the page's own content */}
    <main className="flex min-h-dvh flex-col px-5 py-6 sm:px-10 lg:h-dvh lg:min-h-0 lg:overflow-y-auto [@media(max-height:760px)]:py-4">
      <div className="flex items-center text-sm lg:hidden">
        <Link to="/" className="flex items-center gap-2 font-semibold text-slate-900">
          <BrandMark className="h-8 w-8 rounded-lg text-base ring-1 ring-slate-200" />
          GIBS Brokers Portal
        </Link>
      </div>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-6 [@media(max-height:760px)]:py-2">
        {children}
      </div>
    </main>
  </div>
);

export default AuthShell;
