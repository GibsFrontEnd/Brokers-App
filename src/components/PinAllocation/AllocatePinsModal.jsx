import React, { useState, useEffect } from "react";
import { Building2, Car, Check, Hash, KeyRound, Loader2, Lock, Search, Send } from "lucide-react";
import PinService from "../../services/PinServices";
import UserService from "../../services/UserServices";
import CryptoJS from "crypto-js";
import { Avatar, Field, Notice, PermissionRequired, Sheet, btnPrimary, btnSecondary, inputCls } from "../UI/PageKit";

const AllocatePinsModal = ({ onAllocationSuccess }) => {
  const [selectedBroker, setSelectedBroker] = useState("");
  const [pinAmount, setPinAmount] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [vehicleClasses, setVehicleClasses] = useState([]);
  const [fetchingClasses, setFetchingClasses] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [brokers, setBrokers] = useState([]);
  const [fetchingBrokers, setFetchingBrokers] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [hasAllocatePermission, setHasAllocatePermission] = useState(null);
  const [checkingPermission, setCheckingPermission] = useState(true);

  // Decryption function
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

  // Check for Pin.ViewAllocations permission
  const checkAllocatePermission = () => {
    try {
      setCheckingPermission(true);
      
      // Get encrypted user data from localStorage
      const encryptedUser = localStorage.getItem("user");
      if (!encryptedUser) {
      
        setHasAllocatePermission(false);
        setCheckingPermission(false);
        return;
      }

      // Decrypt user data
      const userData = decryptData(encryptedUser);
      if (!userData) {
        
        setHasAllocatePermission(false);
        setCheckingPermission(false);
        return;
      }

      // Extract permissions from user data
      let permissions = [];
      
      // Check different possible locations for permissions
      if (userData.permissions && Array.isArray(userData.permissions)) {
        permissions = userData.permissions;
      } else if (userData.userPermissions && Array.isArray(userData.userPermissions)) {
        permissions = userData.userPermissions;
      } else if (userData.Permissions && Array.isArray(userData.Permissions)) {
        permissions = userData.Permissions;
      } else if (userData.roles && Array.isArray(userData.roles)) {
        const allPermissions = [];
        userData.roles.forEach(role => {
          if (role.permissions && Array.isArray(role.permissions)) {
            allPermissions.push(...role.permissions);
          }
        });
        permissions = allPermissions;
      }

      // Check for Pin.ViewAllocations permission
      const hasPermission = permissions.some(permission => {
        if (typeof permission === 'string') {
          return permission === "Pin.ViewAllocations";
        } else if (typeof permission === 'object') {
          return (
            permission.permissionName === "Pin.ViewAllocations" ||
            permission.name === "Pin.ViewAllocations" ||
            permission.permissionID === 36 // Pin.ViewAllocations ID from your list
          );
        }
        return false;
      });

      
      setHasAllocatePermission(hasPermission);
    } catch (error) {
      console.error("Error checking permission:", error);
      setHasAllocatePermission(false);
    } finally {
      setCheckingPermission(false);
    }
  };

  // Check permission when component mounts
  useEffect(() => {
    checkAllocatePermission();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch brokers when modal opens (only if user has permission)
  useEffect(() => {
    const loadData = async () => {
      if (showModal && hasAllocatePermission) {
        console.log("Loading brokers and vehicle classes...");
        try {
          await Promise.all([
            fetchBrokers(),
            fetchVehicleClasses()
          ]);
        } catch (err) {
          console.error("Error in loadData:", err);
          setError("Failed to load required data. Please try again.");
        }
      }
    };
    
    loadData();
  }, [showModal, hasAllocatePermission]);

  const fetchVehicleClasses = async () => {
    try {
      console.log("Calling PinService.getVehicleClasses...");
      setFetchingClasses(true);
      const data = await PinService.getVehicleClasses();
      console.log("getVehicleClasses response:", data);
      setVehicleClasses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch vehicle classes:", error);
      // Don't set error state here to allow broker selection even if classes fail
    } finally {
      setFetchingClasses(false);
    }
  };

  const fetchBrokers = async () => {
    try {
      console.log("Calling UserService.getBrokers...");
      setFetchingBrokers(true);
      setError("");

      const brokersData = await UserService.getBrokers();
      console.log("getBrokers response:", brokersData);

      const formattedBrokers = Array.isArray(brokersData)
        ? brokersData.map((broker) => ({
            userId: broker.brokerId || broker.id || "N/A",
            fullName: broker.brokerName || broker.name || "Unknown",
            email: broker.email || "N/A",
            mobilePhone: broker.mobilePhone || "N/A",
            companyId: broker.insCompanyId || broker.companyId || "N/A",
            address: broker.address || "N/A",
          }))
        : [];

      setBrokers(formattedBrokers);
    } catch (error) {
      console.error("Failed to fetch brokers:", error);
      setError("Failed to load brokers. Please try again.");
      setBrokers([]);
    } finally {
      setFetchingBrokers(false);
    }
  };

  // Filter brokers based on search term
  const searchLower = String(searchTerm || "").toLowerCase();
  const filteredBrokers = brokers.filter((broker) => {
    const fullName = String(broker.fullName || "").toLowerCase();
    const email = String(broker.email || "").toLowerCase();
    const userId = String(broker.userId || "").toLowerCase();

    return (
      fullName.includes(searchLower) ||
      email.includes(searchLower) ||
      userId.includes(searchLower)
    );
  });

  const handleAllocate = async (e) => {
    e.preventDefault();
    if (!selectedBroker || !pinAmount || !selectedClass) {
      setError("Choose a super agent and a vehicle class, and enter the number of PINs.");
      return;
    }

    // Double-check permission before proceeding
    if (!hasAllocatePermission) {
      setError("You don't have permission to allocate PINs.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const result = await PinService.allocatePins(
        selectedBroker,
        pinAmount,
        remarks,
        selectedClass
      );

      console.log(result);

      setSelectedBroker("");
      setPinAmount("");
      setSelectedClass("");
      setRemarks("");
      setShowModal(false);

      if (onAllocationSuccess) {
        onAllocationSuccess();
      }
    } catch (error) {
      console.error("Allocation failed:", error);
      setError(`Could not allocate the PINs: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedBroker("");
    setPinAmount("");
    setSelectedClass("");
    setRemarks("");
    setError("");
    setSearchTerm("");
  };

  const handleBrokerSelect = (brokerId) => {
    setSelectedBroker(brokerId);
    setSearchTerm(""); // Clear search when broker is selected
  };

  const intro = (button) => (
    <div className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-gradient-to-br from-blue-50/60 to-white p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <div className="flex items-start gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#155dfd] text-white shadow-md shadow-blue-600/20">
          <KeyRound className="h-6 w-6" />
        </span>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Allocate PINs to a super agent</h2>
          <p className="mt-1 max-w-xl text-sm text-slate-600">
            Pick the super agent, the vehicle class and how many PINs to send. Each request waits for approval before the
            PINs reach the agent.
          </p>
        </div>
      </div>
      {button}
    </div>
  );

  // Show loading while checking permission
  if (checkingPermission) {
    return intro(<div className="h-11 w-40 animate-pulse rounded-lg bg-slate-200" />);
  }

  // Show permission denied if user doesn't have Pin.ViewAllocations
  if (!hasAllocatePermission) {
    return (
      <div className="space-y-5">
        {intro(
          <button type="button" disabled className={`${btnSecondary} shrink-0`}>
            <Lock className="h-4 w-4" />
            Allocate PINs
          </button>,
        )}
        <PermissionRequired action="allocate PINs to super agents" />
      </div>
    );
  }

  const chosen = brokers.find((b) => b.userId === selectedBroker);
  const chosenClass = vehicleClasses.find((c) => String(c.value) === String(selectedClass));

  return (
    <div>
      {intro(
        <button type="button" onClick={() => setShowModal(true)} className={`${btnPrimary} shrink-0`}>
          <KeyRound className="h-4 w-4" />
          Allocate PINs
        </button>,
      )}

      {/* Allocation panel */}
      {showModal && (
        <Sheet
          open
          onClose={handleCloseModal}
          title="Allocate PINs"
          sub="Sent for approval before the PINs reach the super agent."
          footer={
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="min-w-0 truncate text-sm text-slate-500">
                {chosen && pinAmount ? (
                  <>
                    <span className="font-semibold text-slate-900">{Number(pinAmount).toLocaleString()} PINs</span> to{" "}
                    <span className="font-semibold text-slate-900">{chosen.fullName}</span>
                    {chosenClass ? ` · ${chosenClass.text || chosenClass.value}` : ""}
                  </>
                ) : (
                  "Choose a super agent, class and number of PINs."
                )}
              </p>
              <div className="flex shrink-0 gap-2">
                <button type="button" onClick={handleCloseModal} className={btnSecondary}>
                  Cancel
                </button>
                <button
                  type="submit"
                  form="allocate-pins-form"
                  disabled={loading || !selectedBroker || !selectedClass || !pinAmount}
                  className={btnPrimary}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {loading ? "Sending…" : "Send for approval"}
                </button>
              </div>
            </div>
          }
        >
          {fetchingBrokers ? (
            <div className="grid place-items-center py-20 text-sm text-slate-500">
              <Loader2 className="mb-3 h-6 w-6 animate-spin text-[#155dfd]" />
              Loading super agents…
            </div>
          ) : (
            <form id="allocate-pins-form" onSubmit={handleAllocate} className="space-y-5">
              {error && <Notice tone="error">{error}</Notice>}

              {/* Step 1: super agent */}
              <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center gap-2.5 border-b border-slate-100 px-5 py-3.5">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-[#155dfd] text-xs font-bold text-white">1</span>
                  <h3 className="text-sm font-semibold text-slate-900">Super agent</h3>
                </div>
                <div className="p-5">
                  {chosen ? (
                    <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50/50 p-3">
                      <Avatar name={chosen.fullName} className="h-10 w-10 text-sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900">{chosen.fullName}</p>
                        <p className="truncate text-xs text-slate-500">
                          {chosen.userId} · {chosen.email}
                        </p>
                      </div>
                      <button type="button" onClick={() => setSelectedBroker(null)} className={`${btnSecondary} px-3 py-1.5 text-xs`}>
                        Change
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          type="search"
                          placeholder="Search by name, email or ID"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className={`${inputCls} pl-9`}
                          autoFocus
                        />
                      </div>
                      <ul className="mt-3 max-h-72 divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-200">
                        {filteredBrokers.length === 0 ? (
                          <li className="px-4 py-8 text-center text-sm text-slate-500">
                            {searchTerm ? "No super agents match your search." : "No super agents available."}
                          </li>
                        ) : (
                          filteredBrokers.map((broker) => (
                            <li key={broker.userId}>
                              <button
                                type="button"
                                onClick={() => handleBrokerSelect(broker.userId)}
                                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50"
                              >
                                <Avatar name={broker.fullName} className="h-9 w-9 text-xs" />
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-sm font-semibold text-slate-900">{broker.fullName}</span>
                                  <span className="block truncate text-xs text-slate-500">{broker.email}</span>
                                </span>
                                <span className="hidden shrink-0 text-right sm:block">
                                  <span className="flex items-center justify-end gap-1 text-xs text-slate-500">
                                    <Building2 className="h-3 w-3" />
                                    {broker.companyId}
                                  </span>
                                  <span className="block text-[11px] text-slate-400">{broker.userId}</span>
                                </span>
                              </button>
                            </li>
                          ))
                        )}
                      </ul>
                    </>
                  )}
                </div>
              </section>

              {/* Step 2: the allocation */}
              <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center gap-2.5 border-b border-slate-100 px-5 py-3.5">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-[#155dfd] text-xs font-bold text-white">2</span>
                  <h3 className="text-sm font-semibold text-slate-900">Allocation</h3>
                </div>
                <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
                  <Field label="Vehicle class" required>
                    <div className="relative">
                      <Car className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} required className={`${inputCls} pl-9`}>
                        <option value="">{fetchingClasses ? "Loading classes…" : "Select a vehicle class"}</option>
                        {vehicleClasses
                          .filter((cls) => cls && (cls.value || cls.text))
                          .map((cls, index) => (
                            <option key={cls.value || `class-${index}`} value={cls.value || ""}>
                              {cls.text || cls.value || "Unknown Class"}
                            </option>
                          ))}
                      </select>
                    </div>
                  </Field>
                  <Field label="Number of PINs" required>
                    <div className="relative">
                      <Hash className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="number"
                        min="1"
                        value={pinAmount}
                        onChange={(e) => setPinAmount(e.target.value)}
                        placeholder="e.g. 50"
                        required
                        className={`${inputCls} pl-9`}
                      />
                    </div>
                  </Field>
                  <Field label="Remarks" wide>
                    <textarea
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      rows="3"
                      placeholder="What the PINs are for (optional)"
                      className={`${inputCls} h-auto resize-none py-2`}
                    />
                  </Field>
                </div>
              </section>

              {chosen && selectedClass && pinAmount && (
                <p className="flex items-center gap-2 text-xs text-slate-500">
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  Ready to send. An approver will review it under Pending approvals.
                </p>
              )}
            </form>
          )}
        </Sheet>
      )}
    </div>
  );
};

export default AllocatePinsModal;
