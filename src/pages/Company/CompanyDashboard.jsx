import { useState, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Download, FileCheck2, LayoutDashboard, Lock, UserRound, Users } from "lucide-react";
import { getApiBaseUrl } from "../../utils/config";
import AppShell from "../../components/Layout/AppShell";
import { useAuth } from "../../context/AuthContext";
import { LoadingState, Toast } from "../../components/UI/PageKit";

const COMPANY_MENU = [
  {
    label: "Workspace",
    items: [
      { to: "/company/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/company/certificates", label: "Certificates", icon: FileCheck2 },
      { to: "/company/agents-brokers", label: "Agents and brokers", icon: Users },
      { to: "/company/download-certificates", label: "Download certificates", icon: Download },
    ],
  },
  {
    label: "Account",
    items: [
      { to: "/company/view-profile", label: "Profile", icon: UserRound },
      { to: "/company/change-password", label: "Change password", icon: Lock },
    ],
  },
];

const ACCOUNT_LINKS = [
  { to: "/company/view-profile", label: "Profile", icon: UserRound },
  { to: "/company/change-password", label: "Change password", icon: Lock },
];


const CompanyDashboard = () => {
  const [certificates, setCertificates] = useState([]);
  const [selectedCerts, setSelectedCerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const location = useLocation();

  // Check if we're at the root company dashboard path
  const isRootPath =
    location.pathname === "/company" ||
    location.pathname === "/company/" ||
    location.pathname === "/company/dashboard";

  // Check if we're on a page that doesn't need certificate data
  const isNonCertificatePage =
    location.pathname.includes("/agents-brokers") ||
    location.pathname.includes("/change-password") ||
    location.pathname.includes("/view-profile") ||
    location.pathname.includes("/client-management");

  const API_BASE_URL = getApiBaseUrl();

  // Add these missing API functions that are referenced in the Outlet context
  const handleApprove = async (certIds) => {
    setIsProcessing(true);
    try {
      // Add your approve logic here
      console.log("Approving certificates:", certIds);

      await fetchCertificates(); // Refresh data
    } catch (error) {
      console.error("Error approving certificates:", error);
      setError("Failed to approve certificates");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (certIds) => {
    setIsProcessing(true);
    try {
      // Add your reject logic here
      console.log("Rejecting certificates:", certIds);
      await fetchCertificates(); // Refresh data
    } catch (error) {
      console.error("Error rejecting certificates:", error);
      setError("Failed to reject certificates");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (certIds) => {
    setIsProcessing(true);
    try {
      // Add your delete logic here
      console.log("Deleting certificates:", certIds);
      await fetchCertificates(); // Refresh data
    } catch (error) {
      console.error("Error deleting certificates:", error);
      setError("Failed to delete certificates");
    } finally {
      setIsProcessing(false);
    }
  };

  // Fetch data from real API
  const fetchCertificates = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token =
        localStorage.getItem("token") ||
        localStorage.getItem("authToken") ||
        sessionStorage.getItem("token");

      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(`${API_BASE_URL}/Certificates`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Check if data is an array
      if (!Array.isArray(data)) {
        throw new Error("Invalid data format received from API");
      }

      const transformedData = data.map((cert) => ({
        id: cert.certNo,
        certNo: cert.certNo,
        brokerId: cert.brokerId,
        clientId: cert.clientId,
        insCompanyId: cert.insCompanyId,
        insuredName: cert.insuredName || "N/A",
        policyNo: cert.policyNo || "N/A",
        transDate: cert.transDate
          ? new Date(cert.transDate).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "N/A",
        submitDate: cert.submitDate
          ? new Date(cert.submitDate).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : null,
        rate: cert.rate ? `${(cert.rate * 100).toFixed(2)}%` : "0%",
        insuredValue: cert.insuredValue
          ? `₦${cert.insuredValue.toLocaleString()}`
          : "₦0",
        grossPremium: cert.grossPrenium
          ? `₦${cert.grossPrenium.toLocaleString()}`
          : "₦0",
        status: cert.tag || "PENDING",
        perDesc: cert.perDesc || "",
        fromDesc: cert.fromDesc || "",
        toDesc: cert.toDesc || "",
        interestDesc: cert.interestDesc || "",
        formMno: cert.formMno || "",
        remarks: cert.remarks || "",
        ...cert,
      }));

      setCertificates(transformedData);
    } catch (error) {
      console.error("Error fetching certificates:", error);
      setError(`Failed to load certificates: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch certificates if we're not on the root path and not on non-certificate pages
    if (!isRootPath && !isNonCertificatePage) {
      fetchCertificates();
    } else {
      setIsLoading(false);
    }
  }, [isRootPath, isNonCertificatePage]);

  const toggleCertificateSelection = (certId) => {
    setSelectedCerts((prev) =>
      prev.includes(certId)
        ? prev.filter((id) => id !== certId)
        : [...prev, certId],
    );
  };

  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // The old Logout linked to "/home", which does not exist, and left the session in place.
  const handleLogout = () => {
    logout();
    localStorage.removeItem("authToken");
    sessionStorage.removeItem("token");
    navigate("/");
  };

  return (
    <AppShell
      brand={{ title: "GIBS Brokers Portal", subtitle: "Insurance company · Intteck Global Systems", area: "Company" }}
      homePath="/company/dashboard"
      menu={COMPANY_MENU}
      user={{ name: user?.username || "Company", email: user?.email, role: "Insurance company" }}
      accountLinks={ACCOUNT_LINKS}
      onLogout={handleLogout}
    >
      {error && <Toast type="error" message={error} onClose={() => setError(null)} />}
      <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
        {/* Loading state for pages that need certificates */}
        {isLoading && !isRootPath && !isNonCertificatePage ? (
          <LoadingState label="Loading certificates…" />
        ) : (
          <div className="min-w-0 overflow-x-auto">
            <Outlet
              context={{
                certificates,
                selectedCerts,
                toggleCertificateSelection,
                handleApprove,
                handleReject,
                handleDelete,
                isProcessing,
                error,
                setError,
                fetchCertificates,
              }}
            />
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default CompanyDashboard;
