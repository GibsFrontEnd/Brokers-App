import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getApiBaseUrl } from "../../utils/config";

// Some accounts store placeholder text such as "N/A", so only a real address counts.
export const isEmail = (v) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test((v || "").trim());

/**
 * The signed-in user's email as it is on their profile right now (not the copy saved at login,
 * which goes stale after an edit). Returns "" until it is known, or if there is no valid email.
 */
const useProfileEmail = () => {
  const { user } = useAuth();
  const loginEmail = isEmail(user?.email) ? user.email.trim() : "";
  const [profileEmail, setProfileEmail] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    let userId = user?.userId;
    if (!userId && token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        userId = payload.nameid || payload.sub || payload.unique_name;
      } catch {
        // no usable id in the token
      }
    }
    if (!userId || !token) return;

    let cancelled = false;
    fetch(`${getApiBaseUrl()}/Auth/user/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((body) => {
        const email = (body?.data || body)?.email;
        if (!cancelled && isEmail(email)) setProfileEmail(email.trim());
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user?.userId]);

  return profileEmail || loginEmail;
};

export default useProfileEmail;
