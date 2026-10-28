import React, { useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { toast } from "react-hot-toast";
import { History, Search } from "lucide-react";
import { getApiBaseUrl } from "../../utils/config";
import { today } from "./dateRange";
import { Field, inputCls } from "../UI/PageKit";
import { ReportLayout } from "./ReportKit";

const API_BASE_URL = getApiBaseUrl();

const COLUMNS = [
  "Username",
  "Full name",
  "Entity type",
  "Email",
  "Created by / date",
  "Approval status",
  "Approved by / date",
  "Last login",
  "Last activity",
  "Total actions",
  "Totals",
];

const UserActivityLogs = () => {
  const [userId, setUserId] = useState("");
  const [entityType, setEntityType] = useState("");
  const [approvalStatus, setApprovalStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [dataCount, setDataCount] = useState(0);
  const [lastRunAt, setLastRunAt] = useState(null);

  // Format a date-time for display
  const formatDateTime = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const generateExcelReport = async () => {
    try {
      setLoading(true);
      toast.loading("Fetching user activity logs...");

      const token = localStorage.getItem("token");
      const headers = {
        Accept: "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      };

      // Only send params that have a value
      const params = {};
      if (userId.trim()) params.userId = userId.trim();
      if (entityType) params.entityType = entityType;
      if (approvalStatus) params.approvalStatus = approvalStatus;

      const response = await axios.get(
        `${API_BASE_URL}/Reports/User-Activity-Logs`,
        {
          headers,
          params,
          timeout: 60000,
        },
      );

      // Extract data from response
      let logsData = [];
      if (Array.isArray(response.data)) {
        logsData = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        logsData = response.data.data;
      } else {
        throw new Error("Invalid response format from server");
      }

      if (logsData.length === 0) {
        toast.dismiss();
        toast.error("No activity logs found for the selected filters");
        setLoading(false);
        return;
      }

      setDataCount(logsData.length);
      setLastRunAt(new Date());
      toast.dismiss();
      toast.success(
        `Found ${logsData.length} record(s). Generating Excel file...`,
      );

      // Create workbook
      const wb = XLSX.utils.book_new();
      const sheetData = [];

      // Report header
      sheetData.push(["USER AUDIT LOG ACTIVITIES REPORT"]);
      sheetData.push([]);
      sheetData.push(["User ID Filter:", userId.trim() || "All"]);
      sheetData.push(["Entity Type Filter:", entityType || "All"]);
      sheetData.push(["Approval Status Filter:", approvalStatus || "All"]);
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
        "Username",
        "Full Name",
        "Entity Type",
        "Email",
        "Created By",
        "Created Date",
        "Is Approved",
        "Approval Status",
        "Approved By",
        "Approved Date",
        "Last Login Date",
        "Last Activity Date",
        "Last Activity Action",
        "Total Actions",
      ];
      sheetData.push(tableHeaders);

      // Data rows
      logsData.forEach((log) => {
        sheetData.push([
          log.Username || "",
          log.FullName || "",
          log.EntityType || "",
          log.Email || "",
          log.CreatedBy || "",
          formatDateTime(log.CreatedDate),
          log.IsApproved === null || log.IsApproved === undefined
            ? "N/A"
            : log.IsApproved
              ? "Yes"
              : "No",
          log.ApprovalStatus || "N/A",
          log.ApprovedBy || "N/A",
          formatDateTime(log.ApprovedDate) || "N/A",
          formatDateTime(log.LastLoginDate),
          formatDateTime(log.LastActivityDate),
          log.LastActivityAction || "",
          log.TotalActions ?? 0,
        ]);
      });

      // Summary
      const totalActions = logsData.reduce(
        (sum, log) => sum + (log.TotalActions || 0),
        0,
      );
      const approvedCount = logsData.filter((l) => l.IsApproved === true).length;

      sheetData.push([]);
      sheetData.push(["SUMMARY"]);
      sheetData.push(["Total Users:", logsData.length]);
      sheetData.push(["Approved Users:", approvedCount]);
      sheetData.push(["Total Actions:", totalActions]);

      const ws = XLSX.utils.aoa_to_sheet(sheetData);

      // Column widths
      ws["!cols"] = [
        { wch: 18 }, // Username
        { wch: 24 }, // Full Name
        { wch: 14 }, // Entity Type
        { wch: 30 }, // Email
        { wch: 16 }, // Created By
        { wch: 20 }, // Created Date
        { wch: 12 }, // Is Approved
        { wch: 16 }, // Approval Status
        { wch: 16 }, // Approved By
        { wch: 20 }, // Approved Date
        { wch: 20 }, // Last Login Date
        { wch: 20 }, // Last Activity Date
        { wch: 22 }, // Last Activity Action
        { wch: 14 }, // Total Actions
      ];

      XLSX.utils.book_append_sheet(wb, ws, "User Activity Logs");

      const filename = `User_Activity_Logs_${today()}.xlsx`;
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
      icon={History}
      title="User activity logs"
      description="Each user's account, approval and most recent activity."
      note="All filters are optional"
      columns={COLUMNS}
      lastRun={lastRunAt && { count: dataCount, noun: "users", at: lastRunAt }}
      loading={loading}
      onGenerate={generateExcelReport}
    >
      <Field label="User ID">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="A single user's ID"
            className={`${inputCls} pl-9`}
          />
        </div>
      </Field>
      <Field label="Entity type">
        <select value={entityType} onChange={(e) => setEntityType(e.target.value)} className={inputCls}>
          <option value="">All entity types</option>
          <option value="Admin">Admin</option>
          <option value="Superagent">Superagent</option>
          <option value="Subagent">Subagent</option>
          <option value="Company">Company</option>
        </select>
      </Field>
      <Field label="Approval status">
        <select value={approvalStatus} onChange={(e) => setApprovalStatus(e.target.value)} className={inputCls}>
          <option value="">All statuses</option>
          <option value="Approved">Approved</option>
          <option value="Pending">Pending</option>
          <option value="Rejected">Rejected</option>
        </select>
      </Field>
    </ReportLayout>
  );
};

export default UserActivityLogs;
