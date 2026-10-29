// The sub agent (client) area: the shared app shell with the sub agent menu.
import { Outlet, useNavigate } from "react-router-dom";
import { ClipboardList, FileCheck2, KeyRound, LayoutDashboard, Lock, UserRound, Wallet } from "lucide-react";
import AppShell from "../../components/Layout/AppShell";
import { useAuth } from "../../context/AuthContext";

const CLIENT_MENU = [
  {
    label: "Workspace",
    items: [
      { to: "/client/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/client/certificates", label: "Certificates", icon: FileCheck2 },
      { to: "/client/pin-dashboard", label: "PIN management", icon: KeyRound },
      { to: "/client/wallet", label: "Wallet", icon: Wallet },
      { to: "/client/business-proposals", label: "Business proposals", icon: ClipboardList },
    ],
  },
  {
    label: "Account",
    items: [
      { to: "/client/view-profile", label: "Profile", icon: UserRound },
      { to: "/client/change-password", label: "Change password", icon: Lock },
    ],
  },
];

const ACCOUNT_LINKS = [
  { to: "/client/view-profile", label: "Profile", icon: UserRound },
  { to: "/client/change-password", label: "Change password", icon: Lock },
];

const ClientDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // The old Logout was only a link to the home page and left the session in place.
  const handleLogout = () => {
    logout();
    localStorage.removeItem("authToken");
    sessionStorage.removeItem("token");
    navigate("/");
  };

  return (
    <AppShell
      brand={{ title: "GIBS Brokers Portal", subtitle: "Sub agent · Intteck Global Systems", area: "Sub agent" }}
      homePath="/client/dashboard"
      menu={CLIENT_MENU}
      user={{ name: user?.username || "Sub agent", email: user?.email, role: "Sub agent" }}
      accountLinks={ACCOUNT_LINKS}
      onLogout={handleLogout}
    >
      <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="min-w-0 overflow-x-auto">
          <Outlet />
        </div>
      </div>
    </AppShell>
  );
};

export default ClientDashboard;
