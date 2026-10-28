import React, { useState } from "react";
import { toast } from "react-hot-toast";
import { KeyRound } from "lucide-react";
import PinService from "../../services/PinServices";
import { DateRangeFields, ReportLayout } from "./ReportKit";
import { today } from "./dateRange";

const PinAllocationReport = () => {
  const [dateRange, setDateRange] = useState({
    period1: today(),
    period2: today(),
  });
  const [loading, setLoading] = useState(false);
  const [lastRunAt, setLastRunAt] = useState(null);

  const generateReport = async () => {
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
      toast.loading("Generating pin allocation report...");

      // Send date range with time component
      const fromDate = dateRange.period1 + "T00:00:00";
      const toDate = dateRange.period2 + "T23:59:59";

      await PinService.downloadReport(fromDate, toDate);

      setLastRunAt(new Date());
      toast.dismiss();
      toast.success("Pin allocation report downloaded successfully!");
    } catch (error) {
      console.error("Error generating report:", error);
      toast.dismiss();

      let errorMessage = "Failed to generate report";

      if (error.message?.includes("timeout")) {
        errorMessage = "Request timeout. Please try again.";
      } else if (error.message?.includes("Network Error")) {
        errorMessage = "Network error. Please check your connection.";
      } else if (error.message?.includes("401")) {
        errorMessage = "Session expired. Please login again.";
      } else if (error.message?.includes("404")) {
        errorMessage = "API endpoint not found.";
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
      icon={KeyRound}
      title="PIN allocation report"
      description="Every PIN allocation made between two dates, prepared by the server as an Excel file."
      lastRun={lastRunAt && { count: null, noun: "PIN allocation report", at: lastRunAt }}
      loading={loading}
      onGenerate={generateReport}
    >
      <DateRangeFields
        from={dateRange.period1}
        to={dateRange.period2}
        onChange={({ from, to }) => setDateRange({ period1: from, period2: to })}
      />
    </ReportLayout>
  );
};

export default PinAllocationReport;
