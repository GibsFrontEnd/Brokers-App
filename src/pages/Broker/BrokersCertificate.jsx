import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  CalendarRange,
  Car,
  Clock,
  Download,
  ExternalLink,
  FilePlus2,
  FileText,
  Loader2,
  Lock,
  Pencil,
  ShieldCheck,
  Upload,
  Wallet,
  X,
} from "lucide-react";
import { getApiBaseUrl } from "../../utils/config";
import {
  DetailCard,
  DetailRow,
  EmptyState,
  ErrorState,
  Field,
  LoadingState,
  PageHeader,
  Pager,
  SearchInput,
  Sheet,
  StatTile,
  StatusPill,
  Toast,
  ViewToggle,
  btnPrimary,
  btnSecondary,
  iconBtn,
  inputCls,
} from "../../components/UI/PageKit";

// NIID uploads are switched off for now. Set to true to show the "Upload NIID" buttons again.
const NIID_UPLOADS_ENABLED = false;
import { cardItemCls, cardListCls, useViewMode } from "../../components/UI/viewMode";
import { useConfirm } from "../../components/UI/useConfirm";
import PaymentModal from "../../components/Payment/PaymentModal";
import PaymentService from "../../services/PaymentServices";

const statusTone = (status) => {
  const s = String(status || "").toUpperCase();
  if (s === "PENDING") return "amber";
  if (["REJECTED", "CANCELLED", "EXPIRED"].includes(s)) return "red";
  return "green";
};

const isPending = (c) => String(c?.status || "").toUpperCase() === "PENDING";

/**
 * The motor certificate list. area="broker" (super agents, default) or area="client" (sub agents):
 * sub agents have their own links and cannot edit certificates.
 */
