import React, { useState, useEffect } from "react";
import { ArrowRight, Clock, History, KeyRound, Share2, UserCheck, UserCog, Wallet } from "lucide-react";
import PinService from "../../services/PinServices";
import AllocatePinsModal from "./AllocatePinsModal";
import PendingApprovals from "./PendingApprovals";
import AllocationHistory from "./AllocationHistory";
import { AccessDenied, LoadingState, PageHeader, StatTile, Toast } from "../UI/PageKit";

// Import CryptoJS for decryption
import CryptoJS from "crypto-js";

// The three steps a PIN allocation goes through.
const WORKFLOW = [
  { icon: KeyRound, tone: "bg-blue-50 text-blue-700", title: "Admin allocates", text: "PINs to a super agent" },
  { icon: UserCheck, tone: "bg-amber-50 text-amber-700", title: "Approver reviews", text: "Approves or rejects the request" },
  { icon: Share2, tone: "bg-emerald-50 text-emerald-700", title: "Super agent shares", text: "PINs with their sub agents" },
];

const PinAllocationSystem = () => {
  const [activeTab, setActiveTab] = useState("allocate");
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [toast, setToast] = useState(null);
  const [hasAccess, setHasAccess] = useState(null);
  const [accessError, setAccessError] = useState(null);
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    checkAccessAndLoadData();
  }, []);

  // Function to decrypt user data (same as in AuthContext)
  const decryptData = (encryptedData) => {
    if (!encryptedData) return null;
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, "your-secret-key");
      const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
      return decryptedString ? JSON.parse(decryptedString) : null;
    } catch (error) {
      console.error("Decryption failed:", error);
      return null;
    }
  };

 // Function to check if user has ANY Pin-related permission
const hasAnyPinPermission = (permissions) => {
  if (!permissions || !Array.isArray(permissions)) {
    return false;
  }


  // Define all Pin-related permission names
  const pinPermissions = [
    "Pin.ViewPending",
    "Pin.Share",
    "Pin.ViewBalance",
    "Pin.ViewAllocations",
    "Pin.ViewAudit",
    "Pin.ViewSummary",
    "Pin.ViewAllocations",
    "Pin.Approve",
    "Pin.Revoke"
  ];

  // Check if it's an array of permission names or objects
  if (permissions.length > 0) {
    // If first item is a string, it's an array of permission names
    if (typeof permissions[0] === 'string') {
      
      // Check if ANY of the user's permissions starts with "Pin."
      const hasPinPermission = permissions.some(permission => 
        permission.startsWith("Pin.")
      );
      
      if (hasPinPermission) {
        // Also check which specific Pin permissions were found
        const foundPinPermissions = permissions.filter(p => pinPermissions.includes(p));
        ( foundPinPermissions);
      }
      
      return hasPinPermission;
    }
    
    // If first item is an object, look for permissionName
    else if (typeof permissions[0] === 'object' && permissions[0] !== null) {
     
      
      // Look for ANY Pin permission
      const hasPinPermission = permissions.some(permission => {
        // Check permissionName
        if (permission.permissionName && permission.permissionName.startsWith("Pin.")) {
          return true;
        }
        
        // Check name property
        if (permission.name && permission.name.startsWith("Pin.")) {
        
          return true;
        }
        
        // Check specific Pin permission IDs (optional - you can add IDs if needed)
        const pinPermissionIds = [29, 30, 32, 33, 34, 35, 36, 61, 62];
        if (permission.permissionID && pinPermissionIds.includes(permission.permissionID)) {
         
          return true;
        }
        
        return false;
      });
      
      if (hasPinPermission) {
       
        // Log which specific Pin permissions were found
        const foundPermissions = permissions.filter(p => 
          (p.permissionName && p.permissionName.startsWith("Pin.")) ||
          (p.name && p.name.startsWith("Pin."))
        );
       ( foundPermissions);
      }
      
      return hasPinPermission;
    }
  }

  
  return false;
};

  // Function to get decrypted user data from localStorage
  const getDecryptedUserData = () => {
    try {
      // Get encrypted user data from localStorage
      const encryptedUser = localStorage.getItem("user");
      
      
      if (!encryptedUser) {
     
        return null;
      }

      // Decrypt the user data
      const userData = decryptData(encryptedUser);
      
      
      return userData;
    } catch (error) {
      console.error("Error getting decrypted user data:", error);
      return null;
    }
  };

  // Main function to check access and load data
