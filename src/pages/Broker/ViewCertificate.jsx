import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

const ViewCertificate = () => {
  const { certNo } = useParams();
  const navigate = useNavigate();
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const certRef = useRef(null);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const options = {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      };
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

  useEffect(() => {
    const fetchCertificate = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem("token");
        const response = await axios.get(
          `https://gibsbrokersapi.newgibsonline.com/api/Certificate/motor/${certNo}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setCertificate(response.data);
      } catch (err) {
        console.error("Fetch error:", err);
        setError(
          err.response?.data?.message || "Failed to fetch certificate details"
        );
      } finally {
        setLoading(false);
      }
    };

    if (certNo) {
      fetchCertificate();
    }
  }, [certNo]);

  const handleGoBack = () => {
    navigate(-1);
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
      // Capture certificate area
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
                // If this element or ancestor uses dark header/background utility, keep dark base; else default dark blue fallback
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

      const margin = 10; // mm
      const availableWidth = pageWidth - margin * 2;
      const availableHeight = pageHeight - margin * 2;

      let imgWidth = availableWidth;
      let imgHeight = (canvas.height * imgWidth) / canvas.width;

      // If taller than a page, scale down to fit one page
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

      const fileName = `certificate-${certNo || "motor"}.pdf`;
      console.log("Saving PDF:", fileName);
      pdf.save(fileName);
      console.log("PDF saved successfully!");
    } catch (err) {
      console.error("PDF generation failed", err);
      alert(`Failed to generate PDF: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading certificate details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center">
              <svg
                className="h-6 w-6 text-red-600 mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <h3 className="text-red-800 font-medium">Error</h3>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
            <button
              onClick={handleGoBack}
              className="mt-4 inline-flex items-center px-4 py-2 bg-white border border-red-300 rounded-lg text-red-700 hover:bg-red-50 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!certificate) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header Actions */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
          <button
            onClick={handleGoBack}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            ← Go Back
          </button>

          <div className="flex gap-3">
            <button
              onClick={handleDownloadPdf}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
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
              Download Certificate
            </button>
          </div>
        </div>

        {/* Certificate Details Card */}
        <div
          ref={certRef}
          data-cert-capture="true"
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
                  Motor Insurance Certificate
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
                  certificate.status === "ACTIVE" ||
                  certificate.status === "APPROVED"
                    ? "bg-green-400"
                    : "bg-yellow-400"
                }`}
              ></div>
              <span className="text-sm font-bold tracking-wider uppercase">
                Status: {certificate.status || "N/A"}
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
                NIID VERIFIED: {certificate.niidStatus || "YES"}
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
                  label="Certificate Number"
                  value={certificate.certNo}
                />
                <DetailItem
                  label="Policy Number"
                  value={certificate.policyNo}
                />
                <DetailItem label="Broker ID" value={certificate.brokerID} />
                <DetailItem
                  label="Insurance Company ID"
                  value={certificate.insCompanyID}
                />
                <DetailItem
                  label="Reference DN/CN Number"
                  value={certificate.refDNCNNo}
                />
                <DetailItem
                  label="Transaction Date"
                  value={formatDate(certificate.transDate)}
                />
                <DetailItem
                  label="Start Date"
                  value={formatDate(certificate.startDate)}
                  highlightColor="text-blue-700"
                />
                <DetailItem
                  label="Expiry Date"
                  value={formatDate(certificate.expiryDate)}
                  highlightColor="text-red-600"
                />
                <DetailItem
                  label="Submit Date"
                  value={formatDate(certificate.submitDate)}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-indigo-50/50 p-6 rounded-xl border border-indigo-100">
                <DetailItem
                  label="Insured Name"
                  value={certificate.insuredName}
                  className="md:col-span-2"
                  valueClassName="text-xl font-bold text-indigo-900"
                />
                <DetailItem label="Email Address" value={certificate.email} />
                <DetailItem
                  label="Mobile Number"
                  value={certificate.mobileNo}
                />
                <DetailItem
                  label="Address"
                  value={certificate.address}
                  className="md:col-span-2"
                />
              </div>
            </div>

            {/* Vehicle Information */}
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
                  Vehicle Information
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 bg-emerald-50/50 p-6 rounded-xl border border-emerald-100">
                <DetailItem
                  label="Registration Number"
                  value={certificate.vehicleRegNum}
                  valueClassName="text-lg font-bold text-emerald-900"
                />
                <DetailItem
                  label="Vehicle Type"
                  value={certificate.vehicleType}
                />
                <DetailItem
                  label="Vehicle Make"
                  value={certificate.vehicleMake}
                />
                <DetailItem
                  label="Vehicle Brand"
                  value={certificate.vehicleBrand}
                />
                <DetailItem
                  label="Vehicle Color"
                  value={certificate.vehicleColor}
                />
                <DetailItem
                  label="Vehicle Year"
                  value={certificate.vehicleYear}
                />
                <DetailItem
                  label="Chassis Number"
                  value={certificate.chassisNum}
                />
                <DetailItem
                  label="Engine Number"
                  value={certificate.engineNum}
                />
                <DetailItem
                  label="Engine Capacity"
                  value={certificate.engineCapacity}
                />
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
                  value={formatCurrency(certificate.grossPremium)}
                  highlight
                  highlightColor="text-amber-700"
                />
                <DetailItem
                  label="Rate (%)"
                  value={certificate.rate || "N/A"}
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
                  {formatDate(certificate.submitDate || certificate.transDate)}
                </span>
              </div>
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
    </div>
  );
};

// Detail Item Component
const DetailItem = ({
  label,
  value,
  highlight,
  highlightColor = "text-green-600",
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

export default ViewCertificate;
