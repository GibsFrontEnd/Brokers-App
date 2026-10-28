import React, { useState, useEffect } from "react";
import { BarChart3, CalendarRange, CheckCircle2, Clock, Download, History, KeyRound, RefreshCw, XCircle } from "lucide-react";
import PinService from "../../services/PinServices";
import UserService from "../../services/UserServices";
import {
  Avatar,
  DetailCard,
  DetailRow,
  EmptyState,
  Field,
  Pager,
  SearchInput,
  Sheet,
  StatTile,
  StatusPill,
  Toast,
  ViewToggle,
  btnSecondary,
  inputCls,
} from "../UI/PageKit";
import { cardItemCls, cardListCls, useViewMode } from "../UI/viewMode";

const STATUS_TONES = { pending: "amber", approved: "green", rejected: "red", completed: "blue" };

const AllocationHistory = () => {
  const [allocations, setAllocations] = useState([]);
  const [summary, setSummary] = useState(null);
  const [brokers, setBrokers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadAllocationHistory();
    loadBrokers();
    loadSummary();
  }, []);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  const closeToast = () => {
    setToast(null);
  };

  const loadBrokers = async () => {
    try {
      const brokersData = await UserService.getBrokers();
      console.log("Loaded brokers:", brokersData);
      setBrokers(Array.isArray(brokersData) ? brokersData : []);
    } catch (error) {
      console.error("Failed to load brokers:", error);
      setBrokers([]);
    }
  };

  const loadSummary = async () => {
    try {
      const summaryData = await PinService.getPinSummary();
      console.log("Pin summary:", summaryData);
      setSummary(summaryData);
    } catch (error) {
      console.error("Failed to load summary:", error);
      setSummary(null);
    }
  };

  const loadAllocationHistory = async () => {
    try {
      setLoading(true);

      let history = [];

      try {
        // Try the summary endpoint first to get allocation counts
        console.log("Loading allocation history...");

        // Try getAllocationHistory with date range if specified
        const fromDate = dateRange.from
          ? new Date(dateRange.from).toISOString()
          : null;
        const toDate = dateRange.to
          ? new Date(dateRange.to).toISOString()
          : null;

        history = await PinService.getAllocationHistory(null, fromDate, toDate);
        console.log("Success with getAllocationHistory:", history);
      } catch (error) {
        console.log("getAllocationHistory failed:", error.message);

        try {
          // Fallback to getPendingAllocations (we know this works)
          console.log("Trying getPendingAllocations as fallback...");
          const pendingData = await PinService.getPendingAllocations();
          console.log("Pending allocations:", pendingData);

          // Transform pending data to match our format
          history = Array.isArray(pendingData)
            ? pendingData.map((item) => ({
                allocationId: item.allocationId,
                brokerId: item.toUserId,
                pinAmount: item.pinAmount,
                remarks: item.remarks,
                requestedBy: item.fromUserName || item.fromUserId,
                requestDate: item.allocatedDate,
                status: item.status,
                fromUserId: item.fromUserId,
                fromUserName: item.fromUserName,
                toUserName: item.toUserName,
                allocatedDate: item.allocatedDate,
              }))
            : [];
        } catch (pendingError) {
          console.log("All methods failed:", pendingError);
          showToast("Could not load the allocation history.", "error");
          history = [];
        }
      }

      console.log("Final history data:", history);
      setAllocations(Array.isArray(history) ? history : []);
    } catch (error) {
      console.error("Failed to load allocation history:", error);
      showToast("Failed to load allocation history", "error");
      setAllocations([]);
    } finally {
      setLoading(false);
    }
  };

  // Get broker details by brokerId
  const getBrokerDetails = (brokerId) => {
    if (!brokerId) return null;

    const broker = brokers.find(
      (b) =>
        b.brokerId === brokerId || b.userId === brokerId || b.id === brokerId
    );

    return broker || null;
  };

  // Format date safely
  const formatDate = (dateString) => {
    if (!dateString) return "Not specified";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "Invalid date";
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "Not specified";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Invalid date";
    }
  };

  // Enhanced filtering
  const filteredAllocations = allocations.filter((allocation) => {
    const broker = getBrokerDetails(allocation.brokerId);
    const brokerName =
      broker?.brokerName || broker?.fullName || allocation.toUserName || "";

    const matchesSearch =
      brokerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      allocation.brokerId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      allocation.remarks?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      allocation.requestedBy
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      allocation.allocationId?.toString().includes(searchTerm);

    let matchesStatus = true;
    if (statusFilter !== "all") {
      matchesStatus =
        allocation.status?.toLowerCase() === statusFilter.toLowerCase();
    }

    let matchesDate = true;
    const requestDate = allocation.requestDate || allocation.allocatedDate;
    if (dateRange.from && requestDate) {
      matchesDate =
        matchesDate && new Date(requestDate) >= new Date(dateRange.from);
    }
    if (dateRange.to && requestDate) {
      const toDate = new Date(dateRange.to);
      toDate.setHours(23, 59, 59, 999);
      matchesDate = matchesDate && new Date(requestDate) <= toDate;
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  const exportToCSV = () => {
    const headers = [
      "Allocation ID",
      "Broker Name",
      "Broker ID",
      "Pin Amount",
      "Status",
      "Request Date",
      "Requested By",
      "Remarks",
    ];
    const csvData = filteredAllocations.map((allocation) => {
      const broker = getBrokerDetails(allocation.brokerId);
      const brokerName =
        broker?.brokerName ||
        broker?.fullName ||
        allocation.toUserName ||
        "Unknown Broker";

      return [
        allocation.allocationId,
        brokerName,
        allocation.brokerId || "N/A",
        allocation.pinAmount,
        allocation.status,
        formatDateTime(allocation.requestDate),
        allocation.requestedBy || allocation.fromUserId,
        allocation.remarks || "",
      ];
    });

    const csvContent = [headers, ...csvData]
      .map((row) => row.map((field) => `"${field}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pin-allocations-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    showToast("Data exported to CSV successfully");
  };

  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setDateRange({ from: "", to: "" });
  };


  // Table or cards, paging, and the panel for one allocation.
  const [view, setView] = useViewMode("pin-history");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, dateRange.from, dateRange.to]);

  const statusPill = (status) => (
    <StatusPill tone={STATUS_TONES[String(status || "").toLowerCase()] || "slate"}>{status || "Unknown"}</StatusPill>
  );

  const agentName = (a) => {
    const broker = getBrokerDetails(a.brokerId);
    return broker?.brokerName || broker?.fullName || a.toUserName || "Unknown super agent";
  };

  const count = (status) => allocations.filter((a) => a.status?.toLowerCase() === status).length;
  const filtersOn = Boolean(searchTerm || statusFilter !== "all" || dateRange.from || dateRange.to);
  const totalPages = Math.max(1, Math.ceil(filteredAllocations.length / pageSize));
  const pageRows = filteredAllocations.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-5">
      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Allocation history</h2>
          <p className="text-sm text-slate-500">Every PIN allocation request and what happened to it.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={loadAllocationHistory} disabled={loading} className={btnSecondary}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button type="button" onClick={exportToCSV} disabled={!filteredAllocations.length} className={btnSecondary}>
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Allocations"
          value={allocations.length.toLocaleString()}
          hint={summary ? `${Number(summary.totalAllocated || 0).toLocaleString()} PINs allocated` : "All requests"}
          icon={BarChart3}
        />
        <StatTile label="Approved" value={count("approved").toLocaleString()} hint="PINs released" icon={CheckCircle2} tone="bg-emerald-50 text-emerald-700" />
        <StatTile label="Pending" value={count("pending").toLocaleString()} hint="Waiting for approval" icon={Clock} tone="bg-amber-50 text-amber-700" />
        <StatTile label="Rejected" value={count("rejected").toLocaleString()} hint="Not released" icon={XCircle} tone="bg-rose-50 text-rose-700" />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Search by super agent, ID, requester or remarks" className="lg:max-w-xs lg:flex-1" />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Status" className={`${inputCls} lg:w-40`}>
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="completed">Completed</option>
        </select>
        <div className="grid grid-cols-2 gap-3 lg:flex">
          <Field label="From">
            <input type="date" value={dateRange.from} onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })} className={`${inputCls} lg:w-40`} />
          </Field>
          <Field label="To">
            <input type="date" value={dateRange.to} onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })} className={`${inputCls} lg:w-40`} />
          </Field>
        </div>
        {filtersOn && (
          <button type="button" onClick={resetFilters} className="h-10 text-sm font-medium text-[#155dfd] hover:underline">
            Clear filters
          </button>
        )}
        <ViewToggle value={view} onChange={setView} className="hidden lg:ml-auto lg:inline-flex" />
      </div>

      {loading ? (
        <div className="grid place-items-center rounded-2xl border border-slate-200 py-16 text-sm text-slate-500">
          <RefreshCw className="mb-3 h-6 w-6 animate-spin text-[#155dfd]" />
          Loading allocation history…
        </div>
      ) : filteredAllocations.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200">
          <EmptyState
            icon={History}
            title={filtersOn ? "No allocations match" : "No allocations yet"}
            text={filtersOn ? "Try a different search or clear the filters." : "PIN allocations will appear here once they are requested."}
            action={
              filtersOn ? (
                <button type="button" onClick={resetFilters} className={btnSecondary}>
                  Clear filters
                </button>
              ) : null
            }
          />
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {/* Table (large screens) */}
          <div className={view === "table" ? "hidden overflow-x-auto lg:block" : "hidden"}>
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Super agent</th>
                  <th className="px-4 py-3">Requested by</th>
                  <th className="px-4 py-3">Requested</th>
                  <th className="px-4 py-3">Decision</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-5 py-3 text-right">PINs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pageRows.map((a) => (
                  <tr key={a.allocationId} onClick={() => setSelected(a)} className="cursor-pointer hover:bg-slate-50/70">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar name={agentName(a)} />
                        <div className="min-w-0">
                          <p className="max-w-[15rem] truncate font-semibold text-slate-900">{agentName(a)}</p>
                          <p className="text-xs text-slate-500">
                            {a.brokerId || "No ID"} · #{a.allocationId}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-slate-700">{a.requestedBy || a.fromUserId || "–"}</td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-slate-700">{formatDate(a.allocatedDate || a.requestDate)}</td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-slate-700">
                      {a.approvedDate ? (
                        <>
                          {formatDate(a.approvedDate)}
                          {a.approvedBy && <span className="block text-xs text-slate-500">by {a.approvedBy}</span>}
                        </>
                      ) : (
                        <span className="text-slate-400">–</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">{statusPill(a.status)}</td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-right font-bold tabular-nums text-slate-900">
                      {Number(a.pinAmount || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cards */}
          <ul className={cardListCls(view)}>
            {pageRows.map((a) => (
              <li key={a.allocationId} className={`${cardItemCls(view)} cursor-pointer`} onClick={() => setSelected(a)}>
                <div className="flex items-start gap-3">
                  <Avatar name={agentName(a)} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-900">{agentName(a)}</p>
                    <p className="text-xs text-slate-500">
                      {a.brokerId || "No ID"} · #{a.allocationId}
                    </p>
                  </div>
                  <span className="whitespace-nowrap text-base font-bold tabular-nums text-slate-900">
                    {Number(a.pinAmount || 0).toLocaleString()}
                    <span className="ml-1 text-xs font-medium text-slate-500">PINs</span>
                  </span>
                </div>
                <dl className="mt-3 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 text-xs">
                  <dt className="text-slate-500">Requested by</dt>
                  <dd className="truncate text-slate-700">{a.requestedBy || a.fromUserId || "–"}</dd>
                  <dt className="text-slate-500">Requested</dt>
                  <dd className="text-slate-700">{formatDate(a.allocatedDate || a.requestDate)}</dd>
                </dl>
                <div className="mt-auto pt-3">
                  <div className="flex items-center justify-between border-t border-slate-100 pt-2">
                    {statusPill(a.status)}
                    <span className="text-xs font-medium text-[#155dfd]">Details</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <Pager
            page={page}
            totalPages={totalPages}
            total={filteredAllocations.length}
            pageSize={pageSize}
            onPage={(n) => setPage(Math.max(1, Math.min(n, totalPages)))}
            onPageSize={(n) => {
              setPageSize(n);
              setPage(1);
            }}
            noun="allocations"
          />
        </div>
      )}

      {/* One allocation */}
      {selected && (
        <Sheet
          open
          onClose={() => setSelected(null)}
          title={`Allocation #${selected.allocationId}`}
          sub={agentName(selected)}
          leading={<Avatar name={agentName(selected)} className="h-10 w-10 text-sm" />}
        >
          <div className="flex items-center gap-4 rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#155dfd] text-white">
              <KeyRound className="h-6 w-6" />
            </span>
            <div>
              <p className="text-3xl font-bold tracking-tight text-slate-900 tabular-nums">{Number(selected.pinAmount || 0).toLocaleString()}</p>
              <p className="text-sm text-slate-600">PINs for {agentName(selected)}</p>
            </div>
            <span className="ml-auto">{statusPill(selected.status)}</span>
          </div>

          <DetailCard icon={CalendarRange} title="Timeline">
            <DetailRow label="Requested" value={formatDateTime(selected.allocatedDate || selected.requestDate)} />
            <DetailRow label="Requested by" value={selected.requestedBy || selected.fromUserId} />
            <DetailRow label="Decided" value={selected.approvedDate ? formatDateTime(selected.approvedDate) : null} />
            <DetailRow label="Decided by" value={selected.approvedBy} />
          </DetailCard>

          <DetailCard title="Super agent">
            <DetailRow label="Name" value={agentName(selected)} />
            <DetailRow label="ID" value={selected.brokerId} />
            <DetailRow label="Email" value={getBrokerDetails(selected.brokerId)?.email} />
          </DetailCard>

          <DetailCard title="Remarks">
            <DetailRow label="Remarks" value={selected.remarks} />
          </DetailCard>
        </Sheet>
      )}
    </div>
  );
};

export default AllocationHistory;
