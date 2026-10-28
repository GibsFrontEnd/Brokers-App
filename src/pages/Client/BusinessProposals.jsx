import React from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { ClipboardList, Eye, Pencil, Plus, Trash2, X } from "lucide-react";
import { Avatar, EmptyState, PageHeader, ViewToggle, btnPrimary, iconBtn } from "../../components/UI/PageKit";
import { cardItemCls, cardListCls, useViewMode } from "../../components/UI/viewMode";

const BusinessProposals = () => {
  const navigate = useNavigate();
  const [view, setView] = useViewMode("client-proposals");

  // Handle missing context gracefully
  const outletContext = useOutletContext();

  // Provide default values if context is not available
  const {
    proposals = [],
    selectedProposal = null,
    showDelete = false,
    handleRowClick = () => {},
    setProposals = () => {},
    setSelectedProposal = () => {},
    setShowDelete = () => {},
  } = outletContext || {};

  // If context is completely missing, manage state locally
  const [localProposals, setLocalProposals] = React.useState([
    {
      id: 1,
      entryDate: "22 Aug 15",
      lastName: "Other Names",
      firstName: "intteck",
      address: "233 ikorodu road",
      mobile: "08023140962",
      regNumber: "LAG 987 67",
      amount: "5000.0000",
    },
    {
      id: 2,
      entryDate: "22 Aug 15",
      lastName: "Other Names",
      firstName: "intteck",
      address: "233 ikorodu road",
      mobile: "08023140962",
      regNumber: "LAG 987 GH",
      amount: "5000.0000",
    },
  ]);

  const [localSelectedProposal, setLocalSelectedProposal] =
    React.useState(null);
  const [localShowDelete, setLocalShowDelete] = React.useState(false);

  // Use context if available, otherwise use local state
  const effectiveProposals = outletContext ? proposals : localProposals;
  const effectiveSelectedProposal = outletContext
    ? selectedProposal
    : localSelectedProposal;
  const effectiveShowDelete = outletContext ? showDelete : localShowDelete;
  const effectiveSetProposals = outletContext
    ? setProposals
    : setLocalProposals;
  const effectiveSetSelectedProposal = outletContext
    ? setSelectedProposal
    : setLocalSelectedProposal;
  const effectiveSetShowDelete = outletContext
    ? setShowDelete
    : setLocalShowDelete;

  const effectiveHandleRowClick = (proposal) => {
    if (outletContext) {
      handleRowClick(proposal);
    } else {
      const newSelected =
        proposal.id === localSelectedProposal ? null : proposal.id;
      setLocalSelectedProposal(newSelected);
      setLocalShowDelete(proposal.id === localSelectedProposal ? false : true);
    }
  };

  const effectiveHandleAddProposal = () => {
    navigate("/client/add-proposal"); // Fixed the route
  };

  const handleDelete = () => {
    // For now using mock implementation
    // Replace with actual API call when backend is ready
    effectiveSetProposals(
      effectiveProposals.filter((p) => p.id !== effectiveSelectedProposal)
    );
    effectiveSetSelectedProposal(null);
    effectiveSetShowDelete(false);

    /* 
    BACKEND IMPLEMENTATION:
    try {
      const response = await fetch(`/api/proposals/${selectedProposal}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete proposal');
      setProposals(proposals.filter(p => p.id !== selectedProposal));
      setSelectedProposal(null);
      setShowDelete(false);
    } catch (err) {
      console.error('Error deleting proposal:', err);
    }
    */
  };

  const nameOf = (p) => [p.firstName, p.lastName].filter(Boolean).join(" ") || "Unnamed";
  const amount = (value) => {
    const n = Number(value);
    return Number.isFinite(n) ? `₦${n.toLocaleString("en-NG", { maximumFractionDigits: 2 })}` : value || "–";
  };
  const selectedOne = effectiveProposals.find((p) => p.id === effectiveSelectedProposal);

  const actions = (
    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
      <button type="button" title="View" aria-label="View" className={iconBtn}>
        <Eye className="h-4 w-4" />
      </button>
      <button type="button" title="Edit" aria-label="Edit" className={iconBtn}>
        <Pencil className="h-4 w-4" />
      </button>
    </div>
  );

  const selectBox = (proposal) => (
    <input
      type="checkbox"
      aria-label={`Select ${nameOf(proposal)}`}
      checked={effectiveSelectedProposal === proposal.id}
      onChange={() => {}}
      onClick={(e) => {
        e.stopPropagation();
        effectiveHandleRowClick(proposal);
      }}
      className="h-4 w-4 rounded border-slate-300 accent-[#155dfd]"
    />
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Business proposals"
        description="Proposals you have submitted for your clients."
        actions={
          <button type="button" onClick={effectiveHandleAddProposal} className={btnPrimary}>
            <Plus className="h-4 w-4" />
            New proposal
          </button>
        }
      />

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-6">
          <span className="text-sm text-slate-500">
            {effectiveProposals.length} proposal{effectiveProposals.length === 1 ? "" : "s"}
          </span>
          <ViewToggle value={view} onChange={setView} className="hidden lg:inline-flex" />
        </div>

        {/* Selection bar */}
        {effectiveShowDelete && selectedOne && (
          <div className="flex flex-wrap items-center gap-3 border-b border-rose-100 bg-rose-50/60 px-4 py-2.5 text-sm sm:px-6">
            <span className="font-semibold text-rose-900">{nameOf(selectedOne)} selected</span>
            <button type="button" onClick={handleDelete} className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700">
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
            <button
              type="button"
              onClick={() => effectiveHandleRowClick(selectedOne)}
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900"
            >
              <X className="h-3.5 w-3.5" />
              Clear selection
            </button>
          </div>
        )}

        {effectiveProposals.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No proposals yet"
            text="Add your first proposal to get started."
            action={
              <button type="button" onClick={effectiveHandleAddProposal} className={btnPrimary}>
                <Plus className="h-4 w-4" />
                New proposal
              </button>
            }
          />
        ) : (
          <>
            {/* Table (large screens) */}
            <div className={view === "table" ? "hidden overflow-x-auto lg:block" : "hidden"}>
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="w-10 px-5 py-3" />
                    <th className="px-3 py-3">Client</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3">Registration</th>
                    <th className="px-4 py-3">Entry date</th>
                    <th className="px-4 py-3 text-right">Paid</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {effectiveProposals.map((proposal) => (
                    <tr
                      key={proposal.id}
                      onClick={() => effectiveHandleRowClick(proposal)}
                      className={`cursor-pointer ${effectiveSelectedProposal === proposal.id ? "bg-blue-50/60" : "hover:bg-slate-50/70"}`}
                    >
                      <td className="px-5 py-3.5">{selectBox(proposal)}</td>
                      <td className="px-3 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar name={nameOf(proposal)} />
                          <span className="font-semibold text-slate-900">{nameOf(proposal)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="block text-slate-700">{proposal.mobile || "–"}</span>
                        <span className="block max-w-[14rem] truncate text-xs text-slate-500">{proposal.address}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-700">{proposal.regNumber || "–"}</span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-slate-700">{proposal.entryDate}</td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-right font-semibold text-slate-900">{amount(proposal.amount)}</td>
                      <td className="px-5 py-3.5">{actions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Cards */}
            <ul className={cardListCls(view)}>
              {effectiveProposals.map((proposal) => (
                <li
                  key={proposal.id}
                  onClick={() => effectiveHandleRowClick(proposal)}
                  className={`${cardItemCls(view)} cursor-pointer ${effectiveSelectedProposal === proposal.id ? "ring-2 ring-blue-200" : ""}`}
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-1">{selectBox(proposal)}</span>
                    <Avatar name={nameOf(proposal)} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-slate-900">{nameOf(proposal)}</p>
                      <p className="font-mono text-xs text-slate-500">{proposal.regNumber}</p>
                    </div>
                    <span className="text-sm font-semibold text-slate-900">{amount(proposal.amount)}</span>
                  </div>
                  <dl className="mt-3 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 text-xs">
                    <dt className="text-slate-500">Mobile</dt>
                    <dd className="text-slate-700">{proposal.mobile || "–"}</dd>
                    <dt className="text-slate-500">Address</dt>
                    <dd className="truncate text-slate-700">{proposal.address || "–"}</dd>
                    <dt className="text-slate-500">Entry date</dt>
                    <dd className="text-slate-700">{proposal.entryDate}</dd>
                  </dl>
                  <div className="mt-auto pt-3">
                    <div className="border-t border-slate-100 pt-2">{actions}</div>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
};

export default BusinessProposals;
