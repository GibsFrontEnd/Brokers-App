import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { ArrowLeft, Download, FileText, Pencil, Save, ShieldCheck, Wallet } from "lucide-react";
import { getApiBaseUrl } from "../../utils/config";
import { EmptyState, ErrorState, Field, LoadingState, Notice, Sheet, StatusPill, Toast, btnPrimary, btnSecondary, inputCls } from "../../components/UI/PageKit";

// html2canvas cannot read Tailwind v4's oklch() colours, so everything inside the PDF block uses plain hex.
const Row = ({ label, value }) => (
  <div style={{ display: "flex", justifyContent: "space-between", gap: 16, padding: "8px 0", borderBottom: "1px solid #eef2f7" }}>
    <span style={{ color: "#64748b", fontSize: 13 }}>{label}</span>
    <span style={{ color: value ? "#0f172a" : "#94a3b8", fontSize: 13, fontWeight: 600, textAlign: "right" }}>{value || "–"}</span>
  </div>
);

const Block = ({ title, children }) => (
  <div style={{ border: "1px solid #e2e8f0", borderRadius: 14, padding: "14px 18px" }}>
    <p style={{ color: "#155dfd", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 }}>{title}</p>
    {children}
  </div>
);

const STATUS_TONES = { PENDING: "amber", APPROVED: "green", REJECTED: "red" };

