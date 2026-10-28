import { Info, Receipt } from "lucide-react";
import { PageHeader, StatusPill } from "../../components/UI/PageKit";

// Credit notes are not served by the API yet, so this page shows one sample row to preview the layout.
// Replace SAMPLE with the real list once the endpoint exists.
const SAMPLE = [
  {
    dncNo: "CN/70/002566",
    brokerId: "intteck",
    policyNo: "SAN/MOC/00471/2018/HQ",
    transDate: "25 Jul 2018",
    rate: "0.8000%",
    insuredValue: "₦1,000,000",
    grossPremium: "₦8,000",
  },
];

const CreditNotes = () => (
  <div className="space-y-6">
    <PageHeader title="Credit notes" description="Credit notes raised on your policies." />

    <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      <Info className="mt-0.5 h-4 w-4 shrink-0" />
      <p>Credit notes aren't connected to the server yet. The row below is a sample to show the layout, not a real credit note.</p>
    </div>

    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="hidden overflow-x-auto lg:block">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-6 py-3">Credit note</th>
              <th className="px-4 py-3">Policy no</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3 text-right">Rate</th>
              <th className="px-4 py-3 text-right">Insured value</th>
              <th className="px-6 py-3 text-right">Gross premium</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {SAMPLE.map((note) => (
              <tr key={note.dncNo} className="opacity-70">
                <td className="px-6 py-3.5">
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-violet-50 text-violet-700">
                      <Receipt className="h-[18px] w-[18px]" />
                    </span>
                    <div>
                      <p className="flex items-center gap-2 font-mono font-semibold text-slate-900">
                        {note.dncNo}
                        <StatusPill tone="amber" dot={false}>
                          Sample
                        </StatusPill>
                      </p>
                      <p className="text-xs text-slate-500">{note.brokerId}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5 font-mono text-xs text-slate-700">{note.policyNo}</td>
                <td className="whitespace-nowrap px-4 py-3.5 text-slate-700">{note.transDate}</td>
                <td className="px-4 py-3.5 text-right text-slate-700">{note.rate}</td>
                <td className="px-4 py-3.5 text-right text-slate-700">{note.insuredValue}</td>
                <td className="px-6 py-3.5 text-right font-semibold text-slate-900">{note.grossPremium}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-slate-100 lg:hidden">
        {SAMPLE.map((note) => (
          <li key={note.dncNo} className="p-4 opacity-70">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-mono font-semibold text-slate-900">{note.dncNo}</p>
                <p className="truncate font-mono text-xs text-slate-500">{note.policyNo}</p>
              </div>
              <StatusPill tone="amber" dot={false}>
                Sample
              </StatusPill>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-y-1 text-xs">
              <dt className="text-slate-500">Date</dt>
              <dd className="text-right text-slate-700">{note.transDate}</dd>
              <dt className="text-slate-500">Rate</dt>
              <dd className="text-right text-slate-700">{note.rate}</dd>
              <dt className="text-slate-500">Insured value</dt>
              <dd className="text-right text-slate-700">{note.insuredValue}</dd>
              <dt className="text-slate-500">Gross premium</dt>
              <dd className="text-right font-semibold text-slate-900">{note.grossPremium}</dd>
            </dl>
          </li>
        ))}
      </ul>
    </section>
  </div>
);

export default CreditNotes;
