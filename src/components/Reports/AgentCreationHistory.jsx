import React, { useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { toast } from "react-hot-toast";
import { Search, UserPlus } from "lucide-react";
import { getApiBaseUrl } from "../../utils/config";
import { today } from "./dateRange";
import { Field, inputCls } from "../UI/PageKit";
import { DateRangeFields, ReportLayout } from "./ReportKit";

const API_BASE_URL = getApiBaseUrl();

const COLUMNS = [
  "Agent type",
  "Agent ID",
  "Agent name",
  "Email",
  "Phone",
  "Parent",
  "Submitted",
  "Created by / date",
  "Approval status",
  "Approved by / date",
  "Rejection reason",
  "Totals",
];

const AgentCreationHistory = () => {
  const [dateRange, setDateRange] = useState({
    period1: "",
    period2: "",
  });
  const [status, setStatus] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [dataCount, setDataCount] = useState(0);
  const [lastRunAt, setLastRunAt] = useState(null);

  // Format date-time for display
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
    if (dateRange.period1 && dateRange.period2) {
      const startDate = new Date(dateRange.period1);
      const endDate = new Date(dateRange.period2);
      if (startDate > endDate) {
        toast.error("Start date cannot be after end date");
        return;
      }
    }

    try {
      setLoading(true);
      toast.loading("Fetching agent creation history...");

      const token = localStorage.getItem("token");
      const headers = {
        Accept: "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      };

      // Only send params that have a value
      const params = {};
      if (status) params.status = status;
      if (dateRange.period1) params.fromDate = dateRange.period1 + "T00:00:00";
      if (dateRange.period2) params.toDate = dateRange.period2 + "T23:59:59";
      if (searchTerm.trim()) params.searchTerm = searchTerm.trim();

      const response = await axios.get(
        `${API_BASE_URL}/Reports/Agent-Creation-History`,
        {
          headers,
          params,
          timeout: 60000,
        },
      );

      // Extract data from response
      let agentsData = [];
      if (Array.isArray(response.data)) {
        agentsData = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        agentsData = response.data.data;
      } else {
        throw new Error("Invalid response format from server");
      }

      if (agentsData.length === 0) {
        toast.dismiss();
        toast.error("No agent creation records found for the selected filters");
        setLoading(false);
        return;
      }

      setDataCount(agentsData.length);
      setLastRunAt(new Date());
      toast.dismiss();
      toast.success(
        `Found ${agentsData.length} record(s). Generating Excel file...`,
      );

      // Create workbook
      const wb = XLSX.utils.book_new();
      const sheetData = [];

      // Report header
      sheetData.push(["AGENT CREATION HISTORY REPORT"]);
      sheetData.push([]);
      const rangeLabel =
        dateRange.period1 && dateRange.period2
          ? `${formatDate(dateRange.period1)} to ${formatDate(dateRange.period2)}`
          : "All dates";
      sheetData.push(["Report Period:", rangeLabel]);
      sheetData.push(["Status Filter:", status || "All"]);
      sheetData.push(["Search Term:", searchTerm.trim() || "None"]);
      sheetData.push([
        "Generated On:",
        new Date().toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      ]);
      sheetData.push([]);

      // Table headers
      const tableHeaders = [
        "Agent Type",
        "Agent ID",
        "Agent Name",
        "Email",
        "Phone",
        "Parent ID",
        "Parent Name",
        "Submit Date",
        "Created By ID",
        "Created By Name",
        "Created Date",
        "Approval Status",
        "Is Approved",
        "Approved By ID",
        "Approved By Name",
        "Approved Date",
        "Rejection Reason",
      ];
      sheetData.push(tableHeaders);

      // Data rows
      agentsData.forEach((agent) => {
        sheetData.push([
          agent.AgentType || "",
          agent.AgentId || "",
          agent.AgentName || "",
          agent.Email || "",
          agent.Phone || "",
          agent.ParentId || "",
          agent.ParentName || "",
          formatDate(agent.SubmitDate),
          agent.CreatedById || "",
          agent.CreatedByName || "",
          formatDate(agent.CreatedDate),
          agent.ApprovalStatus || "",
          agent.IsApproved ? "Yes" : "No",
          agent.ApprovedById || "",
          agent.ApprovedByName || "",
          formatDate(agent.ApprovedDate),
          agent.RejectionReason || "",
        ]);
      });

      // Summary
      const approvedCount = agentsData.filter((a) => a.IsApproved).length;
      const notApprovedCount = agentsData.length - approvedCount;

      sheetData.push([]);
      sheetData.push(["SUMMARY"]);
      sheetData.push(["Total Records:", agentsData.length]);
      sheetData.push(["Approved:", approvedCount]);
      sheetData.push(["Not Approved:", notApprovedCount]);

      const ws = XLSX.utils.aoa_to_sheet(sheetData);

      // Column widths
      ws["!cols"] = [
        { wch: 14 }, // Agent Type
        { wch: 16 }, // Agent ID
        { wch: 28 }, // Agent Name
        { wch: 30 }, // Email
        { wch: 15 }, // Phone
        { wch: 14 }, // Parent ID
        { wch: 28 }, // Parent Name
        { wch: 14 }, // Submit Date
        { wch: 14 }, // Created By ID
        { wch: 18 }, // Created By Name
        { wch: 14 }, // Created Date
        { wch: 16 }, // Approval Status
        { wch: 12 }, // Is Approved
        { wch: 14 }, // Approved By ID
        { wch: 18 }, // Approved By Name
        { wch: 14 }, // Approved Date
        { wch: 30 }, // Rejection Reason
      ];

      XLSX.utils.book_append_sheet(wb, ws, "Agent Creation History");

      // Filename
      const suffix =
        dateRange.period1 && dateRange.period2
          ? `${dateRange.period1}_to_${dateRange.period2}`
          : today();
      const filename = `Agent_Creation_History_${suffix}.xlsx`;

      XLSX.writeFile(wb, filename);

      toast.success(`Excel report "${filename}" downloaded successfully!`);
    } catch (error) {
      console.error("Error generating report:", error);
      toast.dismiss();

      let errorMessage = "Failed to generate report";
      if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
        errorMessage = "Request timeout. Please try again.";
      } else if (error.message?.includes("Network Error")) {
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
      icon={UserPlus}
      title="Agent creation history"
      description="Who created each agent, when, and whether they were approved."
      note="All filters are optional"
      columns={COLUMNS}
      lastRun={lastRunAt && { count: dataCount, noun: "agents", at: lastRunAt }}
      loading={loading}
      onGenerate={generateExcelReport}
    >
      <Field label="Status">
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls}>
          <option value="">All statuses</option>
          <option value="Approved">Approved</option>
          <option value="Pending">Pending</option>
          <option value="Rejected">Rejected</option>
        </select>
      </Field>
      <Field label="Search">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Name, ID or email"
            className={`${inputCls} pl-9`}
          />
        </div>
      </Field>
      <DateRangeFields
        optional
        from={dateRange.period1}
        to={dateRange.period2}
        onChange={({ from, to }) => setDateRange({ period1: from, period2: to })}
      />
    </ReportLayout>
  );
};

export default AgentCreationHistory;
