import React, { useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { toast } from "react-hot-toast";
import { Search, Wallet } from "lucide-react";
import { getApiBaseUrl } from "../../utils/config";
import { today } from "./dateRange";
import { Field, inputCls } from "../UI/PageKit";
import { ReportLayout } from "./ReportKit";

const API_BASE_URL = getApiBaseUrl();

const AgentPinBalance = () => {
  const [agentType, setAgentType] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [onlyWithBalance, setOnlyWithBalance] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dataCount, setDataCount] = useState(0);
  const [lastRunAt, setLastRunAt] = useState(null);

  const generateExcelReport = async () => {
    try {
      setLoading(true);
      toast.loading("Fetching agent pin balances...");

      const token = localStorage.getItem("token");
      const headers = {
        Accept: "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      };

      // Only send params that have a value
      const params = {};
      if (agentType) params.agentType = agentType;
      if (searchTerm.trim()) params.searchTerm = searchTerm.trim();
      if (onlyWithBalance) params.onlyWithBalance = true;

      const response = await axios.get(
        `${API_BASE_URL}/Reports/Agent-Pin-Balance`,
        {
          headers,
          params,
          timeout: 60000,
        },
      );

      // Extract data from response
      let balancesData = [];
      if (Array.isArray(response.data)) {
        balancesData = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        balancesData = response.data.data;
      } else {
        throw new Error("Invalid response format from server");
      }

      if (balancesData.length === 0) {
        toast.dismiss();
        toast.error("No agent pin balance records found for the selected filters");
        setLoading(false);
        return;
      }

      setDataCount(balancesData.length);
      setLastRunAt(new Date());
      toast.dismiss();
      toast.success(
        `Found ${balancesData.length} record(s). Generating Excel file...`,
      );

      // Create workbook
      const wb = XLSX.utils.book_new();
      const sheetData = [];

      // Report header
      sheetData.push(["AGENT PIN BALANCE REPORT"]);
      sheetData.push([]);
      sheetData.push(["Agent Type Filter:", agentType || "All"]);
      sheetData.push(["Search Term:", searchTerm.trim() || "None"]);
      sheetData.push([
        "Only With Balance:",
        onlyWithBalance ? "Yes" : "No",
      ]);
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
        "Available Balance",
      ];
      sheetData.push(tableHeaders);

      // Data rows
      balancesData.forEach((agent) => {
        sheetData.push([
          agent.AgentType || "",
          agent.AgentId || "",
          agent.AgentName || "",
          agent.AvailableBalance ?? 0,
        ]);
      });

      // Summary
      const totalBalance = balancesData.reduce(
        (sum, agent) => sum + (agent.AvailableBalance || 0),
        0,
      );

      sheetData.push([]);
      sheetData.push(["SUMMARY"]);
      sheetData.push(["Total Agents:", balancesData.length]);
      sheetData.push(["Total Available Balance:", totalBalance]);

      const ws = XLSX.utils.aoa_to_sheet(sheetData);

      // Column widths
      ws["!cols"] = [
        { wch: 16 }, // Agent Type
        { wch: 18 }, // Agent ID
        { wch: 30 }, // Agent Name
        { wch: 18 }, // Available Balance
      ];

      XLSX.utils.book_append_sheet(wb, ws, "Agent Pin Balance");

      // Filename
      const filename = `Agent_Pin_Balance_${today()}.xlsx`;

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
      icon={Wallet}
      title="Agent PIN balance"
      description="How many PINs each agent has available right now."
      note="All filters are optional"
      columns={["Agent type", "Agent ID", "Agent name", "Available balance", "Totals"]}
      lastRun={lastRunAt && { count: dataCount, noun: "agents", at: lastRunAt }}
      loading={loading}
      onGenerate={generateExcelReport}
    >
      <Field label="Agent type">
        <select value={agentType} onChange={(e) => setAgentType(e.target.value)} className={inputCls}>
          <option value="">All agent types</option>
          <option value="Agent">Agent</option>
          <option value="SuperAgent">SuperAgent</option>
        </select>
      </Field>
      <Field label="Search">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Agent name or ID"
            className={`${inputCls} pl-9`}
          />
        </div>
      </Field>
      <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-slate-200 px-4 py-3 sm:col-span-2">
        <span>
          <span className="block text-sm font-medium text-slate-900">Only agents with PINs left</span>
          <span className="block text-xs text-slate-500">Leave out agents whose balance is zero.</span>
        </span>
        <span className="relative inline-flex shrink-0">
          <input
            type="checkbox"
            checked={onlyWithBalance}
            onChange={(e) => setOnlyWithBalance(e.target.checked)}
            className="peer sr-only"
          />
          <span className="h-5 w-9 rounded-full bg-slate-300 transition-colors peer-checked:bg-[#155dfd] peer-focus-visible:ring-4 peer-focus-visible:ring-blue-100" />
          <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
        </span>
      </label>
    </ReportLayout>
  );
};

export default AgentPinBalance;
