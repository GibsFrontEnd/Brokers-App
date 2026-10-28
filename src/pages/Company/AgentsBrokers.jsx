import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { CalendarRange, Eye, Plus, UserCheck, Users, UserX } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getApiBaseUrl } from "../../utils/config";
import AddAgentBroker from "./AddAgentBroker";
import { BrokerDetailsSheet } from "../Admin/ViewBrokerDetails";
import {
  Avatar,
  EmptyState,
  ErrorState,
  Field,
  LoadingState,
  Notice,
  PageHeader,
  Pager,
  SearchInput,
  StatTile,
  StatusPill,
  ViewToggle,
  btnPrimary,
  btnSecondary,
  iconBtn,
  inputCls,
} from "../../components/UI/PageKit";
import { cardItemCls, cardListCls, useViewMode } from "../../components/UI/viewMode";

const statusOf = (broker) => String(broker.tag || "active").toLowerCase();
const statusTone = (s) => (["active", "approved"].includes(s) ? "green" : s === "pending" ? "amber" : "red");
const label = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const AgentsBrokers = () => {
  const { user } = useAuth();
  const [agentsBrokers, setAgentsBrokers] = useState([]);
  const [filteredAgentsBrokers, setFilteredAgentsBrokers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [view, setView] = useViewMode("company-agents");
  const [addOpen, setAddOpen] = useState(false);
  const [viewId, setViewId] = useState(null);
  const [added, setAdded] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "–";
    try {
      const options = { day: "2-digit", month: "short", year: "numeric" };
      return new Date(dateString).toLocaleDateString("en-US", options);
    } catch {
      return "–";
    }
  };

  // Fetch agents/brokers from API
  useEffect(() => {
    const fetchAgentsBrokers = async () => {
      try {
        setLoading(true);
        setError(null);

        let companyId =
          user?.insCompanyId || user?.companyId || user?.userId || user?.userid || user?.id;

        // If not found in user object, try to extract from JWT token
        if (!companyId) {
          const token = localStorage.getItem("token");
          if (token) {
            try {
              const payload = JSON.parse(atob(token.split(".")[1]));
              companyId =
                payload.insCompanyId ||
                payload.companyId ||
                payload.userid ||
                payload.id ||
                payload.nameid ||
                payload.sub;
              console.log("Extracted companyId from token:", companyId);
            } catch (error) {
              console.warn("Failed to parse token:", error);
            }
          }
        }

        if (!companyId) {
          throw new Error("Company ID not found. Please log in again.");
        }

        const token = localStorage.getItem("token");
        const response = await axios.get(
          `${getApiBaseUrl()}/Auth/companies/${companyId}/brokers`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        // Extract data from response
        const brokersData = response.data.data || [];
        setAgentsBrokers(brokersData);
        setFilteredAgentsBrokers(brokersData);
      } catch (err) {
        console.error("Fetch error:", err);
        console.error("Error response:", err.response);
        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to fetch agents/brokers",
        );
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchAgentsBrokers();
    }
  }, [user, reloadKey]);

  // Handle search and filter
  const handleSearch = useCallback(() => {
    let filtered = [...agentsBrokers];

    // Apply search term filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((broker) => {
        return (
          broker.brokerId?.toLowerCase().includes(searchLower) ||
          broker.brokerName?.toLowerCase().includes(searchLower) ||
          broker.email?.toLowerCase().includes(searchLower) ||
          broker.mobilePhone?.toLowerCase().includes(searchLower)
        );
      });
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((broker) => {
        const status = broker.tag?.toLowerCase() || "active";
        return status === statusFilter.toLowerCase();
      });
    }

    // Apply date range filter
    if (startDate || endDate) {
      const normalizeDate = (value) => {
        const dateObject = new Date(value);
        if (Number.isNaN(dateObject.getTime())) {
          return null;
        }
        return new Date(
          dateObject.getFullYear(),
          dateObject.getMonth(),
          dateObject.getDate(),
        );
      };

      const start = startDate ? normalizeDate(startDate) : null;
      const end = endDate ? normalizeDate(endDate) : null;

      filtered = filtered.filter((broker) => {
        const rawDate = broker.submitDate;
        if (!rawDate) {
          return false;
        }

        const normalizedDate = normalizeDate(rawDate);
        if (!normalizedDate) {
          return false;
        }

        if (start && end) {
          return normalizedDate >= start && normalizedDate <= end;
        }
        if (start) {
          return normalizedDate >= start;
        }
        if (end) {
          return normalizedDate <= end;
        }
        return true;
      });
    }

    setFilteredAgentsBrokers(filtered);
  }, [agentsBrokers, searchTerm, statusFilter, startDate, endDate]);

  // Auto-apply filters when dependencies change
  useEffect(() => {
    handleSearch();
  }, [handleSearch]);

  // Clear all filters
  const handleClearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setStartDate("");
    setEndDate("");
    setFilteredAgentsBrokers(agentsBrokers);
  };

  const toggleFilters = () => {
    setShowFilters((prev) => !prev);
  };

  const activeFilterCount = [
    searchTerm.trim(),
    statusFilter !== "all" ? statusFilter : "",
    startDate,
    endDate,
  ].filter(Boolean).length;

  // Pagination calculations
  const totalPages = Math.ceil(filteredAgentsBrokers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedBrokers = filteredAgentsBrokers.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, startDate, endDate]);

  // Pagination handlers
  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  if (loading) return <LoadingState label="Loading your agents and brokers…" />;
  if (error) return <ErrorState title="Could not load your agents and brokers" message={error} onRetry={() => setReloadKey((k) => k + 1)} />;

  const active = agentsBrokers.filter((b) => ["active", "approved"].includes(statusOf(b))).length;
  const dateFilterCount = [startDate, endDate].filter(Boolean).length;

  const viewButton = (broker) => (
    <button type="button" onClick={() => setViewId(broker.brokerId)} title="View" aria-label="View" className={iconBtn}>
      <Eye className="h-4 w-4" />
    </button>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agents and brokers"
        description="The agents and brokers selling your cover."
        actions={
          <button type="button" onClick={() => setAddOpen(true)} className={btnPrimary}>
            <Plus className="h-4 w-4" />
            Add agent
          </button>
        }
      />

      {added && <Notice onClose={() => setAdded("")}>{added}</Notice>}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <StatTile label="Agents and brokers" value={agentsBrokers.length.toLocaleString()} hint="In your network" icon={Users} />
        <StatTile label="Active" value={active.toLocaleString()} hint="Can sell your cover" icon={UserCheck} tone="bg-emerald-50 text-emerald-700" />
        <StatTile label="Not active" value={(agentsBrokers.length - active).toLocaleString()} hint="Pending or switched off" icon={UserX} tone="bg-rose-50 text-rose-700" />
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-4 sm:px-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Search by name, ID, email or phone" className="md:max-w-sm md:flex-1" />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Status" className={`${inputCls} md:w-40`}>
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
            </select>
            <button
              type="button"
              onClick={toggleFilters}
              aria-expanded={showFilters}
              className={`${btnSecondary} h-10 py-0 ${showFilters ? "border-blue-200 bg-blue-50 text-blue-700" : ""}`}
            >
              <CalendarRange className="h-4 w-4" />
              Registered
              {dateFilterCount > 0 && <span className="rounded-full bg-[#155dfd] px-1.5 text-[11px] font-semibold text-white">{dateFilterCount}</span>}
            </button>
            {activeFilterCount > 0 && (
              <button type="button" onClick={handleClearFilters} className="text-sm font-medium text-[#155dfd] hover:underline">
                Clear filters
              </button>
            )}
            <ViewToggle value={view} onChange={setView} className="hidden lg:ml-auto lg:inline-flex" />
          </div>
          {showFilters && (
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 md:max-w-lg">
              <Field label="From">
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputCls} />
              </Field>
              <Field label="To">
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputCls} />
              </Field>
            </div>
          )}
        </div>

        {filteredAgentsBrokers.length === 0 ? (
          <EmptyState
            icon={Users}
            title={activeFilterCount ? "No agents match" : "No agents yet"}
            text={activeFilterCount ? "Try a different search or clear the filters." : "Add your first agent or broker."}
            action={
              activeFilterCount ? (
                <button type="button" onClick={handleClearFilters} className={btnSecondary}>
                  Clear filters
                </button>
              ) : (
                <button type="button" onClick={() => setAddOpen(true)} className={btnPrimary}>
                  <Plus className="h-4 w-4" />
                  Add agent
                </button>
              )
            }
          />
        ) : (
          <>
            <div className={view === "table" ? "hidden overflow-x-auto lg:block" : "hidden"}>
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-6 py-3">Agent</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3">Company</th>
                    <th className="px-4 py-3">Registered</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-6 py-3 text-right" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedBrokers.map((broker, index) => (
                    <tr key={broker.brokerId || index} onClick={() => setViewId(broker.brokerId)} className="cursor-pointer hover:bg-slate-50/70">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar name={broker.brokerName} />
                          <div className="min-w-0">
                            <p className="max-w-[16rem] truncate font-semibold text-slate-900">{broker.brokerName || "Unnamed"}</p>
                            <p className="text-xs text-slate-500">{broker.brokerId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="block max-w-[15rem] truncate text-slate-700">{broker.email || "–"}</span>
                        <span className="block text-xs text-slate-500">{broker.mobilePhone || "–"}</span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-slate-700">{broker.insCompanyId || "–"}</td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-slate-700">{formatDate(broker.submitDate)}</td>
                      <td className="px-4 py-3.5">
                        <StatusPill tone={statusTone(statusOf(broker))}>{label(statusOf(broker))}</StatusPill>
                      </td>
                      <td className="px-6 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        {viewButton(broker)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className={cardListCls(view)}>
              {paginatedBrokers.map((broker, index) => (
                <li key={broker.brokerId || index} onClick={() => setViewId(broker.brokerId)} className={`${cardItemCls(view)} cursor-pointer`}>
                  <div className="flex items-start gap-3">
                    <Avatar name={broker.brokerName} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-slate-900">{broker.brokerName || "Unnamed"}</p>
                      <p className="text-xs text-slate-500">{broker.brokerId}</p>
                    </div>
                    <StatusPill tone={statusTone(statusOf(broker))}>{label(statusOf(broker))}</StatusPill>
                  </div>
                  <dl className="mt-3 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 text-xs">
                    <dt className="text-slate-500">Email</dt>
                    <dd className="truncate text-slate-700">{broker.email || "–"}</dd>
                    <dt className="text-slate-500">Phone</dt>
                    <dd className="text-slate-700">{broker.mobilePhone || "–"}</dd>
                    <dt className="text-slate-500">Registered</dt>
                    <dd className="text-slate-700">{formatDate(broker.submitDate)}</dd>
                  </dl>
                </li>
              ))}
            </ul>

            <Pager
              page={currentPage}
              totalPages={totalPages}
              total={filteredAgentsBrokers.length}
              pageSize={itemsPerPage}
              onPage={goToPage}
              onPageSize={(n) => {
                setItemsPerPage(n);
                setCurrentPage(1);
              }}
              sizes={[5, 10, 25, 50]}
              noun="agents"
            />
          </>
        )}
      </section>

      {addOpen && (
        <AddAgentBroker
          inSheet
          onClose={() => setAddOpen(false)}
          onCreated={(name) => {
            setAddOpen(false);
            setAdded(`${name || "The agent"} was added.`);
            setReloadKey((k) => k + 1);
          }}
        />
      )}

      {viewId && <BrokerDetailsSheet brokerId={viewId} onClose={() => setViewId(null)} pageBase="/company/agents-brokers" />}
    </div>
  );
};

export default AgentsBrokers;
