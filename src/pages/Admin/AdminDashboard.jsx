import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import {
  BarChart3,
  KeyRound,
  LayoutDashboard,
  Lock,
  ShieldCheck,
  Users,
} from "lucide-react";
import AppShell from "../../components/Layout/AppShell";
import { useAuth } from "../../context/AuthContext";
import { getApiBaseUrl } from "../../utils/config";

const ADMIN_MENU = [
  {
    label: "Workspace",
    items: [
      { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
      {
        key: "users",
        label: "Users",
        icon: Users,
        items: [
          { to: "/admin/users/agents-brokers", label: "Super agents" },
          { to: "/admin/users/clients", label: "Sub agents" },
        ],
      },
      { to: "/admin/pin-allocation", label: "PIN allocation", icon: KeyRound },
      {
        key: "reports",
        label: "Reports",
        icon: BarChart3,
        items: [
          { to: "/admin/reports", label: "Certificate period" },
          { to: "/admin/pin-report", label: "PIN allocation report" },
          { to: "/admin/pin-summary", label: "PIN allocation summary" },
          { to: "/admin/agent-pin-balance", label: "Agent PIN balance" },
          { to: "/admin/agent-creation-history", label: "Agent creation history" },
          { to: "/admin/user-activity-logs", label: "User activity logs" },
        ],
      },
    ],
  },
  {
    label: "Administration",
    items: [
      {
        key: "security",
        label: "Security",
        icon: ShieldCheck,
        items: [
          { to: "/admin/security", label: "Users, roles & permissions" },
          { to: "/admin/verification", label: "Verification" },
        ],
      },
      { to: "/admin/change-password", label: "Change password", icon: Lock },
    ],
  },
];

const ACCOUNT_LINKS = [{ to: "/admin/change-password", label: "Change password", icon: Lock }];

const AdminDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Company certificates state for admin context
  const [certificates, setCertificates] = useState([]);
  const [selectedCerts, setSelectedCerts] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const API_BASE_URL = getApiBaseUrl();

  // Client proposals state for admin context
  const [proposals, setProposals] = useState([]);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [showDelete, setShowDelete] = useState(false);

  // Check authentication on component mount
  useEffect(() => {
    const checkAuth = () => {
      const token =
        localStorage.getItem("token") ||
        localStorage.getItem("authToken") ||
        sessionStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return false;
      }

      setIsAuthenticated(true);
      setIsLoading(false);
      return true;
    };

    checkAuth();
  }, [navigate]);

  const handleRowClick = (proposal) => {
    setSelectedProposal(proposal.id);
  };

  const handleAddProposal = () => {
    navigate("/admin/client/add-proposal");
  };

  // Seed client proposals for admin context using the exact mock from client page
  useEffect(() => {
    if (location.pathname.startsWith("/admin/client")) {
      setProposals([
        {
          id: 1,
          entryDate: "22 Aug 15",
          lastName: "Other Names",
          firstName: "intteck",
          address: "233 ikorodu road",
          mobile: "08023140962",
          regNumber: "LAG 987 67",
          amount: "5000.0000",
        },
        {
          id: 2,
          entryDate: "22 Aug 15",
          lastName: "Other Names",
          firstName: "intteck",
          address: "233 ikorodu road",
          mobile: "08023140962",
          regNumber: "LAG 987 GH",
          amount: "5000.0000",
        },
      ]);
    }
  }, [location.pathname]);

  // Toggle selection (used by Company Certificates page)
  const toggleCertificateSelection = (certId) => {
    setSelectedCerts((prev) =>
      prev.includes(certId)
        ? prev.filter((id) => id !== certId)
        : [...prev, certId],
    );
  };

  // Fetch company certificates for admin context
  const fetchCompanyCertificates = useCallback(async () => {
    setError(null);
    setIsProcessing(true);

    try {
      const token =
        localStorage.getItem("token") ||
        localStorage.getItem("authToken") ||
        sessionStorage.getItem("token");

      if (!token) {
        throw new Error("Authentication token not found");
      }

      const response = await fetch(`${API_BASE_URL}/Certificates`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("authToken");
          sessionStorage.removeItem("token");
          navigate("/login");
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const transformedData = (Array.isArray(data) ? data : []).map((cert) => ({
        id: cert.certNo || cert.id || Math.random().toString(36).substr(2, 9),
        certNo: cert.certNo || "N/A",
        brokerId: cert.brokerId || "N/A",
        clientId: cert.clientId || "N/A",
        insCompanyId: cert.insCompanyId || "N/A",
        insuredName: cert.insuredName || "Unknown",
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
          : "N/A",
        rate:
          typeof cert.rate === "number"
            ? `${(cert.rate * 100).toFixed(2)}%`
            : cert.rate || "0%",
        insuredValue:
          typeof cert.insuredValue === "number"
            ? `₦${cert.insuredValue.toLocaleString()}`
            : cert.insuredValue || "₦0",
        grossPremium:
          typeof cert.grossPremium === "number"
            ? `₦${cert.grossPremium.toLocaleString()}`
            : cert.grossPremium || "₦0",
        status: cert.tag || cert.status || "PENDING",
        perDesc: cert.perDesc || "",
        fromDesc: cert.fromDesc || "",
        toDesc: cert.toDesc || "",
        interestDesc: cert.interestDesc || "",
        formMno: cert.formMno || "",
        remarks: cert.remarks || "",
        ...cert,
      }));

      setCertificates(transformedData);
    } catch (err) {
      setError(err.message || "Failed to fetch certificates");
      setCertificates([]);
    } finally {
      setIsProcessing(false);
    }
  }, [navigate]);

  // Auto-load certificates when navigating to company section under admin
  useEffect(() => {
    if (location.pathname.startsWith("/admin/company")) {
      fetchCompanyCertificates();
    }
  }, [location.pathname, fetchCompanyCertificates]);

  // Check if we're at the root admin dashboard path (removed unused variable)

  const handleLogout = () => {
    logout();
    localStorage.removeItem("authToken");
    sessionStorage.removeItem("token");
    navigate("/");
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="grid min-h-dvh place-items-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#155dfd] border-t-transparent" />
          <p className="mt-4 text-sm text-slate-500">Loading…</p>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return null; // Navigation will happen via useEffect
  }

  return (
    <AppShell
      brand={{ title: "GIBS Brokers Portal", subtitle: "Administrator · Intteck Global Systems", area: "Admin" }}
      homePath="/admin/dashboard"
      menu={ADMIN_MENU}
      user={{ name: user?.username || "Admin", email: user?.email, role: "Administrator" }}
      accountLinks={ACCOUNT_LINKS}
      onLogout={handleLogout}
    >
      <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
        <Outlet
          context={{
            certificates,
            selectedCerts,
            toggleCertificateSelection,
            // Wire company actions to no-ops for now (admin view-only). If needed, we can call company endpoints.
            handleApprove: () => {},
            handleReject: () => {},
            handleDelete: () => {},
            isProcessing,
            error,
            setError,
            fetchCertificates: fetchCompanyCertificates,
            // Client context for admin client routes
            proposals,
            selectedProposal,
            showDelete,
            handleRowClick,
            handleAddProposal,
            setProposals,
            setSelectedProposal,
            setShowDelete,
          }}
        />
      </div>
    </AppShell>
  );
};

export default AdminDashboard;
