import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

const DownloadCertificates = ({
  userType = "company",
  userId = "STACO-MARINE",
}) => {
  const location = useLocation();
  const basePrefix = location.pathname.startsWith("/admin-dashboard")
    ? "/admin/company"
    : "/company";
  const [showCalendar1, setShowCalendar1] = useState(false);
  const [showCalendar2, setShowCalendar2] = useState(false);
  const [date1, setDate1] = useState(null);
  const [date2, setDate2] = useState(null);
  const [selectedFormat, setSelectedFormat] = useState("pdf");
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadMessage, setDownloadMessage] = useState("");
  const [certificates, setCertificates] = useState([]);
  const [filteredCertificates, setFilteredCertificates] = useState([]);

  const calendar1Ref = useRef(null);
  const calendar2Ref = useRef(null);

  const API_BASE_URL = "https://gibsbrokersapi.newgibsonline.com/api";

  // Determine back link based on user type
  const backLink =
    userType === "broker"
      ? "/brokers-dashboard/certificates"
      : `${basePrefix}/certificates`;

  // Fetch certificates from backend
  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        const token = localStorage.getItem("token") || 
                     localStorage.getItem("authToken") || 
                     sessionStorage.getItem("token");

        if (!token) {
          throw new Error("Authentication token not found");
        }

        const response = await fetch(`${API_BASE_URL}/Certificates`, {
          method: 'GET',
          headers: {
            'accept': 'text/plain',
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch certificates: ${response.status}`);
        }

        const data = await response.json();
        setCertificates(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching certificates:', error);
        setDownloadMessage("Failed to load certificates");
      }
    };

    fetchCertificates();
  }, []);

  // Filter certificates based on date range
  useEffect(() => {
    if (date1 && date2 && certificates.length > 0) {
      const filtered = certificates.filter(cert => {
        const certDate = new Date(cert.transDate);
        return certDate >= date1 && certDate <= date2;
      });
      setFilteredCertificates(filtered);
    } else {
      setFilteredCertificates([]);
    }
  }, [date1, date2, certificates]);

  // Handle click outside calendar
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendar1Ref.current && !calendar1Ref.current.contains(event.target)) {
        setShowCalendar1(false);
      }
      if (calendar2Ref.current && !calendar2Ref.current.contains(event.target)) {
        setShowCalendar2(false);
      }
    };

    if (showCalendar1 || showCalendar2) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showCalendar1, showCalendar2]);

  const formatDate = (date) => {
    return date ? date.toLocaleDateString("en-GB") : "";
  };

  const formatDateForAPI = (date) => {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Generate CSV content from certificates data
  const generateCSV = (certs) => {
    if (certs.length === 0) return "";
    
    const headers = Object.keys(certs[0]).join(',');
    const rows = certs.map(cert => 
      Object.values(cert).map(value => 
        `"${value ? value.toString().replace(/"/g, '""') : ''}"`
      ).join(',')
    );
    
    return [headers, ...rows].join('\n');
  };

  // Generate Excel file (simplified - using CSV with .xlsx extension)
  const generateExcel = (certs) => {
    // For simplicity, we'll generate CSV but with .xlsx extension
    // In a real implementation, you might want to use a library like xlsx
    return generateCSV(certs);
  };

  // Generate PDF content (simplified - would need a proper PDF library)
  const generatePDFContent = (certs) => {
    // This is a simplified version. In practice, you'd use a PDF library
    let content = "CERTIFICATES REPORT\n\n";
    certs.forEach(cert => {
      content += `Certificate No: ${cert.certNo}\n`;
      content += `Insured Name: ${cert.insuredName}\n`;
      content += `Policy No: ${cert.policyNo}\n`;
      content += `Transaction Date: ${cert.transDate}\n`;
      content += `Insured Value: ${cert.insuredValue}\n`;
      content += `Premium: ${cert.grossPrenium}\n`;
      content += "------------------------\n";
    });
    return content;
  };

  const handleDownload = async () => {
    if (!date1 || !date2) {
      setDownloadMessage("Please select both start and end dates");
      return;
    }

    if (filteredCertificates.length === 0) {
      setDownloadMessage("No certificates found for the selected date range");
      return;
    }

    setIsDownloading(true);
    setDownloadMessage("");

    try {
      let content, mimeType, extension;

      switch (selectedFormat) {
        case 'csv':
          content = generateCSV(filteredCertificates);
          mimeType = 'text/csv';
          extension = 'csv';
          break;
        case 'excel':
          content = generateExcel(filteredCertificates);
          mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          extension = 'xlsx';
          break;
        case 'pdf':
          content = generatePDFContent(filteredCertificates);
          mimeType = 'application/pdf';
          extension = 'pdf';
          break;
        default:
          throw new Error('Unsupported format');
      }

      // Create blob and download
      const blob = new Blob([content], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      
      const fromDate = formatDateForAPI(date1);
      const toDate = formatDateForAPI(date2);
      const filename = `certificates_${fromDate}_to_${toDate}.${extension}`;
      a.download = filename;
      
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setDownloadMessage(`Downloaded ${filteredCertificates.length} certificates successfully!`);
      
    } catch (error) {
      console.error('Download error:', error);
      setDownloadMessage(`Download failed: ${error.message}`);
    } finally {
      setIsDownloading(false);
    }
  };

  // Alternative: Download from backend if you have a dedicated download endpoint
  const handleBackendDownload = async () => {
    if (!date1 || !date2) {
      setDownloadMessage("Please select both start and end dates");
      return;
    }

    setIsDownloading(true);
    setDownloadMessage("");

    try {
      const token = localStorage.getItem("token") || 
                   localStorage.getItem("authToken") || 
                   sessionStorage.getItem("token");

      if (!token) {
        throw new Error("Authentication token not found");
      }

      const fromDate = formatDateForAPI(date1);
      const toDate = formatDateForAPI(date2);

      // If your backend has a dedicated download endpoint
      const downloadUrl = `${API_BASE_URL}/Certificates/download?fromDate=${fromDate}&toDate=${toDate}&format=${selectedFormat}`;

      const response = await fetch(downloadUrl, {
        method: 'GET',
        headers: {
          'accept': 'text/plain',
          'Authorization': `Bearer ${token}`,
        }
      });

      if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      
      // Get filename from response headers or create one
      const contentDisposition = response.headers.get('content-disposition');
      let filename = `certificates_${fromDate}_to_${toDate}.${selectedFormat}`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch) filename = filenameMatch[1];
      }
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setDownloadMessage("Download completed successfully!");
      
    } catch (error) {
      console.error('Backend download error:', error);
      // Fallback to client-side generation
      handleDownload();
    } finally {
      setIsDownloading(false);
    }
  };

  const FormatOption = ({ format, label, description, iconColor }) => (
    <div 
      className={`p-3 sm:p-4 border rounded-lg transition-colors cursor-pointer ${
        selectedFormat === format 
          ? "border-blue-300 bg-blue-50" 
          : "border-gray-200 hover:border-blue-300 hover:bg-blue-50"
      }`}
      onClick={() => setSelectedFormat(format)}
    >
      <div className="flex items-center space-x-2 sm:space-x-3">
        <svg
          className={`w-6 h-6 sm:w-8 sm:h-8 ${iconColor} flex-shrink-0`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
            clipRule="evenodd"
          />
        </svg>
        <div>
          <p className="font-medium text-gray-900 text-sm sm:text-base">
            {label}
          </p>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
        {selectedFormat === format && (
          <svg className="w-5 h-5 text-blue-600 ml-auto" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header Section */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              Download Certificates
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              Download certificates within a specific date range
            </p>
          </div>
          <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Certificate Export</span>
          </div>
        </div>
      </div>

      {/* Download Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">
            Export Configuration
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            Select certificates and date range for download
          </p>
        </div>

        <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
          {/* Certificates Selection */}
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              CERTIFICATES
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm sm:text-base">
                      {certificates.length} Certificates Loaded
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600">
                      {filteredCertificates.length} certificates match selected date range
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="inline-flex px-2 sm:px-3 py-1 text-xs font-semibold bg-green-100 text-green-800 border border-green-200 rounded-full">
                    Ready
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Date Range Selection */}
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Date Range
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* From Date */}
              <div className="relative">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  From Date
                </label>
                <div className="relative">
                  <div
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-10 sm:pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors cursor-pointer hover:bg-gray-50 text-sm sm:text-base"
                    onClick={() => {
                      setShowCalendar1(true);
                      setShowCalendar2(false);
                    }}
                  >
                    {formatDate(date1) || "Select date"}
                  </div>
                  <svg className="absolute right-3 sm:right-4 top-2.5 sm:top-3.5 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                {date1 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Selected: {formatDate(date1)}
                  </p>
                )}
                {showCalendar1 && (
                  <div ref={calendar1Ref} className="absolute z-20 mt-1 bg-white shadow-lg rounded-lg border border-gray-200 left-0 right-0 sm:left-auto sm:right-auto sm:w-auto">
                    <Calendar
                      onChange={(date) => {
                        setDate1(date);
                        setShowCalendar1(false);
                      }}
                      value={date1}
                      className="react-calendar-mobile"
                    />
                  </div>
                )}
              </div>

              {/* To Date */}
              <div className="relative">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  To Date
                </label>
                <div className="relative">
                  <div
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-10 sm:pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors cursor-pointer hover:bg-gray-50 text-sm sm:text-base"
                    onClick={() => {
                      setShowCalendar2(true);
                      setShowCalendar1(false);
                    }}
                  >
                    {formatDate(date2) || "Select date"}
                  </div>
                  <svg className="absolute right-3 sm:right-4 top-2.5 sm:top-3.5 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                {date2 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Selected: {formatDate(date2)}
                  </p>
                )}
                {showCalendar2 && (
                  <div ref={calendar2Ref} className="absolute z-20 mt-1 bg-white shadow-lg rounded-lg border border-gray-200 left-0 right-0 sm:left-auto sm:right-auto sm:w-auto">
                    <Calendar
                      onChange={(date) => {
                        setDate2(date);
                        setShowCalendar2(false);
                      }}
                      value={date2}
                      className="react-calendar-mobile"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Date Range Summary */}
            {date1 && date2 && (
              <div className="mt-4 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start sm:items-center">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 mr-2 mt-0.5 sm:mt-0 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-xs sm:text-sm font-medium text-green-800">
                    Date range selected: {formatDate(date1)} to {formatDate(date2)} | {filteredCertificates.length} certificates found
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Download Options */}
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export Format
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <FormatOption format="pdf" label="PDF" description="Portable Document" iconColor="text-red-600" />
              <FormatOption format="excel" label="Excel" description="Spreadsheet Format" iconColor="text-green-600" />
              <FormatOption format="csv" label="CSV" description="Comma Separated" iconColor="text-blue-600" />
            </div>
          </div>

          {/* Status Messages */}
          {downloadMessage && (
            <div className={`p-3 sm:p-4 rounded-lg ${
              downloadMessage.includes("failed") 
                ? "bg-red-50 border border-red-200 text-red-800"
                : "bg-green-50 border border-green-200 text-green-800"
            }`}>
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d={downloadMessage.includes("failed") ? "M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" : "M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"} clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">{downloadMessage}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center pt-4 sm:pt-6 border-t border-gray-200 space-y-3 space-y-reverse sm:space-y-0 gap-3 sm:gap-0">
            <Link to={backLink} className="inline-flex items-center justify-center sm:justify-start px-4 sm:px-6 py-2.5 sm:py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors text-sm sm:text-base">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Go Back
            </Link>
            <button
              onClick={handleDownload}
              disabled={!date1 || !date2 || isDownloading || filteredCertificates.length === 0}
              className={`inline-flex items-center justify-center px-6 sm:px-8 py-2.5 sm:py-3 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 text-sm sm:text-base ${
                date1 && date2 && !isDownloading && filteredCertificates.length > 0
                  ? "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {isDownloading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  <span>DOWNLOADING...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M4 7h16" />
                  </svg>
                  <span className="hidden sm:inline">DOWNLOAD CERTIFICATES ({filteredCertificates.length})</span>
                  <span className="sm:hidden">DOWNLOAD ({filteredCertificates.length})</span>
                </>
              )}
            </button>
          </div>

          {/* Status Message */}
          {(!date1 || !date2) && !downloadMessage && (
            <div className="mt-4 p-3 sm:p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start sm:items-center">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 mr-2 mt-0.5 sm:mt-0 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs sm:text-sm font-medium text-yellow-800">
                  Please select both start and end dates to enable download
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Custom CSS for mobile calendar */}
      <style jsx>{`
        @media (max-width: 640px) {
          .react-calendar-mobile {
            width: 100% !important;
            max-width: 100% !important;
          }
          .react-calendar-mobile .react-calendar__navigation {
            flex-wrap: wrap;
          }
          .react-calendar-mobile .react-calendar__tile {
            max-width: 100%;
            padding: 0.5em 0.2em;
            font-size: 0.8em;
          }
        }
      `}</style>
    </div>
  );
};

export default DownloadCertificates;