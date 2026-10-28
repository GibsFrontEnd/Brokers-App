import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowLeft, Check, Circle, Eye, EyeOff, KeyRound, Loader2, Lock, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getApiBaseUrl } from "../utils/config";
import { Avatar, Field, Notice, PageHeader, btnPrimary, btnSecondary, inputCls } from "../components/UI/PageKit";

// Where each kind of account goes back to (the routes pass userType).
const DASHBOARDS = {
  admin: "/admin/dashboard",
  broker: "/brokers/dashboard",
  customer: "/client/dashboard",
  company: "/company/dashboard",
};

const ACCOUNT_LABELS = {
  admin: "Administrator",
  broker: "Super agent",
  customer: "Sub agent",
  company: "Company",
};

const REQUIREMENTS = [
  { key: "length", text: "At least 8 characters" },
  { key: "uppercase", text: "An uppercase letter" },
  { key: "lowercase", text: "A lowercase letter" },
  { key: "number", text: "A number" },
  { key: "special", text: "A special character" },
];

const STRENGTH = [
  { max: 2, label: "Weak", bar: "bg-rose-500", text: "text-rose-600" },
  { max: 3, label: "Fair", bar: "bg-amber-500", text: "text-amber-600" },
  { max: 4, label: "Good", bar: "bg-blue-500", text: "text-blue-600" },
  { max: 5, label: "Strong", bar: "bg-emerald-500", text: "text-emerald-600" },
];

