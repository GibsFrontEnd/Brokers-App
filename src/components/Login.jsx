import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  User,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import AuthShell from "./Auth/AuthShell";
import { getApiBaseUrl } from "../utils/config";

const fieldBase =
  "h-11 [@media(max-height:760px)]:h-10 w-full rounded-xl border bg-white pl-10 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#155dfd] focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50";

const FORGOT_STEPS = [
  { title: "Reset your password", text: "Enter the email on your account and we will send you a one-time code.", label: "Email" },
  { title: "Enter the code", text: null, label: "Code" },
  { title: "Choose a new password", text: "Use at least 8 characters.", label: "Password" },
];

const Notice = ({ tone, children }) => {
  const error = tone === "error";
  const Icon = error ? AlertCircle : CheckCircle2;
  return (
    <div
      role={error ? "alert" : "status"}
      className={`flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm ring-1 ${
        error ? "bg-rose-50 text-rose-800 ring-rose-200" : "bg-emerald-50 text-emerald-800 ring-emerald-200"
      }`}
    >
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${error ? "text-rose-600" : "text-emerald-600"}`} />
      <span>{children}</span>
    </div>
  );
};

const RevealButton = ({ shown, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={shown ? "Hide password" : "Show password"}
    className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-slate-400 hover:text-slate-600"
  >
    {shown ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
  </button>
);

const PrimaryButton = ({ loading, loadingText, children, ...props }) => (
  <button
    type="button"
    {...props}
    className="inline-flex h-12 [@media(max-height:760px)]:h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#155dfd] text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:bg-[#0f4bd1] disabled:cursor-not-allowed disabled:opacity-60"
  >
    {loading ? (
      <>
        <Loader2 className="h-4 w-4 animate-spin" />
        {loadingText}
      </>
    ) : (
      children
    )}
  </button>
);

export default function UnifiedLogin() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  // Forgot Password States
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // 1: Email, 2: OTP, 3: Reset Password
  const [forgotData, setForgotData] = useState({
    email: "",
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState("");
  const [otpTimer, setOtpTimer] = useState(0);
  const [canResendOTP, setCanResendOTP] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Refs for OTP input
  const otpInputRef = useRef(null);

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();

  // OTP Timer Effect
  useEffect(() => {
    let interval;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    } else if (otpTimer === 0 && currentStep === 2) {
      setCanResendOTP(true);
    }
    return () => clearInterval(interval);
  }, [otpTimer, currentStep]);

  // Focus OTP input when step changes
  useEffect(() => {
    if (currentStep === 2 && otpInputRef.current) {
      otpInputRef.current.focus();
    }
  }, [currentStep]);

  // Close the reset dialog with Escape
  useEffect(() => {
    if (!showForgotPassword) return;
    const onKey = (e) => e.key === "Escape" && closeForgotPasswordModal();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showForgotPassword]);


  // Handle Forgot Password Input Changes
  const handleForgotInputChange = (e) => {
    const { name, value } = e.target;

    // For OTP input, only allow numbers
    if (name === "otp") {
      // Remove any non-numeric characters
      const numericValue = value.replace(/\D/g, "");
      // Limit to 6 digits
      const limitedValue = numericValue.slice(0, 6);
      setForgotData((prev) => ({
        ...prev,
        [name]: limitedValue,
      }));
    } else {
      setForgotData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Step 1: Send OTP to Email
  const handleSendOTP = async () => {
    if (!forgotData.email.trim()) {
      setForgotError("Please enter your email address");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(forgotData.email)) {
      setForgotError("Please enter a valid email address");
      return;
    }

    setForgotLoading(true);
    setForgotError("");
    setForgotSuccess("");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${getApiBaseUrl()}/Auth/forgot-password`, {
        method: "POST",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          email: forgotData.email,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setForgotSuccess(
          "OTP has been sent to your email. Please check your inbox.",
        );
        setCurrentStep(2);
        setOtpTimer(120); // Changed to 2 minutes (120 seconds)
        setCanResendOTP(false);
      } else {
        throw new Error(result.message || "Failed to send OTP");
      }
    } catch (err) {
      setForgotError(err.message || "Failed to send OTP. Please try again.");
    } finally {
      setForgotLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async () => {
    if (!forgotData.otp.trim() || forgotData.otp.length !== 6) {
      setForgotError("Please enter a valid 6-digit OTP");
      return;
    }

    setForgotLoading(true);
    setForgotError("");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${getApiBaseUrl()}/Auth/verify-otp`, {
        method: "POST",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          email: forgotData.email,
          otp: forgotData.otp,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setForgotSuccess("OTP verified successfully!");
        setTimeout(() => {
          setCurrentStep(3);
          setForgotSuccess("");
        }, 1500);
      } else {
        throw new Error(result.message || "Invalid OTP");
      }
    } catch (err) {
      setForgotError(err.message || "Failed to verify OTP. Please try again.");
    } finally {
      setForgotLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async () => {
    // Validation
    if (!forgotData.newPassword || !forgotData.confirmPassword) {
      setForgotError("Please enter both password fields");
      return;
    }

    if (forgotData.newPassword.length < 8) {
      setForgotError("Password must be at least 8 characters long");
      return;
    }

    if (forgotData.newPassword !== forgotData.confirmPassword) {
      setForgotError("Passwords do not match");
      return;
    }

    setForgotLoading(true);
    setForgotError("");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${getApiBaseUrl()}/Auth/reset-password`, {
        method: "POST",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          email: forgotData.email,
          otp: forgotData.otp,
          newPassword: forgotData.newPassword,
          confirmPassword: forgotData.confirmPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`,
        );
      }

      const result = await response.json();

      if (result.success) {
        setForgotSuccess(
          "Password reset successfully! Redirecting to login...",
        );
        setTimeout(() => {
          closeForgotPasswordModal();
          // Clear the form
          setFormData((prev) => ({ ...prev, password: "" }));
        }, 2000);
      } else {
        throw new Error(result.message || "Failed to reset password");
      }
    } catch (err) {
      setForgotError(
        err.message || "Failed to reset password. Please try again.",
      );
    } finally {
      setForgotLoading(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    if (!canResendOTP) return;

    setForgotLoading(true);
    setForgotError("");
    setForgotSuccess("");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${getApiBaseUrl()}/Auth/resend-otp`, {
        method: "POST",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          email: forgotData.email,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setForgotSuccess("New OTP sent to your email!");
        setOtpTimer(120); // Changed to 2 minutes (120 seconds)
        setCanResendOTP(false);
      } else {
        throw new Error(result.message || "Failed to resend OTP");
      }
    } catch (err) {
      setForgotError(err.message || "Failed to resend OTP. Please try again.");
    } finally {
      setForgotLoading(false);
    }
  };

  // Close Forgot Password Modal
  const closeForgotPasswordModal = () => {
    setShowForgotPassword(false);
    setCurrentStep(1);
    setForgotData({
      email: "",
      otp: "",
      newPassword: "",
      confirmPassword: "",
    });
    setForgotError("");
    setForgotSuccess("");
    setOtpTimer(0);
    setCanResendOTP(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLogin = async () => {
    if (!formData.username || !formData.password) {
      setError("Please enter both username and password");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await login({
        username: formData.username,
        password: formData.password,
      });

      if (result.success) {
        // Route ONLY by entityType (ignore role entirely)
        const entityType = String(result.user.entityType || "").toLowerCase();

        console.log("Routing info:", { entityType });

        if (entityType === "user") {
          console.log("Routing to admin dashboard");
          navigate("/admin/dashboard");
        } else if (entityType === "broker") {
          console.log("Routing to broker (super agent) dashboard");
          navigate("/brokers/dashboard");
        } else if (entityType === "customer") {
          console.log("Routing to customer (sub agent) dashboard");
          navigate("/client/dashboard");
        } else if (entityType === "company") {
          console.log("Routing to company dashboard");
          navigate("/company/dashboard");
        } else {
          console.log(
            "Unknown entityType; default routing to client dashboard",
          );
          navigate("/client/dashboard");
        }
      } else {
        setError(
          result.error || "Login failed. Please check your credentials.",
        );
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("An error occurred during login. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Format timer display
  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const step = FORGOT_STEPS[currentStep - 1];

  return (
    <AuthShell>
      <h1 className="text-3xl font-bold tracking-tight text-slate-900 [@media(max-height:760px)]:text-2xl">
        Welcome back
      </h1>
      <p className="mt-1.5 text-sm text-slate-500">
        Sign in with your portal account to open your dashboard.
      </p>

      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          handleLogin();
        }}
        className="mt-8 space-y-5 [@media(max-height:760px)]:mt-4 [@media(max-height:760px)]:space-y-3"
      >
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-slate-700">
            Username
          </label>
          <div className="relative mt-1.5">
            <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              placeholder="your.username"
              value={formData.username}
              onChange={handleInputChange}
              aria-invalid={!!error && !formData.username}
              className={`${fieldBase} ${error && !formData.username ? "border-rose-400" : "border-slate-200"}`}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
              Password
            </label>
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="text-xs font-semibold text-[#155dfd] hover:text-[#0f4bd1]"
            >
              Forgot password?
            </button>
          </div>
          <div className="relative mt-1.5">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleInputChange}
              aria-invalid={!!error && !formData.password}
              className={`${fieldBase} pr-11 ${error && !formData.password ? "border-rose-400" : "border-slate-200"}`}
            />
            <RevealButton shown={showPassword} onClick={() => setShowPassword((v) => !v)} />
          </div>
        </div>

        {error && <Notice tone="error">{error}</Notice>}

        <PrimaryButton type="submit" disabled={loading} loading={loading} loadingText="Signing in…">
          Sign in to your portal
          <ArrowRight className="h-4 w-4" />
        </PrimaryButton>
      </form>

      <div className="mt-6 flex items-start gap-2.5 rounded-xl bg-blue-50 px-4 py-3 text-xs text-slate-600 [@media(max-height:760px)]:mt-3 [@media(max-height:760px)]:py-2">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#155dfd]" />
        <span>
          One sign-in for admins, super agents and sub agents. You will land on the dashboard for your account
          type. No account yet? Ask your administrator to set one up.
        </span>
      </div>

      {/* Forgot Password dialog */}
      {showForgotPassword && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4 backdrop-blur-sm"
          onMouseDown={(e) => e.target === e.currentTarget && closeForgotPasswordModal()}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="forgot-title"
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl sm:p-7"
          >
            <div className="flex items-start justify-between gap-4">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-blue-50 text-[#155dfd] ring-8 ring-blue-50/50">
                {currentStep === 1 ? <Mail className="h-5 w-5" /> : currentStep === 2 ? <KeyRound className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
              </span>
              <button
                type="button"
                onClick={closeForgotPasswordModal}
                aria-label="Close"
                className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <h2 id="forgot-title" className="mt-4 text-lg font-semibold text-slate-900">
              {step.title}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {currentStep === 2 ? (
                <>
                  We sent a 6-digit code to <span className="font-medium text-slate-700">{forgotData.email}</span>.
                </>
              ) : (
                step.text
              )}
            </p>

            {/* Progress */}
            <ol className="mt-5 grid grid-cols-3 gap-2" aria-label="Progress">
              {FORGOT_STEPS.map((s, i) => {
                const n = i + 1;
                const done = n < currentStep;
                const current = n === currentStep;
                return (
                  <li key={s.label} aria-current={current ? "step" : undefined}>
                    <span className={`block h-1.5 rounded-full ${done || current ? "bg-[#155dfd]" : "bg-slate-200"}`} />
                    <span className={`mt-1.5 flex items-center gap-1 text-[11px] font-medium ${current ? "text-slate-900" : "text-slate-400"}`}>
                      {done && <Check className="h-3 w-3 text-emerald-600" />}
                      {s.label}
                    </span>
                  </li>
                );
              })}
            </ol>

            <div className="mt-6 space-y-4">
              {/* Step 1: Email */}
              {currentStep === 1 && (
                <>
                  <div>
                    <label htmlFor="forgotEmail" className="block text-sm font-medium text-slate-700">
                      Email address
                    </label>
                    <div className="relative mt-1.5">
                      <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        name="email"
                        id="forgotEmail"
                        autoFocus
                        value={forgotData.email}
                        onChange={handleForgotInputChange}
                        placeholder="you@example.com"
                        className={`${fieldBase} border-slate-200`}
                        disabled={forgotLoading}
                        onKeyDown={(e) => e.key === "Enter" && handleSendOTP()}
                      />
                    </div>
                  </div>
                  {forgotError && <Notice tone="error">{forgotError}</Notice>}
                  {forgotSuccess && <Notice tone="success">{forgotSuccess}</Notice>}
                  <PrimaryButton
                    onClick={handleSendOTP}
                    disabled={forgotLoading || !forgotData.email}
                    loading={forgotLoading}
                    loadingText="Sending code…"
                  >
                    Send code
                    <ArrowRight className="h-4 w-4" />
                  </PrimaryButton>
                </>
              )}

              {/* Step 2: OTP */}
              {currentStep === 2 && (
                <>
                  <div>
                    <label htmlFor="otp" className="block text-sm font-medium text-slate-700">
                      6-digit code
                    </label>
                    <input
                      ref={otpInputRef}
                      type="text"
                      name="otp"
                      id="otp"
                      value={forgotData.otp}
                      onChange={handleForgotInputChange}
                      placeholder="••••••"
                      maxLength="6"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      pattern="[0-9]*"
                      className="mt-1.5 h-14 w-full rounded-xl border border-slate-200 bg-white text-center font-mono text-2xl tracking-[0.5em] text-slate-900 outline-none transition placeholder:text-slate-300 focus:border-[#155dfd] focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50"
                      disabled={forgotLoading}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && forgotData.otp.length === 6) {
                          handleVerifyOTP();
                        }
                      }}
                    />
                    <div className="mt-2 flex items-center justify-between text-sm">
                      {otpTimer > 0 ? (
                        <span className="text-slate-500">
                          Code expires in{" "}
                          <span className="font-mono font-semibold tabular-nums text-slate-900">{formatTimer(otpTimer)}</span>
                        </span>
                      ) : (
                        <span className="text-rose-600">Code expired</span>
                      )}
                      <button
                        type="button"
                        onClick={handleResendOTP}
                        disabled={!canResendOTP || forgotLoading}
                        className="font-semibold text-[#155dfd] hover:text-[#0f4bd1] disabled:cursor-not-allowed disabled:text-slate-400"
                      >
                        Resend code
                      </button>
                    </div>
                  </div>
                  {forgotError && <Notice tone="error">{forgotError}</Notice>}
                  {forgotSuccess && <Notice tone="success">{forgotSuccess}</Notice>}
                  <PrimaryButton
                    onClick={handleVerifyOTP}
                    disabled={forgotLoading || forgotData.otp.length !== 6}
                    loading={forgotLoading}
                    loadingText="Checking code…"
                  >
                    Verify code
                  </PrimaryButton>
                </>
              )}

              {/* Step 3: New password */}
              {currentStep === 3 && (
                <>
                  <div>
                    <label htmlFor="newPassword" className="block text-sm font-medium text-slate-700">
                      New password
                    </label>
                    <div className="relative mt-1.5">
                      <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type={showNewPassword ? "text" : "password"}
                        name="newPassword"
                        id="newPassword"
                        autoComplete="new-password"
                        value={forgotData.newPassword}
                        onChange={handleForgotInputChange}
                        placeholder="At least 8 characters"
                        className={`${fieldBase} border-slate-200 pr-11`}
                        disabled={forgotLoading}
                      />
                      <RevealButton shown={showNewPassword} onClick={() => setShowNewPassword((v) => !v)} />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700">
                      Confirm new password
                    </label>
                    <div className="relative mt-1.5">
                      <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        id="confirmPassword"
                        autoComplete="new-password"
                        value={forgotData.confirmPassword}
                        onChange={handleForgotInputChange}
                        placeholder="Type it again"
                        className={`${fieldBase} border-slate-200 pr-11`}
                        disabled={forgotLoading}
                        onKeyDown={(e) => e.key === "Enter" && handleResetPassword()}
                      />
                      <RevealButton shown={showConfirmPassword} onClick={() => setShowConfirmPassword((v) => !v)} />
                    </div>
                  </div>
                  {forgotError && <Notice tone="error">{forgotError}</Notice>}
                  {forgotSuccess && <Notice tone="success">{forgotSuccess}</Notice>}
                  <PrimaryButton
                    onClick={handleResetPassword}
                    disabled={forgotLoading || !forgotData.newPassword || !forgotData.confirmPassword}
                    loading={forgotLoading}
                    loadingText="Saving password…"
                  >
                    Save new password
                  </PrimaryButton>
                </>
              )}

              {(currentStep === 2 || currentStep === 3) && (
                <button
                  type="button"
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </AuthShell>
  );
}
