import React from 'react';
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
import Certificates from "./pages/Company/Certificates";
import ChangePassword from "./shared/ChangePassword";
import DownloadCertificates from "./pages/Company/DownloadCertificates";
import CertificateDetails from "./pages/Company/CertificateDetails";
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
import Clientlist from "./pages/Company/Clientlist";
import EditClient from "./pages/Company/EditClient";
import PinAllocationSystem from "./components/PinAllocation/PinAllocationSystem.jsx";
import BrokerPinDashboard from "./pages/Broker/BrokerPinDashboard";

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Routing Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-lg shadow-sm p-8 max-w-md w-full text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Navigation Error</h2>
            <p className="text-gray-600 mb-4">
              There was a problem loading this page. Please try refreshing.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// This component handles the layout (NavBar/Footer logic)
const Layout = ({ children }) => {
  const location = useLocation();

  // Hide Nav/Footer on any dashboard route (including admin), home page, or login page
  const hideNavAndFooter =
    location.pathname === "/" ||
    location.pathname === "/login" ||
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/brokers") ||
    location.pathname.startsWith("/client") ||
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
    <ErrorBoundary>
      <Routes>
        {/* Home Page Route - Always show homepage regardless of auth status */}
        <Route path="/" element={<HomePage />} />
        
        {/* Login Route - Always show login page */}
        <Route path="/login" element={<GenericLoginPage />} />
        
        {/* Public Routes - Show GenericLoginPage based on userType */}
        <Route path="/admin" element={<GenericLoginPage userType="admin" />} />
        <Route path="/brokers" element={<GenericLoginPage userType="broker" />} />
        <Route path="/insured-clients" element={<GenericLoginPage userType="client" />} />
        <Route path="/company" element={<GenericLoginPage userType="company" />} />

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
           <Route path="dashboard" element={<AdminOverview />} />
  <Route index element={<AdminOverview />} /> 
          <Route path="security" element={<Security />} />
          <Route path="change-password" element={<ChangePassword userType="admin" />} />
          
          {/* Pin Allocation Route - This should be at admin level */}
          <Route path="pin-allocation" element={<PinAllocationSystem />} />

          {/* Company Management Routes */}
          <Route path="company">
            <Route path="certificates" element={<Certificates />} />
            <Route path="certificates/:certNo" element={<CertificateDetails />} />
            <Route path="download-certificates" element={<DownloadCertificates />} />
            <Route path="client-management">
              <Route index element={<Clientlist />} />
              <Route path="add-client" element={<AddClient />} />
              <Route path=":id" element={<EditClient />} />
            </Route>
          </Route>

          {/* Broker Management Routes */}
          <Route path="brokers">
            <Route path="certificates" element={<BrokerCertificate />} />
            <Route path="certificates/create/motor" element={<CreateMotorPolicy />} />
            <Route path="certificates/create/marine" element={<CreateNewCertificate />} />
            <Route path="certificates/create/compulsory" element={<CreateNewCertificate />} />
            <Route path="client-management">
              <Route index element={<ClientList />} />
              <Route path="add-client" element={<AddClient />} />
              <Route path=":id" element={<EditClient />} />
            </Route>
            <Route path="view-documents" element={<ViewDocuments />} />
            <Route path="download-certificates" element={<DownloadCertificates userType="broker" userId="BROKER-123" />} />
            <Route path="view-profile" element={<ViewProfile />} />
            <Route path="credit-notes" element={<CreditNotes />} />
            <Route path="pin-dashboard" element={<BrokerPinDashboard />} />
          </Route>

          {/* Client Management Routes */}
          <Route path="client">
            <Route path="business-proposals" element={<BusinessProposals />} />
            <Route path="add-proposal" element={<AddProposal />} />
            <Route path="make-payment" element={<MakePayment />} />
            <Route path="certificates" element={<ClientCertificate />} />
            <Route path="certificates/create/marine" element={<CreateNewCertificate />} />
            <Route path="certificates/create/motor" element={<CreateMotorPolicy userRole="customer" />} />
            <Route path="certificates/create/compulsory" element={<CreateNewCertificate userRole="customer" />} />
            <Route path="certificates/create" element={<CreateNewCertificate userRole="customer" />} />
            <Route path="certificates/view/:certId" element={<CreateNewCertificate viewMode={true} userRole="customer" />} />
          </Route>

          {/* Shared Certificate Routes */}
          <Route path="certificates">
            <Route path="create/motor" element={<CreateMotorPolicy userRole="customer" />} />
            <Route path="create/compulsory" element={<CreateNewCertificate userRole="customer" />} />
            <Route path="create" element={<CreateNewCertificate userRole="customer" />} />
            <Route path="view/:certId" element={<CreateNewCertificate viewMode={true} userRole="customer" />} />
          </Route>
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
          <Route index element={<Navigate to="certificates" replace />} />

          {/* Individual nested routes */}
          <Route path="certificates" element={<Certificates />} />
          <Route path="certificates/:certNo" element={<CertificateDetails />} />
          <Route path="download-certificates" element={<DownloadCertificates />} />
          <Route path="change-password" element={<ChangePassword userType="company" />} />
          <Route path="client-management" >
            <Route index element={<Clientlist />} />
            <Route path="add-client" element={<AddClient />} />
            <Route path=":id" element={<EditClient />} />
          </Route>
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

          {/* Default route when accessing /brokers */}
          <Route index element={<Navigate to="certificates" replace />} />

          {/* Nested routes for broker dashboard */}
          <Route path="certificates" element={<BrokerCertificate />} />
          <Route path="certificates/create/marine" element={<CreateNewCertificate userRole="broker" />} />
          <Route path="certificates/create/motor" element={<CreateMotorPolicy userRole="broker" />} />
          <Route path="certificates/view/:certId" element={<CreateNewCertificate viewMode={true} userRole="broker" />} />
          <Route path="certificates/edit/:certId" element={<CreateNewCertificate userRole="broker" />} />
          <Route path="view-documents" element={<ViewDocuments />} />
          <Route path="download-certificates" element={<DownloadCertificates userType="broker" userId="BROKER-123" />} />
          <Route path="view-profile" element={<ViewProfile />} />
          <Route path="credit-notes" element={<CreditNotes />} />
          <Route path="change-password" element={<ChangePassword userType="broker" />} />
          <Route path="pin-dashboard" element={<BrokerPinDashboard />} />
          <Route path="client-management">
            <Route index element={<ClientList />} />
            <Route path="add-client" element={<AddClient />} />
            <Route path=":id" element={<EditClient />} />
          </Route>
        </Route>

        {/* CLIENT Routes */}
        <Route
          path="/client/*"
          element={
            <ProtectedRoute requiredRole="customer">
              <ClientDashboard />
            </ProtectedRoute>
          }
        >
          {/* Redirect /client/dashboard to /client */}
          <Route path="dashboard" element={<Navigate to="/client" replace />} />
          
          {/* Default route when accessing /client */}
          <Route index element={<Navigate to="business-proposals" replace />} />
          
          {/* Nested routes for client dashboard */}
          <Route path="business-proposals" element={<BusinessProposals />} />
          <Route path="add-proposal" element={<AddProposal />} />
          <Route path="make-payment" element={<MakePayment />} />
          <Route path="certificates" element={<ClientCertificate />} />
          <Route path="change-password" element={<ChangePassword userType="customer" />} />
          <Route path="certificates/create/marine" element={<CreateNewCertificate userRole="customer" />} />
          <Route path="certificates/create/motor" element={<CreateMotorPolicy userRole="customer" />} />
          <Route path="certificates/create/compulsory" element={<CreateNewCertificate userRole="customer" />} />
          <Route path="certificates/create" element={<CreateNewCertificate userRole="customer" />} />
          <Route path="certificates/view/:certId" element={<CreateNewCertificate viewMode={true} userRole="customer" />} />
        </Route>

        {/* Default catch-all route - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ErrorBoundary>
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