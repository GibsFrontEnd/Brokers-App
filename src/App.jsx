import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import NavBar from "./components/NavBar";
import Footer from "./components/Footer";
import GenericLoginPage from "./components/GenericLoginPage";
import CompanyDashboard from "./pages/Company/CompanyDashboard";
import AgentsBrokers from "./pages/Company/AgentsBrokers";
import Certificates from "./pages/Company/Certificates";
import ChangePassword from "./shared/ChangePassword";
import DownloadCertificates from "./pages/Company/DownloadCertificates";
import AddBroker from "./pages/Company/AddBroker";
import CertificateDetails from "./pages/Company/CertificateDetails";
import EditBroker from "./pages/Company/EditBroker";
import BrokersDashboard from "./pages/Broker/BrokersDashboard";
import BrokerCertificate from "./pages/Broker/BrokersCertificate";
import CreateNewCertificate from "./shared/CreateNewCertificate";
import ClientList from "./pages/Broker/ClientList";
import AddClient from "./pages/Broker/AddClient";
import ViewDocuments from "./pages/Broker/ViewDocuments";
import ProtectedRoute from "./components/ProtectedRoute";
import ViewProfile from "./pages/Broker/ViewProfile";
import CreditNotes from "./pages/Broker/CreditNotes";
import ClientDashboard from "./pages/Client/ClientDashboard";
import AddProposal from "./pages/Client/AddProposal";
import BusinessProposals from "./pages/Client/BusinessProposals";
import MakePayment from "./pages/Client/MakePayment";
import ClientCertificate from "./pages/Client/ClientCertificate";
import CreateMotorPolicy from "./shared/CreateMotorPolicy";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import AdminOverview from "./pages/Admin/AdminOverview";
import Security from "./pages/Admin/Security";
import WelcomeMessage from "./components/WelcomeMessage";
import HomePage from "./pages/HomePage";

// This component handles the layout (NavBar/Footer logic)
const Layout = ({ children }) => {
  const location = useLocation();

  // Hide Nav/Footer on any dashboard route (including admin), home page, or login page
  const hideNavAndFooter =
    location.pathname === "/" ||
    location.pathname === "/login" ||
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/brokers") ||
    location.pathname.startsWith("/customer") ||
    location.pathname.startsWith("/company");

  return (
    <div className="flex flex-col min-h-screen">
      {!hideNavAndFooter && <NavBar />}
      <main className="flex-grow">{children}</main>
      {!hideNavAndFooter && <Footer />}
    </div>
  );
};

