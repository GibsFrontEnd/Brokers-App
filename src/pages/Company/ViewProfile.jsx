import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import CryptoJS from "crypto-js";
import { useAuth } from "../../context/AuthContext";

const SECRET_KEY = "your-secret-key";

const decryptStoredUser = (encrypted) => {
  if (!encrypted) return null;
  try {
    const bytes = CryptoJS.AES.decrypt(encrypted, SECRET_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return decrypted ? JSON.parse(decrypted) : null;
  } catch (error) {
    console.error("Failed to decrypt stored user payload", error);
    return null;
  }
};

const extractUserId = (payload) => {
  if (!payload) return "";
  return (
    payload.userid ||
    payload.userId ||
    payload.id ||
    payload.insCompanyId ||
    payload.companyId ||
    payload.nameid ||
    payload.sub ||
    payload.unique_name ||
    ""
  );
};

const parseTokenUserId = (token) => {
  if (!token) return "";
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return extractUserId(payload);
  } catch (error) {
    console.warn("Failed to parse token payload", error);
    return "";
  }
};

const ViewProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({
    insCompanyId: "",
    companyName: "",
    address: "",
    mobilePhone: "",
    contactPerson: "",
    email: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const resolvedUserId = useMemo(() => {
    const directId = extractUserId(user);
    if (directId) return String(directId);

    if (typeof window === "undefined") return "";

    const encryptedUser = window.localStorage.getItem("user");
    const decryptedUser = decryptStoredUser(encryptedUser);
    if (decryptedUser) {
      const decryptedId = extractUserId(decryptedUser);
      if (decryptedId) return String(decryptedId);
    }

    const storedToken = window.localStorage.getItem("token");
    return String(parseTokenUserId(storedToken) || "");
  }, [user]);

  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        setError("");

        if (typeof window === "undefined") {
          throw new Error("Window context unavailable.");
        }

        const token = window.localStorage.getItem("token");
        if (!token) {
          throw new Error("No authentication token found. Please log in.");
        }

        if (!resolvedUserId) {
          throw new Error("Company ID not found. Please log in again.");
        }

        const response = await axios.get(
          `https://gibsbrokersapi.newgibsonline.com/api/Auth/companies/${resolvedUserId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        let profileData = response.data?.data ?? response.data;
        if (Array.isArray(profileData)) {
          profileData = profileData[0] ?? null;
        }

        if (!profileData) {
          throw new Error("Profile data not found.");
        }

        const normalizedProfile = {
          insCompanyId:
            profileData.insCompanyId ||
            profileData.companyId ||
            String(resolvedUserId),
          companyName: profileData.companyName || profileData.name || "",
          address: profileData.address || "",
          mobilePhone: profileData.mobilePhone || profileData.phoneNumber || "",
          contactPerson:
            profileData.contactPerson || profileData.contactName || "",
          email: profileData.email || "",
        };

        if (!isMounted) return;
        setProfile(normalizedProfile);
        setFormData(normalizedProfile);
      } catch (err) {
        console.error("Error fetching company profile", err);
        if (!isMounted) return;
        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to load profile data."
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    if (resolvedUserId) {
      fetchProfile();
    } else {
      setIsLoading(false);
      setError("Company ID not found. Please log in again.");
    }

    return () => {
      isMounted = false;
    };
  }, [resolvedUserId]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      if (typeof window === "undefined") {
        throw new Error("Window context unavailable.");
      }

      setIsSaving(true);
      setError("");

      const token = window.localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found. Please log in.");
      }

      const profileId =
        profile?.insCompanyId ||
        profile?.companyId ||
        profile?.id ||
        resolvedUserId;

      await axios.put(
        `https://gibsbrokersapi.newgibsonline.com/api/Auth/companies/${profileId}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setProfile(formData);
      setIsEditing(false);
      window.alert("Profile updated successfully.");
    } catch (err) {
      console.error("Error updating company profile", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to update profile."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (profile) {
      setFormData(profile);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 text-center">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <div className="animate-pulse text-gray-600">
            Loading profile data...
          </div>
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 mr-3"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <strong>Error:</strong> {error}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              Company Profile Settings
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              View and manage your company profile information
            </p>
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Edit Profile
            </button>
          )}
        </div>

        {error && profile && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-2 rounded-lg">
            {error}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-6">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <div className="flex items-start sm:items-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                  Company Profile Details
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">
                  {isEditing
                    ? "Edit your company and contact information"
                    : "Review your company profile information"}
                </p>
              </div>
            </div>
          </div>

          {isEditing ? (
            <form onSubmit={handleSubmit} className="p-4 sm:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company ID
                  </label>
                  <input
                    type="text"
                    name="insCompanyId"
                    value={formData.insCompanyId}
                    disabled
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name
                  </label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mobile Phone
                  </label>
                  <input
                    type="tel"
                    name="mobilePhone"
                    value={formData.mobilePhone}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    name="contactPerson"
                    value={formData.contactPerson}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:justify-end sm:items-center gap-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          ) : (
            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Company ID
                  </span>
                  <p className="text-sm sm:text-base text-gray-900 break-words">
                    {profile?.insCompanyId || "—"}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Company Name
                  </span>
                  <p className="text-sm sm:text-base text-gray-900 break-words">
                    {profile?.companyName || "—"}
                  </p>
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Address
                  </span>
                  <p className="text-sm sm:text-base text-gray-900 break-words">
                    {profile?.address || "No address on file"}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Mobile Phone
                  </span>
                  <p className="text-sm sm:text-base text-gray-900 break-words">
                    {profile?.mobilePhone || "No phone number on file"}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Contact Person
                  </span>
                  <p className="text-sm sm:text-base text-gray-900 break-words">
                    {profile?.contactPerson || "No contact person on file"}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Email Address
                  </span>
                  <p className="text-sm sm:text-base text-gray-900 break-words">
                    {profile?.email || "No email on file"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewProfile;
