// HomePage.jsx: the public landing page.
import { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  Car,
  Check,
  ClipboardList,
  Download,
  FileCheck2,
  FileText,
  KeyRound,
  Landmark,
  ShieldCheck,
  Ship,
  UserCog,
  UserPlus,
  Users,
} from "lucide-react";
import BrandMark from "../components/BrandMark";

const NAV = [
  { label: "Certificates", href: "#certificates" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Portals", href: "#portals" },
];

const CERTIFICATES = [
  { icon: Car, tone: "bg-blue-50 text-blue-600", title: "Motor", text: "Comprehensive and third party motor certificates with vehicle and policy details." },
  { icon: Landmark, tone: "bg-emerald-50 text-emerald-600", title: "NIIP Motor", text: "Motor policies issued through NIIP, recorded alongside the rest of your book." },
  { icon: Ship, tone: "bg-sky-50 text-sky-600", title: "Marine", text: "Marine cargo certificates for each shipment, ready to print." },
  { icon: ShieldCheck, tone: "bg-violet-50 text-violet-600", title: "Compulsory", text: "Compulsory insurance certificates in the same quick flow." },
];

const STEPS = [
  { icon: KeyRound, tone: "bg-amber-50 text-amber-600", title: "Allocate PINs", text: "The administrator allocates certificate PINs to super agents from the PIN allocation system.", chip: "Allocated", chipTone: "bg-amber-50 text-amber-700", dot: "bg-amber-500" },
  { icon: UserPlus, tone: "bg-violet-50 text-violet-600", title: "Onboard sub agents", text: "Super agents add their sub agents and clients, and pass PINs down to them.", chip: "Onboarded", chipTone: "bg-violet-50 text-violet-700", dot: "bg-violet-500" },
  { icon: FileText, tone: "bg-blue-50 text-blue-600", title: "Issue the certificate", text: "Agents capture the insured and risk details, and each certificate uses one PIN.", chip: "Issued", chipTone: "bg-blue-50 text-blue-700", dot: "bg-blue-500" },
  { icon: Download, tone: "bg-emerald-50 text-emerald-600", title: "Download and report", text: "Download the certificate for the client and follow every PIN in the reports.", chip: "Delivered", chipTone: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
];

const PORTALS = [
  { icon: UserCog, tone: "bg-slate-100 text-slate-700", title: "Administrator", text: "Manage super agents, sub agents and companies, allocate PINs, and look after security and verification.", items: ["Users management", "PIN allocation", "Security"] },
  { icon: Users, tone: "bg-blue-50 text-blue-600", title: "Super agent", text: "Issue certificates, manage sub agents and clients, renew policies and track the PINs you hold.", items: ["Policy admin", "Sub agent management", "PIN management"] },
  { icon: ClipboardList, tone: "bg-emerald-50 text-emerald-600", title: "Sub agent", text: "Create business proposals, issue certificates for your clients and keep an eye on your PIN balance.", items: ["Business proposals", "Policy admin", "PIN management"] },
];

const REPORTS = ["Certificate period", "PIN allocation", "Agent PIN balance", "Agent creation history", "User activity logs"];

// A static picture of the dashboard for the hero. The figures and names are illustrative.
const PREVIEW_ROWS = [
  { icon: Car, client: "Adeyemi Foods Ltd", ref: "Motor · LAG-234-XY", amount: "₦15,000", chip: "Issued", chipTone: "bg-emerald-50 text-emerald-700" },
  { icon: Ship, client: "Harbour Line Shipping", ref: "Marine · Cargo", amount: "₦92,400", chip: "Issued", chipTone: "bg-emerald-50 text-emerald-700" },
  { icon: Landmark, client: "Okafor Logistics", ref: "NIIP Motor · ABJ-118-KT", amount: "₦15,000", chip: "Pending", chipTone: "bg-amber-50 text-amber-700" },
];

// Scrolls to a section of this page. The page draws itself after it loads, so the browser's own jump to a
// #section has nothing to land on; doing it here works whether the link is clicked or the page is opened
// with the #section already in the address.
const scrollToSection = (id, smooth = true) => {
  const el = document.getElementById(id);
  if (!el) return false;
  const top = el.getBoundingClientRect().top + window.scrollY;
  window.scrollTo({ top, behavior: smooth ? "smooth" : "auto" });
  return true;
};

const SectionLink = ({ href, children, className }) => (
  <a
    href={href}
    className={className}
    onClick={(e) => {
      if (scrollToSection(href.slice(1))) {
        e.preventDefault();
        window.history.replaceState(null, "", href);
      }
    }}
  >
    {children}
  </a>
);

const Eyebrow = ({ children }) => (
  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#155dfd]">{children}</p>
);

const SectionHead = ({ eyebrow, title, text }) => (
  <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
    <div className="max-w-xl">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="mt-2 text-3xl font-bold leading-tight tracking-tight text-slate-900 sm:text-4xl 2xl:text-5xl">{title}</h2>
    </div>
    {text && <p className="max-w-sm text-sm text-slate-500 md:text-right 2xl:max-w-md 2xl:text-base">{text}</p>}
  </div>
);

const HomePage = () => {
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (id) scrollToSection(id, false);
  }, []);

  return (
    <div className="min-h-dvh bg-white text-slate-900" id="home">
      {/* ───────────── Hero ───────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#0a1a3f] via-[#0b2150] to-[#0d2a66] text-white">
        <div aria-hidden="true" className="pointer-events-none absolute -right-20 top-10 h-[34rem] w-[34rem] rounded-full bg-blue-500/20 blur-3xl" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-6 top-24 hidden h-24 w-28 opacity-40 lg:block"
          style={{ backgroundImage: "radial-gradient(#93c5fd 1.2px, transparent 1.2px)", backgroundSize: "12px 12px" }}
        />

        <header className="relative mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-5 py-5 sm:px-8 2xl:px-12">
          <Link to="/" className="flex min-w-0 items-center gap-3">
            <BrandMark className="h-11 w-11 rounded-xl text-xl" />
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold leading-tight">GIBS Brokers Portal</span>
              <span className="block truncate text-[11px] text-blue-200/80">Powered by Intteck Global Systems</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-7 text-sm text-blue-100/90 lg:flex 2xl:gap-9 2xl:text-base" aria-label="Page sections">
            {NAV.map((n) => (
              <SectionLink key={n.href} href={n.href} className="hover:text-white">
                {n.label}
              </SectionLink>
            ))}
          </nav>

          <Link
            to="/login"
            className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border border-white/25 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
          >
            Sign in
            <ArrowRight className="h-4 w-4" />
          </Link>
        </header>

        <div className="relative mx-auto grid max-w-[1600px] grid-cols-[minmax(0,1fr)] items-center gap-12 px-5 pb-20 pt-10 sm:px-8 2xl:px-12 lg:grid-cols-2 lg:pb-28 lg:pt-14">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-blue-100 2xl:text-sm">
              <ShieldCheck className="h-3.5 w-3.5" />
              Retail insurance broker platform
            </span>
            <h1 className="mt-6 text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.4rem] 2xl:text-[4.25rem]">
              Issue certificates and manage your agents in <span className="text-blue-300">one place.</span>
            </h1>
            <p className="mt-6 max-w-lg text-base text-blue-100/80 2xl:max-w-xl 2xl:text-lg">
              Issue Motor, NIIP, Marine and Compulsory certificates, allocate PINs down your agent network, and
              follow every certificate and PIN in the reports.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-lg bg-[#155dfd] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-900/40 hover:bg-[#0f4bd1] 2xl:px-6 2xl:py-3.5 2xl:text-base"
              >
                Sign in to your portal
                <ArrowRight className="h-4 w-4" />
              </Link>
              <SectionLink
                href="#how-it-works"
                className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10 2xl:px-6 2xl:py-3.5 2xl:text-base"
              >
                See how it works
              </SectionLink>
            </div>

            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-xs text-blue-100/80 2xl:text-sm">
              {["One sign-in for every role", "PIN-tracked certificates", "Downloadable certificates"].map((t) => (
                <li key={t} className="inline-flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  {t}
                </li>
              ))}
            </ul>
          </div>

          {/* A picture of the dashboard */}
          <div className="relative mx-auto w-full max-w-lg lg:max-w-none" aria-hidden="true">
            <span className="absolute -left-3 -top-5 z-10 grid h-10 w-10 place-items-center rounded-full bg-emerald-500 text-white shadow-lg">
              <Check className="h-5 w-5" />
            </span>
            <span className="absolute -right-2 -top-6 z-10 grid h-7 w-7 place-items-center rounded-full bg-amber-400">
              <span className="h-3 w-3 rounded-full border-2 border-white" />
            </span>

            <div className="rounded-2xl bg-white p-5 text-slate-900 shadow-2xl shadow-black/30">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold">Certificates this month</p>
                  <p className="text-[11px] text-slate-500">What your agents have issued</p>
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600">Sample</span>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3">
                {[
                  ["Issued", "248"],
                  ["PINs left", "1,152"],
                  ["Sub agents", "37"],
                ].map(([label, n]) => (
                  <div key={label} className="rounded-xl border border-slate-200 p-3">
                    <p className="text-[11px] text-slate-500">{label}</p>
                    <p className="mt-1 text-2xl font-bold">{n}</p>
                  </div>
                ))}
              </div>

              <ul className="mt-4 divide-y divide-slate-100 rounded-xl border border-slate-200">
                {PREVIEW_ROWS.map((r) => (
                  <li key={r.client} className="flex items-center gap-3 px-3 py-2.5">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-600">
                      <r.icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-semibold">{r.client}</span>
                      <span className="block truncate text-[10px] text-slate-500">{r.ref}</span>
                    </span>
                    <span className="text-xs font-semibold">{r.amount}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${r.chipTone}`}>{r.chip}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="absolute -bottom-6 right-4 z-10 flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-xl">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-blue-50 text-[#155dfd]">
                <KeyRound className="h-4 w-4" />
              </span>
              <span className="space-y-1.5">
                <span className="block h-1.5 w-20 rounded-full bg-slate-800" />
                <span className="block h-1.5 w-14 rounded-full bg-slate-300" />
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────── Certificates ───────────── */}
      <section id="certificates" className="mx-auto max-w-[1600px] scroll-mt-6 px-5 py-20 sm:px-8 2xl:px-12">
        <SectionHead
          eyebrow="Certificates"
          title="Every certificate type in the same quick flow."
          text="Pick the type, capture the insured and risk details, and the certificate is ready to download."
        />
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CERTIFICATES.map((c) => (
            <li key={c.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
              <span className={`grid h-10 w-10 place-items-center rounded-xl ${c.tone}`}>
                <c.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-sm font-semibold 2xl:text-base">{c.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-500 2xl:text-sm">{c.text}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* ───────────── How it works ───────────── */}
      <section id="how-it-works" className="scroll-mt-6 bg-slate-50 py-20">
        <div className="mx-auto max-w-[1600px] px-5 sm:px-8 2xl:px-12">
          <Eyebrow>How it works</Eyebrow>
          <h2 className="mt-2 max-w-md text-3xl font-bold leading-tight tracking-tight sm:text-4xl 2xl:max-w-lg 2xl:text-5xl">
            From PIN to printed certificate in four steps.
          </h2>
          <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <li key={s.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className={`grid h-10 w-10 place-items-center rounded-xl ${s.tone}`}>
                    <s.icon className="h-5 w-5" />
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#155dfd]">Step 0{i + 1}</span>
                </div>
                <h3 className="mt-4 text-sm font-semibold 2xl:text-base">{s.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-500 2xl:text-sm">{s.text}</p>
                <span className={`mt-4 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${s.chipTone}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                  {s.chip}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ───────────── Portals ───────────── */}
      <section id="portals" className="mx-auto max-w-[1600px] scroll-mt-6 px-5 py-20 sm:px-8 2xl:px-12">
        <SectionHead
          eyebrow="Portals"
          title="Each account sees the work that belongs to it."
          text="Sign in once and you land on the dashboard for your account type."
        />
        <ul className="mt-10 grid gap-4 lg:grid-cols-3">
          {PORTALS.map((p) => (
            <li key={p.title} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <span className={`grid h-10 w-10 place-items-center rounded-xl ${p.tone}`}>
                <p.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-base font-semibold">{p.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-500">{p.text}</p>
              <ul className="mt-5 space-y-2 border-t border-slate-100 pt-4">
                {p.items.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-xs text-slate-600 2xl:text-sm">
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    {item}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-6 md:flex-row md:items-center">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-600">
            <BarChart3 className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold 2xl:text-base">Reports for every PIN and certificate</h3>
            <p className="mt-1 text-xs text-slate-500 2xl:text-sm">Administrators can follow the whole network from the reports.</p>
          </div>
          <ul className="flex flex-wrap gap-2">
            {REPORTS.map((r) => (
              <li key={r} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-medium text-slate-600">
                {r}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ───────────── Call to action ───────────── */}
      <section className="mx-auto max-w-[1600px] px-5 sm:px-8 2xl:px-12">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0a1a3f] to-[#155dfd] px-8 py-12 text-white sm:px-12">
          <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-16 h-64 w-64 rounded-full border border-white/10" />
          <div aria-hidden="true" className="pointer-events-none absolute -right-2 -top-8 h-48 w-48 rounded-full border border-white/10" />
          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Ready to issue your next certificate?</h2>
              <p className="mt-2 max-w-md text-sm text-blue-100/80">
                Sign in with your portal account. If you do not have access yet, ask your administrator to set one up.
              </p>
            </div>
            <Link
              to="/login"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-blue-50"
            >
              <FileCheck2 className="h-4 w-4" />
              Sign in to your portal
            </Link>
          </div>
        </div>
      </section>

      {/* ───────────── Footer ───────────── */}
      <footer className="mt-20 border-t border-slate-200">
        <div className="mx-auto flex max-w-[1600px] flex-col items-center justify-between gap-3 px-5 py-6 text-xs text-slate-500 sm:flex-row sm:px-8 2xl:px-12">
          <p>© {new Date().getFullYear()} GIBS Brokers Portal. Powered by Intteck Global Systems.</p>
          <nav className="flex gap-6" aria-label="Footer">
            {NAV.map((n) => (
              <SectionLink key={n.href} href={n.href} className="hover:text-slate-900">
                {n.label}
              </SectionLink>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