// A password box with a show/hide button.
const PasswordInput = ({ shown, onToggle, invalid, ...props }) => (
  <div className="relative">
    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
    <input
      {...props}
      type={shown ? "text" : "password"}
      className={`${inputCls} h-11 pl-9 pr-11 ${invalid ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100" : ""}`}
    />
    <button
      type="button"
      onClick={onToggle}
      aria-label={shown ? "Hide password" : "Show password"}
      className="absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-md text-slate-400 hover:text-slate-600"
    >
      {shown ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  </div>
);

const ChangePassword = ({ userType }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const home = DASHBOARDS[userType] || "/";

  // The signed-in user, from the login session.
  const userData = {
    userId: user?.userId || "",
    fullName: user?.fullName || "",
    email: user?.email || "",
    username: user?.username || "",
  };

  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [passwordScore, setPasswordScore] = useState(0);

  // Password strength checker
  useEffect(() => {
    if (formData.newPassword) {
      const checks = {
        length: formData.newPassword.length >= 8,
        uppercase: /[A-Z]/.test(formData.newPassword),
        lowercase: /[a-z]/.test(formData.newPassword),
        number: /[0-9]/.test(formData.newPassword),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(formData.newPassword),
      };

      setPasswordStrength(checks);

      // Calculate password score
      const score = Object.values(checks).filter(Boolean).length;
      setPasswordScore(score);
    } else {
      setPasswordStrength({
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
        special: false,
      });
      setPasswordScore(0);
    }
  }, [formData.newPassword]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear errors when user types
    if (error || success) {
      setError("");
      setSuccess("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (formData.newPassword !== formData.confirmPassword) {
      setError("New password and confirm password don't match");
      return;
    }

    if (passwordScore < 3) {
      setError("Password must meet at least 3 requirements");
      return;
    }

    if (formData.currentPassword === formData.newPassword) {
      setError("New password must be different from current password");
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      setSuccess("");

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found. Please login again.");
      }

      // Prepare request body
      const requestBody = {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
      };

      // Make API call
      const response = await fetch(`${getApiBaseUrl()}/Auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.Message ||
            data.error ||
            `Failed to change password (Status: ${response.status})`,
        );
      }

      // Success
      setSuccess("Password changed. Taking you back to your dashboard…");

      // Clear form
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      // Redirect after delay
      setTimeout(() => {
        navigate(home);
      }, 2000);
    } catch (err) {
      setError(err.message || "Failed to update password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const displayName = userData.fullName || userData.username || userData.email || "User";
  const strength = STRENGTH.find((s) => passwordScore <= s.max) || STRENGTH[0];
  const mismatch = Boolean(formData.confirmPassword) && formData.newPassword !== formData.confirmPassword;
  const matches = Boolean(formData.confirmPassword) && !mismatch;

  return (
    <div className="space-y-6">
      <div>
        <Link to={home} className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>
        <PageHeader title="Change password" description="Choose a new password for signing in to the portal." />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        {/* Form */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50 text-[#155dfd]">
              <KeyRound className="h-[18px] w-[18px]" />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Your password</h2>
              <p className="text-xs text-slate-500">Enter the one you use now, then the new one twice.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
            {error && <Notice tone="error">{error}</Notice>}
            {success && <Notice>{success}</Notice>}

            <Field label="Current password">
              <PasswordInput
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                placeholder="Enter your current password"
                autoComplete="current-password"
                required
                shown={showPasswords.current}
                onToggle={() => togglePasswordVisibility("current")}
              />
            </Field>

            <div className="h-px bg-slate-100" />

            <Field label="New password">
              <PasswordInput
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                placeholder="Enter a new password"
                autoComplete="new-password"
                required
                shown={showPasswords.new}
                onToggle={() => togglePasswordVisibility("new")}
              />
              {formData.newPassword && (
                <span className="mt-2.5 block">
                  <span className="flex items-center gap-3">
                    <span className="flex h-1.5 flex-1 gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <span key={n} className={`flex-1 rounded-full transition-colors ${n <= passwordScore ? strength.bar : "bg-slate-200"}`} />
                      ))}
                    </span>
                    <span className={`w-14 text-right text-xs font-semibold ${strength.text}`}>{strength.label}</span>
                  </span>
                </span>
              )}
            </Field>

            <Field label="Confirm new password">
              <PasswordInput
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Type the new password again"
                autoComplete="new-password"
                required
                invalid={mismatch}
                shown={showPasswords.confirm}
                onToggle={() => togglePasswordVisibility("confirm")}
              />
              {mismatch && <span className="mt-1.5 block text-xs text-rose-600">The passwords don't match.</span>}
              {matches && (
                <span className="mt-1.5 flex items-center gap-1 text-xs text-emerald-600">
                  <Check className="h-3.5 w-3.5" />
                  Passwords match
                </span>
              )}
            </Field>

            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
              <Link to={home} className={btnSecondary}>
                Cancel
              </Link>
              <button type="submit" disabled={isLoading || passwordScore < 3 || formData.newPassword !== formData.confirmPassword} className={btnPrimary}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                {isLoading ? "Updating…" : "Update password"}
              </button>
            </div>
          </form>
        </section>

        {/* Account and requirements */}
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <Avatar name={displayName} className="h-11 w-11 text-sm" />
              <div className="min-w-0">
                <p className="truncate font-semibold capitalize text-slate-900">{displayName}</p>
                <p className="truncate text-xs text-slate-500">{userData.email || userData.userId}</p>
              </div>
            </div>
            <p className="mt-3 inline-flex rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 ring-1 ring-blue-200">
              {ACCOUNT_LABELS[userType] || "User"}
            </p>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-2.5 border-b border-slate-100 px-5 py-3.5">
              <ShieldCheck className="h-4 w-4 text-[#155dfd]" />
              <h2 className="text-sm font-semibold text-slate-900">A strong password has</h2>
            </div>
            <ul className="space-y-2.5 p-5">
              {REQUIREMENTS.map((req) => {
                const met = passwordStrength[req.key];
                return (
                  <li key={req.key} className={`flex items-center gap-2.5 text-sm ${met ? "text-emerald-700" : "text-slate-600"}`}>
                    {met ? (
                      <span className="grid h-4 w-4 place-items-center rounded-full bg-emerald-500 text-white">
                        <Check className="h-3 w-3" />
                      </span>
                    ) : (
                      <Circle className="h-4 w-4 text-slate-300" />
                    )}
                    {req.text}
                  </li>
                );
              })}
            </ul>
            <p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">Meet at least three of these to save. All five is best.</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;