const BrokerCertificates = ({ certType, area = "broker" }) => {
  const isClient = area === "client";
  const home = isClient ? "/client" : "/brokers";
  const [activeTab] = useState("motor");
  const [certificates, setCertificates] = useState([]);
  // certNo -> payment record for the paid ones; null until it has loaded (so nothing flashes "Unpaid").
  const [payments, setPayments] = useState(null);
  const [payCertNo, setPayCertNo] = useState(null);
  const [filteredCertificates, setFilteredCertificates] = useState([]);
  const [selectedCerts, setSelectedCerts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [uploadingNiid, setUploadingNiid] = useState(null);
  const [downloadingCerts, setDownloadingCerts] = useState([]);
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const navigate = useNavigate();
  const [view, setView] = useViewMode("broker-certificates");
  const [confirm, confirmDialog] = useConfirm();
  const [detail, setDetail] = useState(null);
  const location = useLocation();
  const isAdminContext = location.pathname.startsWith("/admin-dashboard");

  // Show toast message
  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(
      () => setToast({ show: false, message: "", type: "success" }),
      3000,
    );
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const options = { day: "2-digit", month: "short", year: "numeric" };
      return new Date(dateString).toLocaleDateString("en-US", options);
    } catch {
      return "Invalid Date";
    }
  };

  // Format currency for display
  const formatCurrency = (amount, currency = "NGN") => {
    if (!amount) return "N/A";
    try {
      return new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: currency,
      }).format(amount);
    } catch {
      return "Invalid Amount";
    }
  };

  // Fetch certificates from API based on active tab
  const fetchCertificates = useCallback(async () => {
    // Only fetch for Motor Policies tab, others will be added later
    if (activeTab !== "motor") {
      setCertificates([]);
      setFilteredCertificates([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${getApiBaseUrl()}/Certificate/motor/list`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setCertificates(response.data);
      setFilteredCertificates(response.data);
    } catch (err) {
      console.error("Fetch error:", err);

      if (err.response?.status === 401 && !isAdminContext) {
        setError("Authentication failed. Please login again.");
        navigate("/login");
      } else if (err.response?.status === 403 && !isAdminContext) {
        setError("You do not have permission to view certificates.");
      } else {
        setError(err.response?.data?.message || "Failed to fetch certificates");
      }
    } finally {
      setLoading(false);
    }
  }, [activeTab, isAdminContext, navigate]);

  const loadPayments = useCallback(async (list) => {
    if (!list.length) {
      setPayments({});
      return;
    }
    try {
      const paid = await PaymentService.getPaidCertificates(list.map((c) => c.certNo));
      setPayments(Object.fromEntries(paid.map((p) => [p.certNo, p])));
    } catch (err) {
      console.error("Could not load payment status:", err);
      setPayments(null); // show no payment badges rather than wrong ones
    }
  }, []);

  useEffect(() => {
    loadPayments(certificates);
  }, [certificates, loadPayments]);

  useEffect(() => {
    const needsRefresh = location.state?.refresh;
    if (needsRefresh) {
      fetchCertificates();
      navigate(location.pathname, { replace: true, state: {} });
    } else {
      fetchCertificates();
    }
  }, [location, navigate, fetchCertificates]);

  // Fetch certificates when active tab changes
  useEffect(() => {
    fetchCertificates();
  }, [activeTab, fetchCertificates]);

  // Handle search and filter functionality
  const handleSearch = useCallback(() => {
    let filtered = [...certificates];

    // Apply search term filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((cert) => {
        const brokerIdentifier = cert.brokerID || cert.brokerId;

        return (
          cert.certNo?.toLowerCase().includes(searchLower) ||
          cert.policyNo?.toLowerCase().includes(searchLower) ||
          cert.insuredName?.toLowerCase().includes(searchLower) ||
          cert.name?.toLowerCase().includes(searchLower) ||
          brokerIdentifier?.toLowerCase().includes(searchLower)
        );
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

      filtered = filtered.filter((cert) => {
        const rawDate = cert.transDate || cert.transactionDate;
        if (!rawDate) {
          return false;
        }

        const normalizedCertDate = normalizeDate(rawDate);
        if (!normalizedCertDate) {
          return false;
        }

        if (start && end) {
          return normalizedCertDate >= start && normalizedCertDate <= end;
        }
        if (start) {
          return normalizedCertDate >= start;
        }
        if (end) {
          return normalizedCertDate <= end;
        }
        return true;
      });
    }

    setFilteredCertificates(filtered);
  }, [certificates, searchTerm, startDate, endDate]);

  // Auto-apply filters when dependencies change
  useEffect(() => {
    handleSearch();
  }, [handleSearch]);

  // Clear all filters
  const handleClearFilters = () => {
    setSearchTerm("");
    setStartDate("");
    setEndDate("");
    setFilteredCertificates(certificates);
  };

  const toggleFilters = () => {
    setShowFilters((prev) => !prev);
  };

  const activeFilterCount = [searchTerm.trim(), startDate, endDate].filter(
    Boolean,
  ).length;

  const activeFiltersSummary = [
    searchTerm.trim() ? `Search: "${searchTerm.trim()}"` : null,
    startDate ? `From ${formatDate(startDate)}` : null,
    endDate ? `To ${formatDate(endDate)}` : null,
  ]
    .filter(Boolean)
    .join(" • ");

  const hasActiveFilters = activeFilterCount > 0;

  // Pagination calculations
  const totalPages = Math.ceil(filteredCertificates.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCertificates = filteredCertificates.slice(
    startIndex,
    endIndex,
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, startDate, endDate, activeTab]);

  // Pagination handlers
  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  // Toggle certificate selection
  const toggleCertificateSelection = (certId) => {
    setSelectedCerts((prev) =>
      prev.includes(certId)
        ? prev.filter((id) => id !== certId)
        : [...prev, certId],
    );
  };

  // Handle NIID upload
  const handleUploadNiid = async (certNo) => {
    const confirmed = await confirm({
      title: "Upload to NIID?",
      message: `Certificate ${certNo} will be sent to the NIID database.`,
      confirmLabel: "Upload",
      tone: "primary",
    });

    if (!confirmed) return;

    try {
      setUploadingNiid(certNo);
      const token = localStorage.getItem("token");

      await axios.post(
        `${getApiBaseUrl()}/Certificate/motor/${certNo}/upload-niid`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      showToast(`Certificate ${certNo} was uploaded to NIID.`);
      // Refresh the certificates list
      fetchCertificates();
    } catch (err) {
      console.error("NIID upload error:", err);
      showToast(
        err.response?.data?.message ||
          "Failed to upload NIID. Please try again.",
        "error",
      );
    } finally {
      setUploadingNiid(null);
    }
  };

  // Download single certificate
  const handleDownloadCertificate = async (certNo) => {
    if (!certNo) {
      showToast("Certificate number not found", "error");
      return;
    }

    try {
      setDownloadingCerts((prev) => [...prev, certNo]);
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${getApiBaseUrl()}/CertificateDocument/download/${certNo}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "*/*",
          },
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Get the filename from content-disposition header
      const contentDisposition = response.headers.get("content-disposition");
      let filename = `Certificate_${certNo}.pdf`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
          if (!filename.toLowerCase().endsWith(".pdf")) {
            filename = filename.replace(/\.[^/.]+$/, ".pdf");
          }
        }
      }

      // Convert response to blob
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);

      // Trigger download
      link.click();

      // Clean up
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);

      showToast(`Certificate ${certNo} downloaded successfully!`);
    } catch (err) {
      console.error("Certificate download failed", err);
      showToast(`Failed to download certificate: ${err.message}`, "error");
    } finally {
      setDownloadingCerts((prev) => prev.filter((cert) => cert !== certNo));
    }
  };

  // Download multiple certificates
  const handleDownloadMultipleCertificates = async () => {
    if (selectedCerts.length === 0) {
      showToast("Please select certificates to download", "warning");
      return;
    }

    try {
      setDownloadingCerts(selectedCerts);
      showToast(
        `Downloading ${selectedCerts.length} certificate(s)...`,
        "info",
      );

      const token = localStorage.getItem("token");

      // Download certificates sequentially
      for (const certNo of selectedCerts) {
        try {
          const response = await fetch(
            `${getApiBaseUrl()}/CertificateDocument/download/${certNo}`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: "*/*",
              },
            },
          );

          if (!response.ok) {
            console.error(
              `Failed to download certificate ${certNo}: ${response.status}`,
            );
            continue;
          }

          // Get the filename from content-disposition header
          const contentDisposition = response.headers.get(
            "content-disposition",
          );
          let filename = `Certificate_${certNo}.pdf`;

          if (contentDisposition) {
            const filenameMatch =
              contentDisposition.match(/filename="?([^"]+)"?/);
            if (filenameMatch && filenameMatch[1]) {
              filename = filenameMatch[1];
              if (!filename.toLowerCase().endsWith(".pdf")) {
                filename = filename.replace(/\.[^/.]+$/, ".pdf");
              }
            }
          }

          // Convert response to blob
          const blob = await response.blob();

          // Create download link
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = filename;
          document.body.appendChild(link);

          // Trigger download
          link.click();

          // Clean up
          setTimeout(() => {
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
          }, 100);
        } catch (err) {
          console.error(`Error downloading certificate ${certNo}:`, err);
        }
      }

      showToast(
        `Successfully downloaded ${selectedCerts.length} certificate(s)!`,
      );
      setSelectedCerts([]);
    } catch (err) {
      console.error("Batch download failed", err);
      showToast("Failed to download certificates", "error");
    } finally {
      setDownloadingCerts([]);
    }
  };

  // Get create certificate link based on active tab
  const getCreateCertificateLink = () => {
    // Determine base path based on context
    const basePrefix = isAdminContext ? "/admin-dashboard/brokers" : home;

    // NIIP motor policies use their own dedicated create page
    if (certType === "NIIP") {
      return `${basePrefix}/certificates/create/niip-motor`;
    }

    switch (activeTab) {
      case "motor":
        return `${basePrefix}/certificates/create/motor`;
      case "marine":
        return `${basePrefix}/certificates/create/marine`;
      case "compulsory":
        return `${basePrefix}/certificates/create/compulsory`;
      default:
        return `${basePrefix}/certificates/create/motor`;
    }
  };

  const getCertificateViewLink = (certificate) => {
    const basePath = isAdminContext ? "/admin-dashboard/brokers" : home;
    return `${basePath}/certificates/view/${certificate.certNo}`;
  };

  // Get unique certificate identifier
  const getCertId = (certificate) => {
    return certificate.certNo || Math.random().toString();
  };

  // Get tab label for display
  const getTabLabel = () => {
    const tabMap = {
      motor: "Motor",
      marine: "Marine",
      compulsory: "Compulsory Insurance",
    };
    return tabMap[activeTab] || "Motor";
  };

  // Handle select all certificates
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedCerts(paginatedCertificates.map((c) => getCertId(c)));
    } else {
      setSelectedCerts([]);
    }
  };

  if (certType === "NIIP") {
    return (
      <div className="space-y-6">
        <PageHeader title="NIIP certificates" description="Motor policies issued through NIIP." />
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <EmptyState icon={Lock} title="Not available yet" text="NIIP certificates are not available yet. Please check back later." />
        </div>
      </div>
    );
  }

  if (loading) {
    return <LoadingState label="Loading certificates…" />;
  }

  if (error && !isAdminContext) {
    return <ErrorState title="Could not load certificates" message={error} onRetry={fetchCertificates} />;
  }

  const sum = (list, pick) => list.reduce((total, c) => total + (Number(pick(c)) || 0), 0);
  const pendingCount = certificates.filter(isPending).length;
  const totalPremium = sum(certificates, (c) => c.grossPremium || c.premium);
  const totalInsured = sum(certificates, (c) => c.insuredValue || c.suminsured);
  const dateFilterCount = [startDate, endDate].filter(Boolean).length;
  const pageIds = paginatedCertificates.map((c) => getCertId(c));
  const allOnPage = pageIds.length > 0 && pageIds.every((id) => selectedCerts.includes(id));

  const paymentPill = (certificate) => {
    if (payments === null) return null;
    return payments[certificate.certNo] ? (
      <StatusPill tone="green">Paid</StatusPill>
    ) : (
      <StatusPill tone="amber">Unpaid</StatusPill>
    );
  };

  const actions = (certificate, compact) => {
    const downloading = downloadingCerts.includes(certificate.certNo);
    const uploading = uploadingNiid === certificate.certNo;
    const unpaid = payments !== null && !payments[certificate.certNo];
    return (
      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
        {unpaid && (
          <button
            type="button"
            onClick={() => setPayCertNo(certificate.certNo)}
            title="Pay for this certificate"
            className={`${btnPrimary} mr-1 px-3 py-1.5 text-xs`}
          >
            <Wallet className="h-3.5 w-3.5" />
            Pay
          </button>
        )}
        <a href={getCertificateViewLink(certificate)} target="_blank" rel="noopener noreferrer" title="Open certificate" aria-label="Open certificate" className={iconBtn}>
          <ExternalLink className="h-4 w-4" />
        </a>
        {!isClient && (
          <button
            type="button"
            onClick={() => navigate(`/brokers/certificates/edit/motor/${certificate.certNo}`)}
            disabled={!isPending(certificate)}
            title={isPending(certificate) ? "Edit certificate" : "Only PENDING certificates can be edited"}
            aria-label="Edit certificate"
            className={`${iconBtn} disabled:opacity-30`}
          >
            <Pencil className="h-4 w-4" />
          </button>
        )}
        <button
          type="button"
          onClick={() => handleDownloadCertificate(certificate.certNo)}
          disabled={downloading}
          title="Download PDF"
          aria-label="Download PDF"
          className={`${iconBtn} disabled:opacity-50`}
        >
          {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        </button>
        {NIID_UPLOADS_ENABLED && (
          <button
            type="button"
            onClick={() => handleUploadNiid(certificate.certNo)}
            disabled={uploading}
            title="Upload to NIID"
            className={`${btnSecondary} ml-1 px-2.5 py-1.5 text-xs`}
          >
            {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            {compact ? "NIID" : uploading ? "Uploading…" : "Upload NIID"}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {payCertNo && (
        <PaymentModal
          certNo={payCertNo}
          returnPath={location.pathname}
          onClose={(paid) => {
            setPayCertNo(null);
            if (paid) loadPayments(certificates);
          }}
        />
      )}
      {toast.show && <Toast message={toast.message} type={toast.type === "error" ? "error" : "success"} onClose={() => setToast({ show: false, message: "", type: "success" })} />}
      {confirmDialog}

      <PageHeader
        title={isClient ? "My certificates" : `${certType || "NIID"} certificates`}
        description={
          isClient
            ? "Your motor certificates: download them and send them to NIID."
            : "Your motor certificates: download them, send them to NIID and continue the ones still pending."
        }
        actions={
          <Link to={getCreateCertificateLink()} className={btnPrimary}>
            <FilePlus2 className="h-4 w-4" />
            Create {certType ? `${certType} ` : ""}
            {getTabLabel().toLowerCase()} policy
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile label="Certificates" value={certificates.length.toLocaleString()} hint="Motor certificates" icon={FileText} />
        <StatTile label="Pending" value={pendingCount.toLocaleString()} hint={isClient ? "Not yet final" : "Can still be edited"} icon={Clock} tone="bg-amber-50 text-amber-700" />
        <StatTile label="Insured value" value={formatCurrency(totalInsured)} hint="Across all certificates" icon={ShieldCheck} tone="bg-violet-50 text-violet-700" />
        <StatTile label="Premium" value={formatCurrency(totalPremium)} hint="Across all certificates" icon={Wallet} tone="bg-emerald-50 text-emerald-700" />
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Toolbar */}
        <div className="border-b border-slate-100 p-4 sm:px-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Search by certificate, policy or insured" className="md:max-w-sm md:flex-1" />
            <button
              type="button"
              onClick={toggleFilters}
              aria-expanded={showFilters}
              className={`${btnSecondary} h-10 py-0 ${showFilters ? "border-blue-200 bg-blue-50 text-blue-700" : ""}`}
            >
              <CalendarRange className="h-4 w-4" />
              Date
              {dateFilterCount > 0 && <span className="rounded-full bg-[#155dfd] px-1.5 text-[11px] font-semibold text-white">{dateFilterCount}</span>}
            </button>
            {hasActiveFilters && (
              <button type="button" onClick={handleClearFilters} className="text-sm font-medium text-[#155dfd] hover:underline">
                Clear filters
              </button>
            )}
            <span className="text-sm text-slate-500 md:ml-auto">
              {filteredCertificates.length} certificate{filteredCertificates.length === 1 ? "" : "s"}
            </span>
            <ViewToggle value={view} onChange={setView} className="hidden lg:inline-flex" />
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
          {!showFilters && hasActiveFilters && <p className="mt-2 text-xs text-slate-500">Filtered by {activeFiltersSummary}</p>}
        </div>

        {/* Selection bar */}
        {selectedCerts.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 border-b border-blue-100 bg-blue-50/70 px-4 py-2.5 text-sm sm:px-6">
            <span className="font-semibold text-blue-900">{selectedCerts.length} selected</span>
            <button type="button" onClick={handleDownloadMultipleCertificates} disabled={downloadingCerts.length > 0} className={`${btnPrimary} px-3 py-1.5 text-xs`}>
              {downloadingCerts.length > 0 ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              Download {selectedCerts.length}
            </button>
            <button type="button" onClick={() => setSelectedCerts([])} className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900">
              <X className="h-3.5 w-3.5" />
              Clear selection
            </button>
          </div>
        )}

        {filteredCertificates.length === 0 ? (
          <EmptyState
            icon={Car}
            title="No certificates found"
            text={hasActiveFilters ? "Try a different search or clear the filters." : "Get started by creating a new certificate."}
            action={
              hasActiveFilters ? (
                <button type="button" onClick={handleClearFilters} className={btnSecondary}>
                  Clear filters
                </button>
              ) : (
                <Link to={getCreateCertificateLink()} className={btnPrimary}>
                  <FilePlus2 className="h-4 w-4" />
                  New certificate
                </Link>
              )
            }
          />
        ) : (
          <>
            {/* Table (large screens) */}
            <div className={view === "table" ? "hidden overflow-x-auto lg:block" : "hidden"}>
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="w-10 px-5 py-3">
                      <input
                        type="checkbox"
                        aria-label="Select all on this page"
                        checked={allOnPage}
                        onChange={handleSelectAll}
                        disabled={paginatedCertificates.length === 0}
                        className="h-4 w-4 rounded border-slate-300 accent-[#155dfd]"
                      />
                    </th>
                    <th className="px-3 py-3">Certificate</th>
                    <th className="px-4 py-3">Insured</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3 text-right">Insured value</th>
                    <th className="px-4 py-3 text-right">Premium</th>
                    <th className="px-4 py-3">Payment</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedCertificates.map((certificate) => {
                    const id = getCertId(certificate);
                    const selected = selectedCerts.includes(id);
                    return (
                      <tr key={id} onClick={() => setDetail(certificate)} className={`cursor-pointer ${selected ? "bg-blue-50/50" : "hover:bg-slate-50/70"}`}>
                        <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            aria-label={`Select ${certificate.certNo}`}
                            checked={selected}
                            onChange={() => toggleCertificateSelection(id)}
                            className="h-4 w-4 rounded border-slate-300 accent-[#155dfd]"
                          />
                        </td>
                        <td className="px-3 py-3">
                          <p className="font-mono text-[13px] font-semibold text-slate-900">{certificate.certNo}</p>
                          <p className="text-xs text-slate-500">{certificate.policyNo || "No policy number"}</p>
                        </td>
                        <td className="max-w-[14rem] truncate px-4 py-3 text-slate-700">{certificate.insuredName || certificate.name || "–"}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-slate-700">{formatDate(certificate.transDate || certificate.transactionDate)}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-right text-slate-700">{formatCurrency(certificate.insuredValue || certificate.suminsured)}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-slate-900">{formatCurrency(certificate.grossPremium || certificate.premium)}</td>
                        <td className="px-4 py-3">{paymentPill(certificate)}</td>
                        <td className="px-5 py-3">{actions(certificate)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Cards */}
            <ul className={cardListCls(view)}>
              {paginatedCertificates.map((certificate) => {
                const id = getCertId(certificate);
                const selected = selectedCerts.includes(id);
                return (
                  <li key={id} onClick={() => setDetail(certificate)} className={`${cardItemCls(view)} cursor-pointer ${selected ? "ring-2 ring-blue-200" : ""}`}>
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        aria-label={`Select ${certificate.certNo}`}
                        checked={selected}
                        onClick={(e) => e.stopPropagation()}
                        onChange={() => toggleCertificateSelection(id)}
                        className="mt-1 h-4 w-4 rounded border-slate-300 accent-[#155dfd]"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-slate-900">{certificate.insuredName || certificate.name || "Unnamed insured"}</p>
                        <p className="font-mono text-xs text-slate-500">{certificate.certNo}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <StatusPill tone={statusTone(certificate.status)}>{certificate.status || "Active"}</StatusPill>
                        {paymentPill(certificate)}
                      </div>
                    </div>
                    <dl className="mt-3 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 text-xs">
                      <dt className="text-slate-500">Policy</dt>
                      <dd className="truncate text-slate-700">{certificate.policyNo || "–"}</dd>
                      <dt className="text-slate-500">Date</dt>
                      <dd className="text-slate-700">{formatDate(certificate.transDate || certificate.transactionDate)}</dd>
                      <dt className="text-slate-500">Premium</dt>
                      <dd className="font-semibold text-slate-900">{formatCurrency(certificate.grossPremium || certificate.premium)}</dd>
                    </dl>
                    <div className="mt-auto pt-3">
                      <div className="border-t border-slate-100 pt-2">{actions(certificate, true)}</div>
                    </div>
                  </li>
                );
              })}
            </ul>

            <Pager
              page={currentPage}
              totalPages={totalPages}
              total={filteredCertificates.length}
              pageSize={itemsPerPage}
              onPage={goToPage}
              onPageSize={(n) => {
                setItemsPerPage(n);
                setCurrentPage(1);
              }}
              sizes={[5, 10, 25, 50]}
              noun="certificates"
            />
          </>
        )}
      </section>

      {/* One certificate */}
      {detail && (
        <Sheet
          open
          onClose={() => setDetail(null)}
          title={detail.insuredName || detail.name || "Certificate"}
          sub={detail.certNo}
          leading={
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-700">
              <Car className="h-5 w-5" />
            </span>
          }
          footer={
            <div className="flex flex-wrap items-center justify-between gap-2">
              <a href={getCertificateViewLink(detail)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900">
                <ExternalLink className="h-4 w-4" />
                Open certificate
              </a>
              <div className="flex flex-wrap gap-2">
                {!isClient && isPending(detail) && (
                  <button type="button" onClick={() => navigate(`/brokers/certificates/edit/motor/${detail.certNo}`)} className={btnSecondary}>
                    <Pencil className="h-4 w-4" />
                    Edit
                  </button>
                )}
                {NIID_UPLOADS_ENABLED && (
                  <button type="button" onClick={() => handleUploadNiid(detail.certNo)} disabled={uploadingNiid === detail.certNo} className={btnSecondary}>
                    {uploadingNiid === detail.certNo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    Upload NIID
                  </button>
                )}
                <button type="button" onClick={() => handleDownloadCertificate(detail.certNo)} disabled={downloadingCerts.includes(detail.certNo)} className={btnPrimary}>
                  {downloadingCerts.includes(detail.certNo) ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  Download PDF
                </button>
              </div>
            </div>
          }
        >
          <div className="flex items-center gap-4 rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-slate-500">Premium</p>
              <p className="text-2xl font-bold tracking-tight text-slate-900">{formatCurrency(detail.grossPremium || detail.premium)}</p>
              <p className="text-xs text-slate-500">on {formatCurrency(detail.insuredValue || detail.suminsured)} insured</p>
            </div>
            <StatusPill tone={statusTone(detail.status)}>{detail.status || "Active"}</StatusPill>
          </div>
          <DetailCard icon={FileText} title="Certificate">
            <DetailRow label="Certificate no" value={detail.certNo} mono />
            {payments !== null && (
              <DetailRow label="Payment">
                {payments[detail.certNo] ? (
                  <span className="inline-flex flex-wrap items-center gap-2">
                    <StatusPill tone="green">Paid</StatusPill>
                    <span className="text-xs font-normal text-slate-500">
                      {payments[detail.certNo].method === "Wallet" ? "from wallet" : "by card"}
                      {payments[detail.certNo].paidAt ? ` · ${formatDate(payments[detail.certNo].paidAt)}` : ""}
                    </span>
                  </span>
                ) : (
                  <StatusPill tone="amber">Unpaid</StatusPill>
                )}
              </DetailRow>
            )}
            <DetailRow label="Policy no" value={detail.policyNo} />
            <DetailRow label="Insured" value={detail.insuredName || detail.name} />
            <DetailRow label="Date" value={formatDate(detail.transDate || detail.transactionDate)} />
            <DetailRow label="Super agent" value={detail.brokerID || detail.brokerId} />
          </DetailCard>
          {!isClient && !isPending(detail) && <p className="text-xs text-slate-500">Only PENDING certificates can be edited.</p>}
        </Sheet>
      )}
    </div>
  );
};

export default BrokerCertificates;
