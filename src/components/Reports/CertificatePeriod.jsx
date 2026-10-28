import React, { useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { toast } from "react-hot-toast";
import { FileCheck2 } from "lucide-react";
import { getApiBaseUrl } from "../../utils/config";
import { DateRangeFields, ReportLayout } from "./ReportKit";
import { today } from "./dateRange";

const API_BASE_URL = getApiBaseUrl();

const COLUMNS = [
  "Date",
  "Full name",
  "Policy no",
  "Certificate no",
  "Insured value",
  "Premium",
  "Rate %",
  "From / To",
  "Description",
  "Status",
  "Broker ID",
  "Form M no",
  "Remarks",
  "Phone",
  "Email",
  "Totals",
  "Detailed data sheet",
];

const CertificatePeriodReport = () => {
  const [dateRange, setDateRange] = useState({
    period1: today(),
    period2: today(),
  });
  const [loading, setLoading] = useState(false);
  const [dataCount, setDataCount] = useState(0);
  const [lastRunAt, setLastRunAt] = useState(null);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "";
      return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "";
    }
  };

  const generateExcelReport = async () => {
    if (!dateRange.period1 || !dateRange.period2) {
      toast.error("Please select both start and end dates");
      return;
    }

    const startDate = new Date(dateRange.period1);
    const endDate = new Date(dateRange.period2);

    if (startDate > endDate) {
      toast.error("Start date cannot be after end date");
      return;
    }

    try {
      setLoading(true);
      toast.loading("Fetching certificate data...");

      const token = localStorage.getItem("token");
      const headers = {
        Accept: "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      };

      // Prepare parameters with time component
      const params = {
        period1: dateRange.period1 + "T00:00:00",
        period2: dateRange.period2 + "T23:59:59",
      };

      console.log("Fetching data with params:", params);

      // Fetch the JSON data
      const response = await axios.get(
        `${API_BASE_URL}/Reports/All-Certificate-Period`,
        {
          headers,
          params,
          timeout: 60000,
        },
      );

      // Extract data from response
      let certificatesData = [];

      if (Array.isArray(response.data)) {
        certificatesData = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        certificatesData = response.data.data;
      } else if (response.data?.data) {
        certificatesData = response.data.data;
      } else {
        throw new Error("Invalid response format from server");
      }

      if (certificatesData.length === 0) {
        toast.dismiss();
        toast.error("No certificates found for the selected date range");
        setLoading(false);
        return;
      }

      setDataCount(certificatesData.length);
      setLastRunAt(new Date());
      toast.dismiss();
      toast.success(
        `Found ${certificatesData.length} certificates. Generating Excel file...`,
      );

      // Create workbook
      const wb = XLSX.utils.book_new();

      // Prepare data for main sheet (structured like NSIA report)
      const mainSheetData = [];

      // Report Header
      mainSheetData.push(["CERTIFICATE PERIOD REPORT"]);
      mainSheetData.push([]);
      mainSheetData.push([
        "Report Period:",
        `${formatDate(dateRange.period1)} to ${formatDate(dateRange.period2)}`,
      ]);
      mainSheetData.push([
        "Generated On:",
        new Date().toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      ]);
      mainSheetData.push([]);
      mainSheetData.push([]);

      // Table Headers (matching NSIA format)
      const tableHeaders = [
        "Date",
        "Full Name",
        "Policy No",
        "Certificate No",
        "Insured Value",
        "Premium",
        "Rate %",
        "From",
        "To",
        "Description",
        "Status",
        "Broker ID",
        "Transaction Date",
        "Form M No",
        "Remarks",
        "Phone",
        "Email",
      ];
      mainSheetData.push(tableHeaders);

      // Data rows
      certificatesData.forEach((cert) => {
        mainSheetData.push([
          formatDate(cert.TransDate), // Date
          cert.InsuredName || "", // Full Name
          cert.PolicyNo || "", // Policy No
          cert.CertNo || "", // Certificate No
          cert.InsuredValue || 0, // Insured Value
          cert.GrossPrenium || 0, // Premium
          cert.Rate ? `${(cert.Rate * 100).toFixed(2)}%` : "0.00%", // Rate %
          cert.FromDesc || "", // From
          cert.ToDesc || "", // To
          cert.PerDesc || "", // Description
          cert.Tag || "PENDING", // Status
          cert.BrokerID || "", // Broker ID
          formatDate(cert.TransDate), // Transaction Date
          cert.FormMNo || "", // Form M No
          cert.Remarks || "", // Remarks
          cert.Field104 || "", // Phone
          cert.Field105 || "", // Email
        ]);
      });

      // Add summary section
      mainSheetData.push([]);
      mainSheetData.push([]);
      mainSheetData.push(["SUMMARY"]);
      mainSheetData.push([]);

      // Calculate totals
      const totalInsuredValue = certificatesData.reduce(
        (sum, cert) => sum + (cert.InsuredValue || 0),
        0,
      );
      const totalPremium = certificatesData.reduce(
        (sum, cert) => sum + (cert.GrossPrenium || 0),
        0,
      );

      mainSheetData.push(["Total Certificates:", certificatesData.length]);
      mainSheetData.push(["Total Insured Value:", totalInsuredValue]);
      mainSheetData.push(["Total Premium:", totalPremium]);
      mainSheetData.push([
        "Average Rate:",
        `${((certificatesData.reduce((sum, cert) => sum + (cert.Rate || 0), 0) / certificatesData.length) * 100).toFixed(2)}%`,
      ]);

      // Create main worksheet
      const ws = XLSX.utils.aoa_to_sheet(mainSheetData);

      // Set column widths
      const colWidths = [
        { wch: 12 }, // Date
        { wch: 35 }, // Full Name
        { wch: 20 }, // Policy No
        { wch: 20 }, // Certificate No
        { wch: 15 }, // Insured Value
        { wch: 15 }, // Premium
        { wch: 10 }, // Rate %
        { wch: 15 }, // From
        { wch: 15 }, // To
        { wch: 40 }, // Description
        { wch: 12 }, // Status
        { wch: 15 }, // Broker ID
        { wch: 15 }, // Transaction Date
        { wch: 20 }, // Form M No
        { wch: 30 }, // Remarks
        { wch: 15 }, // Phone
        { wch: 30 }, // Email
      ];
      ws["!cols"] = colWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, "Certificate Report");

      // Create a detailed sheet with all fields
      const detailedSheetData = [];
      detailedSheetData.push(["DETAILED CERTIFICATE DATA"]);
      detailedSheetData.push([]);

      // Detailed headers
      const detailedHeaders = [
        "Certificate No",
        "Policy No",
        "Insured Name",
        "Broker ID",
        "Insurance Company",
        "Transaction Date",
        "From",
        "To",
        "Description",
        "Interest",
        "Insured Value",
        "Premium",
        "Rate",
        "Form M No",
        "Status",
        "Remarks",
        "Currency",
        "Phone",
        "Email",
        "Vehicle Type",
        "Vehicle Make",
        "Vehicle Model",
        "Address",
        "Additional Info",
        "Clause Type",
      ];
      detailedSheetData.push(detailedHeaders);

      // Detailed data
      certificatesData.forEach((cert) => {
        detailedSheetData.push([
          cert.CertNo || "",
          cert.PolicyNo || "",
          cert.InsuredName || "",
          cert.BrokerID || "",
          cert.InsCompanyID || "",
          formatDate(cert.TransDate),
          cert.FromDesc || "",
          cert.ToDesc || "",
          cert.PerDesc || "",
          cert.InterestDesc || "",
          cert.InsuredValue || 0,
          cert.GrossPrenium || 0,
          cert.Rate || 0,
          cert.FormMNo || "",
          cert.Tag || "",
          cert.Remarks || "",
          cert.Field101 || cert.Field102 || "NGN",
          cert.Field104 || "",
          cert.Field105 || "",
          cert.Field5 || "",
          cert.Field2 || "",
          cert.Field3 || "",
          cert.Field1 || "",
          cert.Field4 || "",
          cert.Field106 || "",
        ]);
      });

      const ws2 = XLSX.utils.aoa_to_sheet(detailedSheetData);
      XLSX.utils.book_append_sheet(wb, ws2, "Detailed Data");

      // Generate filename
      const filename = `Certificate_Report_${dateRange.period1}_to_${dateRange.period2}.xlsx`;

      // Write and download the file
      XLSX.writeFile(wb, filename);

      toast.success(`Excel report "${filename}" downloaded successfully!`);
    } catch (error) {
      console.error("Error generating report:", error);
      toast.dismiss();

      let errorMessage = "Failed to generate report";

      if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
        errorMessage = "Request timeout. Please try again.";
      } else if (error.message.includes("Network Error")) {
        errorMessage = "Network error. Please check your connection.";
      } else if (error.response?.status === 401) {
        errorMessage = "Session expired. Please login again.";
      } else if (error.response?.status === 404) {
        errorMessage = "API endpoint not found.";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ReportLayout
      icon={FileCheck2}
      title="Certificate period"
      description="Every certificate issued between two dates, with totals for insured value and premium."
      columns={COLUMNS}
      lastRun={lastRunAt && { count: dataCount, noun: "certificates", at: lastRunAt }}
      loading={loading}
      onGenerate={generateExcelReport}
    >
      <DateRangeFields
        from={dateRange.period1}
        to={dateRange.period2}
        onChange={({ from, to }) => setDateRange({ period1: from, period2: to })}
      />
    </ReportLayout>
  );
};

export default CertificatePeriodReport;
