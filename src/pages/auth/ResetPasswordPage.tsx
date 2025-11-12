import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useVerifyResetToken, useResetPassword } from "../../hooks";
import { useAuthStore } from "../../stores";
import { Button } from "../../components/ui/Button";
import { PasswordInput } from "../../components/ui/PasswordInput";
import { ApiErrorClass } from "../../api";
import { Loading } from "../../components/ui/Loading";
import { validatePasswordStrength } from "../../utils/invitationSecurity";
import logo from "/logo.svg";
import { toast } from "sonner";

const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { isAuthenticated } = useAuthStore();

  const [error, setError] = useState<string>("");
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });

  const { 
    data: resetData, 
    isLoading: isVerifying, 
    error: verificationError 
  } = useVerifyResetToken(token || "");

  const { mutate: resetPassword, isPending: isResetting } = useResetPassword();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (verificationError) {
      if (verificationError instanceof ApiErrorClass) {
        setError(verificationError.message);
      } else {
        setError("Invalid or expired reset link. Please request a new password reset.");
      }
    }
  }, [verificationError]);

  const validateForm = (): boolean => {
    setError("");

    if (!formData.password.trim()) {
      setError("Password is required");
      return false;
    }

    const passwordValidation = validatePasswordStrength(formData.password);
    if (!passwordValidation.isValid) {
      setError(passwordValidation.errors[0]);
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !token) {
      return;
    }

    resetPassword(
      {
        token,
        password: formData.password,
        confirm_password: formData.confirmPassword,
      },
      {
        onSuccess: () => {
          toast.success("Password reset successfully. Please log in with your new password.");
          navigate("/login", { 
            state: { message: "Password reset successfully. Please log in with your new password." }
          });
        },
        onError: (err) => {
          console.error("Reset password error:", err);

          if (err instanceof ApiErrorClass) {
            setError(err.message);
          } else {
            setError("Something went wrong. Please try again.");
          }
          toast.error("Failed to reset password. Please try again.");
        },
      }
    );
  };

  const handleInputChange =
    (field: keyof typeof formData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({
        ...prev,
        [field]: e.target.value,
      }));

      if (error) {
        setError("");
      }
    };

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light">
        <Loading
          size="lg"
          message="Verifying reset link..."
          subMessage="Please wait while we validate your password reset link."
        />
      </div>
    );
  }

  if (verificationError || !resetData?.valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light">
        <div className="w-full max-w-2xl space-y-6 text-center">
          <div className="flex items-center justify-center space-x-2">
            <img
              src={logo}
              alt="Pactle AI Logo"
              width={24}
              height={24}
              loading="lazy"
              className="object-cover"
            />
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h1 className="text-xl font-semibold text-red-800 mb-2">
              Invalid Reset Link
            </h1>
            <p className="text-red-700 mb-4">
              {error || "This password reset link is invalid or has expired."}
            </p>
            <p className="text-sm text-red-600 mb-4">
              Please request a new password reset link.
            </p>
            <button
              onClick={() => navigate("/login")}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background-light p-3 sm:p-0">
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center space-x-2">
              <img
                src={logo}
                alt="Pactle AI Logo"
                width={24}
                height={24}
                loading="lazy"
                className="object-cover"
              />
            </div>
            <h1 className="text-3xl font-medium text-green-darkest leading-tight">
              Reset Your Password
            </h1>
            <p className="text-green-darkest text-base font-regular px-4">
              Enter your new password below to complete the reset process.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            <div>
              <PasswordInput
                id="password"
                label="New Password"
                name="password"
                placeholder="Enter your new password"
                value={formData.password}
                onChange={handleInputChange("password")}
                disabled={isResetting}
              />
              <p className="text-xs text-gray-light mt-1">
                Must be at least 8 characters
              </p>
            </div>

            <div>
              <PasswordInput
                id="confirmPassword"
                label="Confirm New Password"
                name="confirmPassword"
                placeholder="Confirm your new password"
                value={formData.confirmPassword}
                onChange={handleInputChange("confirmPassword")}
                disabled={isResetting}
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center bg-red-50 p-2 rounded-md">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={isResetting}
              className="w-full"
            >
              {isResetting ? "Resetting password..." : "Reset Password"}
            </Button>
          </form>

          <div className="text-center">
            <p className="text-sm text-gray-light">
              Remember your password?{" "}
              <button
                onClick={() => navigate("/login")}
                className="text-green-default hover:text-green-dark underline"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