// This component defines all our routes
function AppRoutes() {
  return (
    <Routes>
      {/* Home Page Route - Always show homepage regardless of auth status */}
      <Route path="/" element={<HomePage />} />
      {/* Login Route - Always show login page */}
      <Route path="/login" element={<GenericLoginPage />} />{" "}
      {/* Public Routes - Show GenericLoginPage based on userType */}
      <Route path="/admin" element={<GenericLoginPage userType="admin" />} />
      <Route path="/brokers" element={<GenericLoginPage userType="broker" />} />
      <Route
        path="/insured-clients"
        element={<GenericLoginPage userType="client" />}
      />
      <Route
        path="/company"
        element={<GenericLoginPage userType="company" />}
      />
      {/* ADMIN Routes - Separate from other role-based routes */}
      {/* ADMIN Routes - Separate from other role-based routes */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute adminOnly={true}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      >
        {/* Nested routes for admin section */}
        <Route index element={<AdminOverview />} />
        <Route path="security" element={<Security />} />

        {/* Company Management Routes */}
        <Route path="company/certificates" element={<Certificates />} />
        <Route path="company/agents-brokers" element={<AgentsBrokers />} />
        <Route
          path="company/download-certificates"
          element={<DownloadCertificates />}
        />
        <Route path="company/add-broker" element={<AddBroker />} />
        <Route
          path="company/certificates/:certNo"
          element={<CertificateDetails />}
        />
        <Route
          path="company/agents-brokers/edit/:brokerId"
          element={<EditBroker />}
        />

        {/* Broker Management Routes */}
        <Route path="broker/certificates" element={<BrokerCertificate />} />
        <Route path="broker/client-management" element={<ClientList />} />
        <Route path="broker/view-documents" element={<ViewDocuments />} />
        <Route
          path="broker/download-certificates"
          element={
            <DownloadCertificates userType="broker" userId="BROKER-123" />
          }
        />
        <Route path="broker/view-profile" element={<ViewProfile />} />
        <Route path="broker/credit-notes" element={<CreditNotes />} />
        <Route
          path="broker/client-management/add-client"
          element={<AddClient />}
        />

        {/* Client Management Routes */}
        <Route
          path="client/business-proposals"
          element={<BusinessProposals />}
        />
        <Route path="client/add-proposal" element={<AddProposal />} />
        <Route path="client/make-payment" element={<MakePayment />} />
        <Route
          path="client/client-certificate"
          element={<ClientCertificate />}
        />

        {/* Shared Routes */}
        <Route
          path="change-password"
          element={<ChangePassword userType="admin" />}
        />
      </Route>
      {/* COMPANY Routes */}
      <Route
        path="/company/*"
        element={
          <ProtectedRoute requiredRole="company">
            <CompanyDashboard />
          </ProtectedRoute>
        }
      >
        {/* Redirect /company/dashboard to /company */}
        <Route path="dashboard" element={<Navigate to="/company" replace />} />

        {/* Default route when accessing /company */}
        <Route index element={<div />} />

        {/* Individual nested routes */}
        <Route path="certificates" element={<Certificates />} />
        <Route path="agents-brokers" element={<AgentsBrokers />} />
        <Route
          path="download-certificates"
          element={<DownloadCertificates />}
        />
        <Route
          path="change-password"
          element={<ChangePassword userType="company" />}
        />
        <Route path="add-broker" element={<AddBroker />} />
        <Route path="certificates/:certNo" element={<CertificateDetails />} />
        <Route path="agents-brokers/edit/:brokerId" element={<EditBroker />} />
      </Route>
      {/* BROKER Routes */}
      <Route
        path="/brokers/*"
        element={
          <ProtectedRoute requiredRole="broker">
            <BrokersDashboard />
          </ProtectedRoute>
        }
      >
        {/* Redirect /brokers/dashboard to /brokers */}
        <Route path="dashboard" element={<Navigate to="/brokers" replace />} />

        {/* Nested routes for broker dashboard */}
        <Route index element={<div />} />

        <Route path="certificates" element={<BrokerCertificate />} />
        <Route
          path="certificates/create/marine"
          element={<CreateNewCertificate userRole="broker" />}
        />
        <Route
          path="certificates/create/motor"
          element={<CreateMotorPolicy userRole="broker" />}
        />
        <Route
          path="certificates/view/:certId"
          element={<CreateNewCertificate viewMode={true} userRole="broker" />}
        />
        <Route
          path="certificates/edit/:certId"
          element={<CreateNewCertificate userRole="broker" />}
        />
        <Route path="view-documents" element={<ViewDocuments />} />
        <Route
          path="download-certificates"
          element={
            <DownloadCertificates userType="broker" userId="BROKER-123" />
          }
        />
        <Route path="view-profile" element={<ViewProfile />} />
        <Route path="credit-notes" element={<CreditNotes />} />
        <Route
          path="change-password"
          element={<ChangePassword userType="broker" />}
        />
        <Route path="client-management" element={<ClientList />} />
        <Route path="client-management/add-client" element={<AddClient />} />
      </Route>
      {/* CLIENT Routes */}
      <Route
        path="/customer/*"
        element={
          <ProtectedRoute requiredRole="customer">
            <ClientDashboard />
          </ProtectedRoute>
        }
      >
        {/* Redirect /company/dashboard to /company */}
        <Route path="dashboard" element={<Navigate to="/customer" replace />} />
        <Route index element={<div />} />
        {/* Nested routes for client dashboard */}
        <Route path="business-proposals" element={<BusinessProposals />} />
        <Route path="add-proposal" element={<AddProposal />} />
        <Route path="make-payment" element={<MakePayment />} />
        <Route path="client-certificate" element={<ClientCertificate />} />
        <Route
          path="change-password"
          element={<ChangePassword userType="customer" />}
        />
        <Route
          path="certificates/create/marine"
          element={<CreateNewCertificate userRole="customer" />}
        />
        <Route
          path="certificates/create/motor"
          element={<CreateMotorPolicy userRole="customer" />}
        />
        <Route
          path="certificates/create/compulsory"
          element={<CreateNewCertificate userRole="customer" />}
        />
        <Route
          path="certificates/create"
          element={<CreateNewCertificate userRole="customer" />}
        />
        <Route
          path="certificates/view/:certId"
          element={<CreateNewCertificate viewMode={true} userRole="customer" />}
        />
      </Route>
      {/* Default catch-all route - redirect to login */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// Main App component
export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <AppRoutes />
        </Layout>
      </Router>
    </AuthProvider>
  );
}
