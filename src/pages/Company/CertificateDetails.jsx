import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

const DetailItem = ({
  label,
  value,
  highlight,
  highlightColor = "text-blue-600",
  className = "",
  valueClassName = "",
}) => {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
        {label}
      </p>
      <p
        className={`text-sm font-bold leading-tight ${
          highlight ? `${highlightColor} text-xl` : "text-slate-800"
        } ${valueClassName}`}
      >
        {value || "N/A"}
      </p>
    </div>
  );
};

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
  const certRef = useRef(null);

  const API_BASE_URL = "https://gibsbrokersapi.newgibsonline.com/api";

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
            `HTTP error! status: ${response.status} - ${errorText}`
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
          `Failed to update certificate: ${response.status} - ${errorText}`
        );
      }

      const updatedData = await response.json();
      setCertificate(updatedData);
      setIsEditing(false);
      alert("Certificate updated successfully!");
    } catch (err) {
      console.error("Error updating certificate:", err);
      setError(err.message || "Failed to update certificate");
    }
  };

  const handleDownloadPdf = async () => {
    console.log("Download button clicked");

    if (!certRef.current) {
      console.error("certRef.current is null");
      alert("Certificate content not found. Please try refreshing the page.");
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
                    .replace(/oklab\([^)]+\)/g, "#3b82f6")
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
        "FAST"
      );

      const fileName = `certificate-${
        formData.certNo || certificate?.certNo || "motor"
      }.pdf`;
      console.log("Saving PDF:", fileName);
      pdf.save(fileName);
      console.log("PDF saved successfully!");
    } catch (err) {
      console.error("PDF generation failed", err);
      alert(`Failed to generate PDF: ${err.message}`);
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

  if (loading) {
    return (
      <div className="p-4 sm:p-8 text-center">
        <div className="flex items-center justify-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Loading certificate details...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <strong>Error:</strong> {error}
            </div>
          </div>
          <div className="mt-4">
            <button
              onClick={() => navigate(`${basePrefix}/certificates`)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              Back to Certificates
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!certificate) {
    return (
      <div className="p-4 sm:p-8">
        <div className="text-center">
          <div className="mb-4 text-gray-600">Certificate not found</div>
          <button
            onClick={() => navigate(`${basePrefix}/certificates`)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Back to Certificates
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header Section */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              Certificate Details
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              View and manage certificate information
            </p>
          </div>
          <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-500">
            <svg
              className="w-4 h-4 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span className="break-all">
              Certificate No: {certificate.certNo}
            </span>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <div className="flex-1">
              <span className="font-medium">{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-4 text-red-600 hover:text-red-800"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Certificate Form */}
      <div
        ref={certRef}
        data-cert-capture="true"
        className="bg-white rounded-xl shadow-sm border border-gray-200"
        style={{ pageBreakInside: "avoid" }}
      >
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 print:hidden">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                Certificate Information
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                {isEditing
                  ? "Edit certificate details"
                  : "View certificate details"}
              </p>
            </div>
            {!isEditing && (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center justify-center px-3 sm:px-4 py-2 bg-blue-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  Edit
                </button>
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  className="inline-flex items-center justify-center px-3 sm:px-4 py-2 bg-gray-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v9m0 0l-3-3m3 3l3-3M5 19h14a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                    />
                  </svg>
                  <span className="hidden xs:inline">Download Certificate</span>
                  <span className="xs:hidden">Download</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {!isEditing ? (
          <div
            className="bg-white rounded-xl shadow-2xl border-4 border-blue-800 overflow-hidden max-w-5xl mx-auto relative"
            style={{ pageBreakInside: "avoid" }}
          >
            {/* Decorative Corner */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-800 transform rotate-45 translate-x-16 -translate-y-16 opacity-10 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-800 transform rotate-45 -translate-x-16 translate-y-16 opacity-10 pointer-events-none"></div>

            {/* Header */}
            <div className="bg-gradient-to-r from-blue-800 via-blue-700 to-blue-900 px-8 py-10 text-white relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                <svg
                  width="100%"
                  height="100%"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <pattern
                      id="grid"
                      width="40"
                      height="40"
                      patternUnits="userSpaceOnUse"
                    >
                      <path
                        d="M 40 0 L 0 0 0 40"
                        fill="none"
                        stroke="white"
                        strokeWidth="1"
                      />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
              </div>

              <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="text-center md:text-left">
                  <h1 className="text-4xl font-extrabold tracking-tight mb-2 uppercase">
                    Insurance Certificate
                  </h1>
                  <div className="h-1 w-32 bg-yellow-400 mx-auto md:mx-0 mb-4"></div>
                  <p className="text-blue-100 text-lg font-medium">
                    Official Document • Validated & Secured
                  </p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/20 text-center min-w-[200px]">
                  <p className="text-xs uppercase tracking-widest text-blue-200 mb-1 font-bold">
                    Certificate No
                  </p>
                  <p className="text-2xl font-mono font-bold text-yellow-400">
                    {certificate.certNo}
                  </p>
                </div>
              </div>
            </div>

            {/* Status & Verification Bar */}
            <div className="px-8 py-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-3 h-3 rounded-full animate-pulse ${
                    certificate.tag === "APPROVED"
                      ? "bg-green-400"
                      : "bg-yellow-400"
                  }`}
                ></div>
                <span className="text-sm font-bold tracking-wider uppercase">
                  Status: {certificate.tag || "PENDING"}
                </span>
              </div>
              <div className="flex items-center gap-6 text-xs font-medium text-slate-400">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-blue-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 4.946-2.397 9.331-6 12.127A11.954 11.954 0 0110 19.056 11.954 11.954 0 012.166 7c0-.68.056-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  VERIFIED DOCUMENT
                </div>
                <div className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-blue-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path
                      fillRule="evenodd"
                      d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  SECURE VIEW
                </div>
              </div>
            </div>

            {/* Certificate Details */}
            <div className="p-8 sm:p-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
              {/* Policy Information */}
              <div className="mb-10 relative">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-blue-100 rounded-lg text-blue-800">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-blue-900 uppercase tracking-tight">
                    Policy Information
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 bg-blue-50/50 p-6 rounded-xl border border-blue-100">
                  <DetailItem
                    label="Policy Number"
                    value={certificate.policyNo}
                  />
                  <DetailItem
                    label="From Date"
                    value={certificate.fromDesc}
                    highlightColor="text-blue-700"
                  />
                  <DetailItem
                    label="To Date"
                    value={certificate.toDesc}
                    highlightColor="text-red-600"
                  />
                  <DetailItem
                    label="Transaction Date"
                    value={formatDate(certificate.transDate)}
                  />
                  <DetailItem
                    label="Submit Date"
                    value={formatDate(certificate.submitDate)}
                  />
                  <DetailItem
                    label="Insurance Company ID"
                    value={certificate.insCompanyId}
                  />
                </div>
              </div>

              {/* Insured Information */}
              <div className="mb-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-indigo-100 rounded-lg text-indigo-800">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-indigo-900 uppercase tracking-tight">
                    Insured Information
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 bg-indigo-50/50 p-6 rounded-xl border border-indigo-100">
                  <DetailItem
                    label="Insured Name"
                    value={certificate.insuredName}
                    className="md:col-span-2"
                    valueClassName="text-xl font-bold text-indigo-900"
                  />
                  <DetailItem label="Broker ID" value={certificate.brokerId} />
                  <DetailItem label="Client ID" value={certificate.clientId} />
                </div>
              </div>

              {/* Description & Interest */}
              <div className="mb-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-emerald-100 rounded-lg text-emerald-800">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-emerald-900 uppercase tracking-tight">
                    Description & Interest
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-emerald-50/50 p-6 rounded-xl border border-emerald-100">
                  <DetailItem
                    label="Per Description"
                    value={certificate.perDesc}
                    className="md:col-span-2"
                  />
                  <DetailItem
                    label="Interest Description"
                    value={certificate.interestDesc}
                    className="md:col-span-2"
                  />
                  <DetailItem label="Form Mno" value={certificate.formMno} />
                  <DetailItem label="Remarks" value={certificate.remarks} />
                </div>
              </div>

              {/* Financial Information */}
              <div className="mb-4">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-amber-100 rounded-lg text-amber-800">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-amber-900 uppercase tracking-tight">
                    Financial Information
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 bg-amber-50/50 p-6 rounded-xl border border-amber-100">
                  <DetailItem
                    label="Insured Value"
                    value={formatCurrency(certificate.insuredValue)}
                    highlight
                    highlightColor="text-amber-700"
                  />
                  <DetailItem
                    label="Gross Premium"
                    value={formatCurrency(certificate.grossPrenium)}
                    highlight
                    highlightColor="text-amber-700"
                  />
                  <DetailItem
                    label="Rate (%)"
                    value={
                      certificate.rate
                        ? `${(certificate.rate * 100).toFixed(2)}%`
                        : "0.00%"
                    }
                  />
                </div>
              </div>
            </div>

            {/* Official Seal Placeholder */}
            <div className="absolute bottom-10 right-10 opacity-20 pointer-events-none">
              <div className="w-32 h-32 border-8 border-blue-900 rounded-full flex items-center justify-center text-blue-900 font-black text-center transform -rotate-12">
                OFFICIAL
                <br />
                SEAL
              </div>
            </div>

            {/* Footer */}
            <div className="px-8 py-6 bg-slate-50 border-t border-gray-200 print:hidden">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span>
                    Generated on{" "}
                    {formatDate(
                      certificate.submitDate || certificate.transDate
                    )}
                  </span>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-bold uppercase tracking-wider transition-all hover:underline"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    Edit
                  </button>
                  <button
                    onClick={handleDownloadPdf}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-bold uppercase tracking-wider transition-all hover:underline"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                    Download Official Copy
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 sm:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Certificate No */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Certificate No
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="certNo"
                    value={formData.certNo || ""}
                    onChange={handleChange}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                  />
                ) : (
                  <div className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-gray-50 border border-gray-200 rounded-lg text-gray-900 font-medium break-all">
                    {certificate.certNo}
                  </div>
                )}
              </div>

              {/* Insured Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Insured Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="insuredName"
                    value={formData.insuredName || ""}
                    onChange={handleChange}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                  />
                ) : (
                  <div className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-gray-50 border border-gray-200 rounded-lg text-gray-900 font-medium break-all">
                    {certificate.insuredName}
                  </div>
                )}
              </div>

              {/* Broker ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Broker ID
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="brokerId"
                    value={formData.brokerId || ""}
                    onChange={handleChange}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                ) : (
                  <div className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                    {certificate.brokerId || "N/A"}
                  </div>
                )}
              </div>

              {/* Client ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client ID
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="clientId"
                    value={formData.clientId || ""}
                    onChange={handleChange}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                ) : (
                  <div className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                    {certificate.clientId || "N/A"}
                  </div>
                )}
              </div>

              {/* Transaction Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transaction Date
                </label>
                {isEditing ? (
                  <input
                    type="datetime-local"
                    name="transDate"
                    value={
                      formData.transDate ? formData.transDate.slice(0, 16) : ""
                    }
                    onChange={handleChange}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                ) : (
                  <div className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-gray-50 border border-gray-200 rounded-lg text-gray-900 flex items-center">
                    <svg
                      className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    {formatDate(certificate.transDate)}
                  </div>
                )}
              </div>

              {/* Policy No */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Policy No
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="policyNo"
                    value={formData.policyNo || ""}
                    onChange={handleChange}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                ) : (
                  <div className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-gray-50 border border-gray-200 rounded-lg text-gray-900 font-medium break-all">
                    {certificate.policyNo || "N/A"}
                  </div>
                )}
              </div>

              {/* Per Description */}
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Per Description
                </label>
                {isEditing ? (
                  <textarea
                    name="perDesc"
                    value={formData.perDesc || ""}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                ) : (
                  <div className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-gray-50 border border-gray-200 rounded-lg text-gray-900 whitespace-pre-line">
                    {certificate.perDesc || "N/A"}
                  </div>
                )}
              </div>

              {/* From Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  From
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="fromDesc"
                    value={formData.fromDesc || ""}
                    onChange={handleChange}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                ) : (
                  <div className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                    {certificate.fromDesc || "N/A"}
                  </div>
                )}
              </div>

              {/* To Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  To
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="toDesc"
                    value={formData.toDesc || ""}
                    onChange={handleChange}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                ) : (
                  <div className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                    {certificate.toDesc || "N/A"}
                  </div>
                )}
              </div>

              {/* Interest Description */}
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Interest Description
                </label>
                {isEditing ? (
                  <textarea
                    name="interestDesc"
                    value={formData.interestDesc || ""}
                    onChange={handleChange}
                    rows={2}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                ) : (
                  <div className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-gray-50 border border-gray-200 rounded-lg text-gray-900 whitespace-pre-line">
                    {certificate.interestDesc || "N/A"}
                  </div>
                )}
              </div>

              {/* Rate */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rate
                </label>
                {isEditing ? (
                  <div className="relative">
                    <input
                      type="number"
                      name="rate"
                      value={formData.rate || ""}
                      onChange={handleChange}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 pr-8 sm:pr-12 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      step="0.01"
                      min="0"
                      max="1"
                    />
                    <span className="absolute right-3 sm:right-4 top-2.5 sm:top-3.5 text-gray-500 text-sm">
                      %
                    </span>
                  </div>
                ) : (
                  <div className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-gray-50 border border-gray-200 rounded-lg text-gray-900 font-medium">
                    {certificate.rate
                      ? `${(certificate.rate * 100).toFixed(2)}%`
                      : "0.00%"}
                  </div>
                )}
              </div>

              {/* Insured Value */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Insured Value
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    name="insuredValue"
                    value={formData.insuredValue || ""}
                    onChange={handleChange}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    step="0.01"
                    min="0"
                  />
                ) : (
                  <div className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-gray-50 border border-gray-200 rounded-lg font-semibold text-green-600 break-all">
                    {formatCurrency(certificate.insuredValue)}
                  </div>
                )}
              </div>

              {/* Gross Premium */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gross Premium
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    name="grossPrenium"
                    value={formData.grossPrenium || ""}
                    onChange={handleChange}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    step="0.01"
                    min="0"
                  />
                ) : (
                  <div className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-gray-50 border border-gray-200 rounded-lg font-semibold text-green-600 break-all">
                    {formatCurrency(certificate.grossPrenium)}
                  </div>
                )}
              </div>

              {/* Form Mno */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Form Mno
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="formMno"
                    value={formData.formMno || ""}
                    onChange={handleChange}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                ) : (
                  <div className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                    {certificate.formMno || "N/A"}
                  </div>
                )}
              </div>

              {/* Status/Tag */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                {isEditing ? (
                  <select
                    name="tag"
                    value={formData.tag || ""}
                    onChange={handleChange}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="">Select Status</option>
                    <option value="PENDING">PENDING</option>
                    <option value="APPROVED">APPROVED</option>
                    <option value="REJECTED">REJECTED</option>
                  </select>
                ) : (
                  <div className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-gray-50 border border-gray-200 rounded-lg">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        certificate.tag === "APPROVED"
                          ? "bg-green-100 text-green-800"
                          : certificate.tag === "REJECTED"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {certificate.tag || "PENDING"}
                    </span>
                  </div>
                )}
              </div>

              {/* Remarks */}
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Remarks
                </label>
                {isEditing ? (
                  <textarea
                    name="remarks"
                    value={formData.remarks || ""}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                ) : (
                  <div className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-gray-50 border border-gray-200 rounded-lg text-gray-900 whitespace-pre-line">
                    {certificate.remarks || "N/A"}
                  </div>
                )}
              </div>

              {/* Submit Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Submit Date
                </label>
                {isEditing ? (
                  <input
                    type="datetime-local"
                    name="submitDate"
                    value={
                      formData.submitDate
                        ? formData.submitDate.slice(0, 16)
                        : ""
                    }
                    onChange={handleChange}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                ) : (
                  <div className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-gray-50 border border-gray-200 rounded-lg text-gray-900 flex items-center">
                    <svg
                      className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    {formatDate(certificate.submitDate)}
                  </div>
                )}
              </div>

              {/* Insurance Company ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Insurance Company ID
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="insCompanyId"
                    value={formData.insCompanyId || ""}
                    onChange={handleChange}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                ) : (
                  <div className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                    {certificate.insCompanyId || "N/A"}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 pt-6 mt-6 sm:mt-8 border-t border-gray-200">
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setFormData(certificate); // Reset form data
                      setError(null); // Clear any errors
                    }}
                    className="inline-flex items-center justify-center px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base text-gray-600 hover:text-gray-800 font-medium transition-colors order-2 sm:order-1"
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center px-6 sm:px-8 py-2 sm:py-3 text-sm sm:text-base bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors order-1 sm:order-2"
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Save Changes
                  </button>
                </>
              ) : (
                <Link
                  to={`${basePrefix}/certificates`}
                  className="inline-flex items-center justify-center px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                  Go Back
                </Link>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default CertificateDetails;