const CertificateDetails = () => {
  const { certNo } = useParams();
  const location = useLocation();
  const basePrefix = location.pathname.startsWith("/admin")
    ? "/admin/company"
    : "/company";
  const navigate = useNavigate();
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [toast, setToast] = useState(null);
  const certRef = useRef(null);

  const API_BASE_URL = getApiBaseUrl();

  useEffect(() => {
    const fetchCertificate = async () => {
      try {
        setLoading(true);
        setError(null);

        const token =
          localStorage.getItem("token") ||
          localStorage.getItem("authToken") ||
          sessionStorage.getItem("token");

        console.log("Fetching certificate:", certNo);
        console.log("Token available:", token ? "Yes" : "No");

        const response = await fetch(`${API_BASE_URL}/Certificates/${certNo}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        });

        console.log("Response status:", response.status);
        console.log("Response ok:", response.ok);

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Certificate not found");
          }
          const errorText = await response.text();
          console.error("API Error Response:", errorText);
          throw new Error(
            `HTTP error! status: ${response.status} - ${errorText}`,
          );
        }

        const data = await response.json();
        console.log("Certificate data received:", data);

        setCertificate(data);
        // Initialize form data for editing
        setFormData(data);
      } catch (err) {
        console.error("Error fetching certificate:", err);
        setError(err.message || "Failed to fetch certificate");
      } finally {
        setLoading(false);
      }
    };

    if (certNo) {
      fetchCertificate();
    }
  }, [certNo]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      const token =
        localStorage.getItem("token") ||
        localStorage.getItem("authToken") ||
        sessionStorage.getItem("token");

      // PUT request to update certificate
      const response = await fetch(`${API_BASE_URL}/Certificates/${certNo}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to update certificate: ${response.status} - ${errorText}`,
        );
      }

      const updatedData = await response.json();
      setCertificate(updatedData);
      setIsEditing(false);
      setToast({ message: "Certificate updated.", type: "success" });
    } catch (err) {
      console.error("Error updating certificate:", err);
      setError(err.message || "Failed to update certificate");
    }
  };

  const handleDownloadPdf = async () => {
    console.log("Download button clicked");

    if (!certRef.current) {
      console.error("certRef.current is null");
      setToast({ message: "Certificate content not found. Please refresh the page.", type: "error" });
      return;
    }

    console.log("Starting PDF generation...");

    try {
      console.log("Capturing canvas...");
      const canvas = await html2canvas(certRef.current, {
        scale: 2,
        useCORS: true,
        scrollX: 0,
        scrollY: -window.scrollY,
        backgroundColor: "#ffffff",
        ignoreElements: (element) => {
          // Skip elements with print:hidden class
          return element.classList?.contains("print:hidden");
        },
        onclone: (clonedDoc) => {
          // 1. Sanitize all style tags to replace oklch/oklab with safe RGB
          const styles = clonedDoc.querySelectorAll("style");
          styles.forEach((style) => {
            if (
              style.textContent.includes("oklch") ||
              style.textContent.includes("oklab")
            ) {
              style.textContent = style.textContent
                .replace(/oklch\([^)]+\)/g, "#3b82f6")
                .replace(/oklab\([^)]+\)/g, "#3b82f6");
            }
          });

          // 2. Map original computed styles to cloned elements
          const capture = clonedDoc.querySelector('[data-cert-capture="true"]');
          if (capture && certRef.current) {
            const clonedEls = [capture, ...capture.querySelectorAll("*")];
            const originalEls = [
              certRef.current,
              ...certRef.current.querySelectorAll("*"),
            ];

            clonedEls.forEach((el, i) => {
              const orig = originalEls[i];
              if (!orig) return;

              const cs = clonedDoc.defaultView.getComputedStyle(orig);

              // Force colors to RGB/Hex fallbacks for both oklch and oklab
              const sanitizeColor = (val) => {
                if (!val) return val;
                if (val.includes("oklch") || val.includes("oklab"))
                  return "#1e3a8a";
                return val;
              };

              const bgColor = sanitizeColor(cs.backgroundColor);

              // Determine if background is dark by checking RGB values
              const isDarkBackground = (color) => {
                if (
                  !color ||
                  color === "transparent" ||
                  color === "rgba(0, 0, 0, 0)"
                )
                  return false;
                const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
                if (match) {
                  const r = parseInt(match[1]);
                  const g = parseInt(match[2]);
                  const b = parseInt(match[3]);
                  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
                  return brightness < 128;
                }
                return false;
              };

              // Check if parent or element has dark background
              const hasDarkBg =
                isDarkBackground(bgColor) ||
                orig.classList.contains("bg-blue-900") ||
                orig.classList.contains("bg-slate-900") ||
                orig.closest(".bg-blue-900") ||
                orig.closest(".bg-slate-900") ||
                orig.closest(".bg-gradient-to-r");

              // Force white text on dark backgrounds, very dark text on light backgrounds
              if (hasDarkBg) {
                el.style.color = "#ffffff";
              } else {
                // Force white text for body content sections
                el.style.color = "#ffffff";
              }

              el.style.backgroundColor = bgColor || "transparent";
              el.style.borderColor =
                sanitizeColor(cs.borderColor) || "transparent";
              el.style.outlineColor =
                sanitizeColor(cs.outlineColor) || "transparent";

              if (
                (cs.backgroundImage && cs.backgroundImage.includes("oklch")) ||
                (cs.backgroundImage && cs.backgroundImage.includes("oklab"))
              ) {
                el.style.backgroundImage = "none";
                if (
                  orig.classList.contains("bg-blue-900") ||
                  orig.closest(".bg-blue-900") ||
                  orig.classList.contains("bg-gradient-to-r") ||
                  orig.closest(".bg-gradient-to-r")
                ) {
                  el.style.backgroundColor = "#0f172a";
                } else {
                  el.style.backgroundColor = "#1e3a8a";
                }
              }

              // Clean inline style attributes that may contain oklch/oklab
              const inlineStyle = el.getAttribute("style");
              if (
                inlineStyle &&
                (inlineStyle.includes("oklch") || inlineStyle.includes("oklab"))
              ) {
                el.setAttribute(
                  "style",
                  inlineStyle
                    .replace(/oklch\([^)]+\)/g, "#3b82f6")
                    .replace(/oklab\([^)]+\)/g, "#3b82f6"),
                );
              }

              el.style.boxShadow = "none";
              el.style.textShadow = "none";
            });
          }
        },
      });

      console.log("Canvas captured successfully");

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const availableWidth = pageWidth - margin * 2;
      const availableHeight = pageHeight - margin * 2;

      let imgWidth = availableWidth;
      let imgHeight = (canvas.height * imgWidth) / canvas.width;

      if (imgHeight > availableHeight) {
        imgHeight = availableHeight;
        imgWidth = (canvas.width * imgHeight) / canvas.height;
      }

      const x = (pageWidth - imgWidth) / 2;
      const y = margin;

      console.log("Adding image to PDF...");
      pdf.addImage(
        imgData,
        "PNG",
        x,
        y,
        imgWidth,
        imgHeight,
        undefined,
        "FAST",
      );

      const fileName = `certificate-${
        formData.certNo || certificate?.certNo || "motor"
      }.pdf`;
      console.log("Saving PDF:", fileName);
      pdf.save(fileName);
      console.log("PDF saved successfully!");
    } catch (err) {
      console.error("PDF generation failed", err);
      setToast({ message: `Could not create the PDF: ${err.message}`, type: "error" });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return "₦0.0000";
    return `₦${new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    }).format(amount)}`;
  };

  if (loading) return <LoadingState label="Loading the certificate…" />;

  const back = (
    <button type="button" onClick={() => navigate(`${basePrefix}/certificates`)} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900">
      <ArrowLeft className="h-4 w-4" />
      Back to certificates
    </button>
  );

  if (error && !certificate) {
    return (
      <div>
        {back}
        <ErrorState title="Could not load this certificate" message={error} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  if (!certificate) {
    return (
      <div>
        {back}
        <EmptyState title="Certificate not found" text={`No certificate has the number ${certNo}.`} />
      </div>
    );
  }

  const status = String(certificate.tag || "PENDING").toUpperCase();
  const rate = certificate.rate ? `${(Number(certificate.rate) * 100).toFixed(2)}%` : null;

  const field = (name, label, props = {}) => (
    <Field label={label} wide={props.wide}>
      {props.textarea ? (
        <textarea name={name} value={formData[name] || ""} onChange={handleChange} rows={3} className={`${inputCls} h-auto py-2`} />
      ) : (
        <input name={name} value={formData[name] ?? ""} onChange={handleChange} type={props.type || "text"} step={props.step} min={props.min} max={props.max} className={inputCls} />
      )}
    </Field>
  );

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {back}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#155dfd]">Certificate</p>
          <h1 className="break-all font-mono text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{certificate.certNo}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-600">
            <StatusPill tone={STATUS_TONES[status] || "slate"}>{status}</StatusPill>
            {certificate.insuredName}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setIsEditing(true)} className={btnSecondary}>
            <Pencil className="h-4 w-4" />
            Edit
          </button>
          <button type="button" onClick={handleDownloadPdf} className={btnPrimary}>
            <Download className="h-4 w-4" />
            Download PDF
          </button>
        </div>
      </div>

      {error && <Notice tone="error" onClose={() => setError(null)}>{error}</Notice>}

      {/* The certificate itself; this block is what Download PDF captures. */}
      <div className="overflow-x-auto">
        <div ref={certRef} style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 20, overflow: "hidden", minWidth: 640 }}>
          <div style={{ background: "linear-gradient(90deg,#0b1f4d,#155dfd)", color: "#ffffff", padding: "26px 28px", display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-end" }}>
            <div>
              <p style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "#bfdbfe", fontWeight: 700 }}>Insurance certificate</p>
              <p style={{ fontSize: 26, fontWeight: 800, fontFamily: "ui-monospace, monospace", marginTop: 4 }}>{certificate.certNo}</p>
              <p style={{ fontSize: 14, color: "#dbeafe", marginTop: 2 }}>{certificate.insuredName || "–"}</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: 11, color: "#bfdbfe" }}>Gross premium</p>
              <p style={{ fontSize: 24, fontWeight: 800 }}>{formatCurrency(certificate.grossPrenium)}</p>
              <p style={{ fontSize: 12, color: "#dbeafe" }}>Status: {status}</p>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, padding: 24 }}>
            <Block title="Policy">
              <Row label="Policy number" value={certificate.policyNo} />
              <Row label="From" value={certificate.fromDesc} />
              <Row label="To" value={certificate.toDesc} />
              <Row label="Transaction date" value={formatDate(certificate.transDate)} />
              <Row label="Submitted" value={formatDate(certificate.submitDate)} />
              <Row label="Insurance company" value={certificate.insCompanyId} />
            </Block>
            <Block title="Insured">
              <Row label="Insured name" value={certificate.insuredName} />
              <Row label="Agent / broker ID" value={certificate.brokerId} />
              <Row label="Client ID" value={certificate.clientId} />
            </Block>
            <Block title="Cover">
              <Row label="Description" value={certificate.perDesc} />
              <Row label="Interest" value={certificate.interestDesc} />
              <Row label="Form M no" value={certificate.formMno} />
              <Row label="Remarks" value={certificate.remarks} />
            </Block>
            <Block title="Premium">
              <Row label="Insured value" value={formatCurrency(certificate.insuredValue)} />
              <Row label="Gross premium" value={formatCurrency(certificate.grossPrenium)} />
              <Row label="Rate" value={rate} />
            </Block>
          </div>
        </div>
      </div>

      {/* Edit */}
      {isEditing && (
        <Sheet
          open
          size="lg"
          onClose={() => {
            setIsEditing(false);
            setFormData(certificate);
          }}
          title="Edit certificate"
          sub={certificate.certNo}
          footer={
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setFormData(certificate);
                }}
                className={btnSecondary}
              >
                Cancel
              </button>
              <button type="submit" form="edit-certificate-form" className={btnPrimary}>
                <Save className="h-4 w-4" />
                Save changes
              </button>
            </div>
          }
        >
          {error && <Notice tone="error">{error}</Notice>}
          <form id="edit-certificate-form" onSubmit={handleSubmit} className="space-y-5">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900">
                <FileText className="h-4 w-4 text-[#155dfd]" />
                Policy
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {field("policyNo", "Policy number")}
                <Field label="Status">
                  <select name="tag" value={formData.tag || ""} onChange={handleChange} className={inputCls}>
                    <option value="">Select a status</option>
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </Field>
                {field("fromDesc", "From")}
                {field("toDesc", "To")}
                <Field label="Transaction date">
                  <input type="datetime-local" name="transDate" value={formData.transDate ? formData.transDate.slice(0, 16) : ""} onChange={handleChange} className={inputCls} />
                </Field>
                <Field label="Submit date">
                  <input type="datetime-local" name="submitDate" value={formData.submitDate ? formData.submitDate.slice(0, 16) : ""} onChange={handleChange} className={inputCls} />
                </Field>
                {field("insCompanyId", "Insurance company ID")}
                {field("certNo", "Certificate number")}
              </div>
            </section>
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900">
                <ShieldCheck className="h-4 w-4 text-[#155dfd]" />
                Insured and cover
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {field("insuredName", "Insured name")}
                {field("brokerId", "Agent / broker ID")}
                {field("clientId", "Client ID")}
                {field("formMno", "Form M no")}
                {field("perDesc", "Description", { wide: true })}
                {field("interestDesc", "Interest", { wide: true })}
                {field("remarks", "Remarks", { wide: true, textarea: true })}
              </div>
            </section>
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Wallet className="h-4 w-4 text-[#155dfd]" />
                Premium
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {field("insuredValue", "Insured value", { type: "number" })}
                {field("grossPrenium", "Gross premium", { type: "number" })}
                {field("rate", "Rate (0 to 1)", { type: "number", step: "0.01", min: "0", max: "1" })}
              </div>
            </section>
          </form>
        </Sheet>
      )}
    </div>
  );
};

export default CertificateDetails;
