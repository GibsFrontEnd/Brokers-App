// src/pages/brokers/BrokersDashboard.jsx
// The super agent (broker) area: the shared app shell with the super agent menu.

import { Outlet, useNavigate } from "react-router-dom";
import { BarChart3, FileCheck2, KeyRound, LayoutDashboard, Lock, UserRound, Users, Wallet } from "lucide-react";
import AppShell from "../../components/Layout/AppShell";
import { useAuth } from "../../context/AuthContext";

const BROKER_MENU = [
  {
    label: "Workspace",
    items: [
      { to: "/brokers/dashboard", label: "Dashboard", icon: LayoutDashboard },
      {
        key: "policy",
        label: "Policy admin",
        icon: FileCheck2,
        items: [
          { to: "/brokers/certificates/niid", label: "NIID certificates" },
          { to: "/brokers/certificates/niip", label: "NIIP certificates" },
        ],
      },
      { to: "/brokers/client-management", label: "Sub agents", icon: Users },
      { to: "/brokers/pin-dashboard", label: "PIN management", icon: KeyRound },
      { to: "/brokers/wallet", label: "Wallet", icon: Wallet },
      { to: "/brokers/reports", label: "Certificate period", icon: BarChart3 },
    ],
  },
  {
    label: "Account",
    items: [
      { to: "/brokers/view-profile", label: "Profile", icon: UserRound },
      { to: "/brokers/change-password", label: "Change password", icon: Lock },
    ],
  },
];

const ACCOUNT_LINKS = [
  { to: "/brokers/view-profile", label: "Profile", icon: UserRound },
  { to: "/brokers/change-password", label: "Change password", icon: Lock },
];

const BrokersDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // The old Logout was only a link to the login page and left the session in place.
  const handleLogout = () => {
    logout();
    localStorage.removeItem("authToken");
    sessionStorage.removeItem("token");
    navigate("/");
  };

  return (
    <AppShell
      brand={{ title: "GIBS Brokers Portal", subtitle: "Super agent · Intteck Global Systems", area: "Super agent" }}
      homePath="/brokers/dashboard"
      menu={BROKER_MENU}
      user={{ name: user?.username || "Super agent", email: user?.email, role: "Super agent" }}
      accountLinks={ACCOUNT_LINKS}
      onLogout={handleLogout}
    >
      <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="min-w-0 overflow-x-auto">
          <Outlet context={{}} />
        </div>
      </div>
    </AppShell>
  );
};

export default BrokersDashboard;
