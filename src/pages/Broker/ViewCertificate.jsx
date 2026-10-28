import { useState, useEffect } from "react";
import axios from "axios";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, CalendarDays, Car, Download, FileText, Loader2, Printer, ShieldCheck, UserRound, Wallet } from "lucide-react";
import { getApiBaseUrl } from "../../utils/config";
import { DetailCard, DetailRow, EmptyState, ErrorState, LoadingState, StatusPill, Toast, btnPrimary, btnSecondary } from "../../components/UI/PageKit";

// Format date for display
const formatDate = (dateString, withTime = false) => {
  if (!dateString) return null;
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
};

// Format currency for display
const formatCurrency = (amount, currency = "NGN") => {
  if (amount === null || amount === undefined || amount === "") return null;
  try {
    return new Intl.NumberFormat("en-NG", { style: "currency", currency }).format(amount);
  } catch {
    return null;
  }
};

const statusTone = (status) => {
  const s = String(status || "").toUpperCase();
  if (s === "PENDING") return "amber";
  if (["REJECTED", "CANCELLED", "EXPIRED"].includes(s)) return "red";
  return "green";
};

// How far through its cover period a certificate is, for the bar at the top.
const coverProgress = (start, end) => {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  if (Number.isNaN(s) || Number.isNaN(e) || e <= s) return null;
  const now = Date.now();
  const pct = Math.min(100, Math.max(0, ((now - s) / (e - s)) * 100));
  const daysLeft = Math.ceil((e - now) / 86400000);
  return { pct, daysLeft };
};