const checkAccessAndLoadData = async () => {
  try {
    setLoading(true);
    
  

    // Get token and check authentication
    const token = localStorage.getItem("token");
    if (!token) {
     
      setHasAccess(false);
      setAccessError("Authentication required. Please login.");
      setLoading(false);
      return;
    }

    // Get user role from localStorage
    const storedRole = localStorage.getItem("role");

    setUserRole(storedRole || "user");

    // Get decrypted user data
    const userData = getDecryptedUserData();
    
    if (!userData) {

      setHasAccess(false);
      setAccessError("Could not retrieve user information. Please login again.");
      setLoading(false);
      return;
    }

    
    // Extract permissions from user data
    let permissions = [];
    
    // Check different possible locations for permissions in user data
    if (userData.permissions && Array.isArray(userData.permissions)) {
      permissions = userData.permissions;
      
    } else if (userData.userPermissions && Array.isArray(userData.userPermissions)) {
      permissions = userData.userPermissions;
     
    } else if (userData.Permissions && Array.isArray(userData.Permissions)) {
      permissions = userData.Permissions;
      
    } else if (userData.roles && Array.isArray(userData.roles)) {
      // If roles contain permissions
      const allPermissions = [];
      userData.roles.forEach(role => {
        if (role.permissions && Array.isArray(role.permissions)) {
          allPermissions.push(...role.permissions);
        }
      });
      permissions = allPermissions;
     
    }

  

    // Check if user has ANY Pin-related permission
    const hasPinPermission = hasAnyPinPermission(permissions);
    
    if (!hasPinPermission) {
      
      setHasAccess(false);
      setAccessError("You don't have any Pin-related permissions to access the Pin Allocation System.");
      setLoading(false);
      return;
    }

    // User has at least one Pin permission, load data
    
    setHasAccess(true);
    
    try {
      const [balanceData, pendingData] = await Promise.all([
        PinService.getBalance().catch(() => ({ balance: 0, availablePins: 0 })),
        PinService.getPendingAllocations().catch(() => []),
      ]);

     

      setBalance(balanceData.balance || balanceData.availablePins || 0);
      setPendingCount(Array.isArray(pendingData) ? pendingData.length : 0);
    } catch (error) {
      console.error("Failed to load data:", error);
      // Set default values even if loading fails
      setBalance(0);
      setPendingCount(0);
    }
    
  } catch (error) {
    console.error("Failed to check access:", error);
    setHasAccess(false);
    setAccessError("Failed to verify access permissions. Please try again.");
  } finally {
    setLoading(false);
  }
};

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  const closeToast = () => {
    setToast(null);
  };

  const handleAllocationSuccess = () => {
    checkAccessAndLoadData();
    showToast(
      "Pin allocation request submitted successfully! Awaiting approval."
    );
  };

  const handleApprovalSuccess = (isApproved = true) => {
    checkAccessAndLoadData();
    if (isApproved) {
      showToast("Pin allocation approved successfully!");
    } else {
      showToast("Pin allocation rejected successfully!");
    }
  };

  const tabs = [
    { id: "allocate", name: "Allocate", icon: KeyRound },
    { id: "approvals", name: "Pending approvals", icon: UserCheck, badge: pendingCount },
    { id: "history", name: "History", icon: History },
  ];

  // The full-page spinner is for the first access check only; later refreshes update the numbers in place.
  if (loading && hasAccess === null) {
    return <LoadingState label="Checking your access to PIN allocation…" />;
  }

  // Show access denied if user doesn't have permission
  if (hasAccess === false) {
    return (
      <AccessDenied
        title="PIN allocation"
        message={accessError || "You don't have any PIN permissions. Ask your administrator for access."}
      />
    );
  }

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}

      <PageHeader title="PIN allocation" description="Allocate certificate PINs to super agents, approve requests and follow every allocation." />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <StatTile label="Your balance" value={`${Number(balance || 0).toLocaleString()} PINs`} hint="Available to allocate" icon={Wallet} tone="bg-emerald-50 text-emerald-700" />
        <StatTile
          label="Awaiting approval"
          value={pendingCount.toLocaleString()}
          hint={pendingCount === 1 ? "Request to review" : "Requests to review"}
          icon={Clock}
          tone="bg-amber-50 text-amber-700"
        />
        <StatTile label="Signed in as" value={<span className="capitalize">{userRole || "User"}</span>} hint="Your role" icon={UserCog} tone="bg-slate-100 text-slate-700" />
      </div>

      {/* How it works */}
      <ol className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-3 sm:p-5">
        {WORKFLOW.map((step, i) => (
          <li key={step.title} className="flex items-center gap-3">
            <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${step.tone}`}>
              <step.icon className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-[#155dfd]">Step {i + 1}</span>
              <span className="block text-sm font-semibold text-slate-900">{step.title}</span>
              <span className="block truncate text-xs text-slate-500">{step.text}</span>
            </span>
            {i < WORKFLOW.length - 1 && <ArrowRight className="hidden h-4 w-4 shrink-0 text-slate-300 sm:block" />}
          </li>
        ))}
      </ol>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <nav className="flex gap-1 overflow-x-auto border-b border-slate-100 px-3 sm:px-4" role="tablist" aria-label="PIN allocation">
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveTab(tab.id)}
                className={`relative inline-flex shrink-0 items-center gap-2 px-3 py-3.5 text-sm font-medium transition-colors ${
                  active ? "text-[#155dfd]" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.name}
                {tab.badge > 0 && (
                  <span className="rounded-full bg-amber-100 px-1.5 text-[11px] font-semibold text-amber-800">{tab.badge}</span>
                )}
                {active && <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-[#155dfd]" />}
              </button>
            );
          })}
        </nav>

        <div className="p-4 sm:p-6">
          {activeTab === "allocate" && <AllocatePinsModal onAllocationSuccess={handleAllocationSuccess} />}
          {activeTab === "approvals" && <PendingApprovals onApprovalSuccess={handleApprovalSuccess} />}
          {activeTab === "history" && <AllocationHistory />}
        </div>
      </section>
    </div>
  );
};

export default PinAllocationSystem;