const ViewCertificate = () => {
  const { certNo } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const fetchCertificate = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem("token");
        const response = await axios.get(`${getApiBaseUrl()}/Certificate/motor/${certNo}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setCertificate(response.data);
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err.response?.data?.message || "Failed to fetch certificate details");
      } finally {
        setLoading(false);
      }
    };

    if (certNo) {
      fetchCertificate();
    }
  }, [certNo]);

  // Back to wherever the certificate was opened from. The list opens it in a new tab, which has no
  // history, so then go to the certificate list of the area it belongs to.
  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(location.pathname.startsWith("/client") ? "/client/certificates" : "/brokers/certificates/niid");
    }
  };

  const handleDownloadCertificate = async () => {
    if (!certNo) {
      setToast({ message: "Certificate number not found", type: "error" });
      return;
    }

    try {
      setDownloading(true);
      const token = localStorage.getItem("token");

      // Call the document download API
      const response = await fetch(`${getApiBaseUrl()}/CertificateDocument/download/${certNo}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "*/*",
        },
      });

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

      setToast({ message: `Certificate ${certNo} downloaded.`, type: "success" });
    } catch (err) {
      console.error("Certificate download failed", err);
      setToast({ message: `Failed to download certificate: ${err.message}`, type: "error" });
    } finally {
      setDownloading(false);
    }
  };

  const backLink = (
    <button type="button" onClick={handleGoBack} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 print:hidden">
      <ArrowLeft className="h-4 w-4" />
      Back
    </button>
  );

  if (loading) return <LoadingState label="Loading the certificate…" />;

  if (error) {
    return (
      <div>
        {backLink}
        <ErrorState title="Could not load this certificate" message={error} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  if (!certificate) {
    return (
      <div>
        {backLink}
        <EmptyState title="Certificate not found" text={`No certificate has the number ${certNo}.`} />
      </div>
    );
  }

  const progress = coverProgress(certificate.startDate, certificate.expiryDate);
  const niid = certificate.niidStatus;

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {backLink}

      {/* Header */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm print:shadow-none">
        <div className="flex flex-col gap-5 bg-gradient-to-r from-[#0b1f4d] to-[#155dfd] px-5 py-6 text-white sm:flex-row sm:items-center sm:justify-between sm:px-6 print:bg-none print:text-slate-900">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-200 print:text-slate-500">Motor certificate</p>
            <h1 className="mt-1 break-all font-mono text-2xl font-bold tracking-tight sm:text-3xl">{certificate.certNo}</h1>
            <p className="mt-1 text-sm text-blue-100/90 print:text-slate-600">
              {certificate.insuredName || "Unnamed insured"}
              {certificate.vehicleRegNum ? ` · ${certificate.vehicleRegNum}` : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 print:hidden">
            <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10">
              <Printer className="h-4 w-4" />
              Print
            </button>
            <button
              type="button"
              onClick={handleDownloadCertificate}
              disabled={downloading}
              className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-blue-50 disabled:opacity-60"
            >
              {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {downloading ? "Downloading…" : "Download official copy"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 p-5 sm:p-6 lg:grid-cols-4">
          <div>
            <p className="text-xs text-slate-500">Status</p>
            <div className="mt-1">
              <StatusPill tone={statusTone(certificate.status)}>{certificate.status || "Unknown"}</StatusPill>
            </div>
          </div>
          <div>
            <p className="text-xs text-slate-500">NIID</p>
            <div className="mt-1">
              {niid ? (
                <StatusPill tone={["YES", "VERIFIED", "UPLOADED", "SUCCESS"].includes(String(niid).toUpperCase()) ? "green" : "amber"}>{niid}</StatusPill>
              ) : (
                <StatusPill tone="slate">Not reported</StatusPill>
              )}
            </div>
          </div>
          <div>
            <p className="text-xs text-slate-500">Premium</p>
            <p className="mt-0.5 text-lg font-bold text-slate-900">{formatCurrency(certificate.grossPremium) || "–"}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Insured value</p>
            <p className="mt-0.5 text-lg font-bold text-slate-900">{formatCurrency(certificate.insuredValue) || "–"}</p>
          </div>
        </div>

        {progress && (
          <div className="border-t border-slate-100 px-5 py-4 sm:px-6">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-slate-500">
                <CalendarDays className="h-3.5 w-3.5" />
                {formatDate(certificate.startDate)} – {formatDate(certificate.expiryDate)}
              </span>
              <span className={`font-semibold ${progress.daysLeft < 0 ? "text-rose-600" : progress.daysLeft <= 30 ? "text-amber-600" : "text-emerald-600"}`}>
                {progress.daysLeft < 0 ? "Expired" : `${progress.daysLeft} day${progress.daysLeft === 1 ? "" : "s"} of cover left`}
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
              <div className={`h-full rounded-full ${progress.daysLeft < 0 ? "bg-rose-500" : "bg-[#155dfd]"}`} style={{ width: `${progress.pct}%` }} />
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DetailCard icon={FileText} title="Certificate and policy">
          <DetailRow label="Certificate no" value={certificate.certNo} mono />
          <DetailRow label="Policy no" value={certificate.policyNo} />
          <DetailRow label="Company" value={certificate.insCompanyID} />
          <DetailRow label="DN/CN reference" value={certificate.refDNCNNo} />
          <DetailRow label="Transaction date" value={formatDate(certificate.transDate)} />
          <DetailRow label="Submitted" value={formatDate(certificate.submitDate, true)} />
        </DetailCard>

        <DetailCard icon={UserRound} title="Insured">
          <DetailRow label="Name" value={certificate.insuredName} />
          <DetailRow label="Mobile" value={certificate.mobileNo} />
          <DetailRow label="Email" value={certificate.email} />
          <DetailRow label="Address" value={certificate.address} />
        </DetailCard>

        <DetailCard icon={Car} title="Vehicle">
          <DetailRow label="Registration" value={certificate.vehicleRegNum} />
          <DetailRow label="Type" value={certificate.vehicleType} />
          <DetailRow label="Make" value={certificate.vehicleMake} />
          <DetailRow label="Brand / model" value={certificate.vehicleBrand} />
          <DetailRow label="Colour" value={certificate.vehicleColor} />
          <DetailRow label="Year" value={certificate.vehicleYear} />
          <DetailRow label="Chassis no" value={certificate.chassisNum} mono />
          <DetailRow label="Engine no" value={certificate.engineNum} mono />
          <DetailRow label="Engine capacity" value={certificate.engineCapacity} />
        </DetailCard>

        <DetailCard icon={Wallet} title="Premium">
          <DetailRow label="Insured value" value={formatCurrency(certificate.insuredValue)} />
          <DetailRow label="Gross premium" value={formatCurrency(certificate.grossPremium)} />
          <DetailRow label="Rate" value={certificate.rate ? `${certificate.rate}%` : null} />
          <DetailRow label="Cover starts" value={formatDate(certificate.startDate)} />
          <DetailRow label="Cover ends" value={formatDate(certificate.expiryDate)} />
        </DetailCard>
      </div>

      <div className="flex items-start gap-2.5 rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-600 ring-1 ring-slate-200 print:hidden">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#155dfd]" />
        <span>
          This page is for checking the details. The official, signed certificate is the document from <strong>Download official copy</strong>.
        </span>
      </div>

      <div className="flex justify-end print:hidden">
        <button type="button" onClick={handleDownloadCertificate} disabled={downloading} className={btnPrimary}>
          {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Download official copy
        </button>
        <button type="button" onClick={handleGoBack} className={`${btnSecondary} ml-2`}>
          Done
        </button>
      </div>
    </div>
  );
};

export default ViewCertificate;
