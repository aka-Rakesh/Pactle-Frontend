import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useVerifyInvitation, useVerifyEmail, useSetupPassword } from "../../hooks";
import { useAuthStore } from "../../stores";
import { Button } from "../../components/ui/Button";
import { PasswordInput } from "../../components/ui/PasswordInput";
import { ApiErrorClass } from "../../api";
import { Loading } from "../../components/ui/Loading";
import { 
  validateTokenFormat, 
  validatePasswordStrength, 
  invitationRateLimiter,
  logSecurityEvent 
} from "../../utils/invitationSecurity";
import logo from "/logo.svg";
import { toast } from "sonner";

const SetupPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { isAuthenticated } = useAuthStore();

  const [error, setError] = useState<string>("");
  const [fieldErrors, setFieldErrors] = useState<{ password?: string; confirm_password?: string; token?: string; non_field_errors?: string }>({});
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });

  const isEmailToken = token && token.length > 64;
  
  // Debug logging
  console.log('SetupPasswordPage Debug:', {
    token: token ? `${token.substring(0, 10)}...` : 'No token',
    tokenLength: token?.length,
    isEmailToken,
    hasToken: !!token
  });
  
  // Verify invitation token (only for invitation tokens)
  const { 
    data: invitationData, 
    isLoading: isVerifyingInvitation, 
    error: invitationError 
  } = useVerifyInvitation(!isEmailToken && token ? token : "");

  // Verify email token (only for email tokens)
  const { 
    data: emailData, 
    isLoading: isVerifyingEmail, 
    error: emailError 
  } = useVerifyEmail(isEmailToken && token ? token : "");

  const isVerifying = isVerifyingInvitation || isVerifyingEmail;
  const verificationError = isEmailToken ? emailError : invitationError;
  const verificationData = isEmailToken ? emailData : invitationData;
  
  // Debug logging for verification results
  console.log('Verification Debug:', {
    isVerifying,
    verificationError: verificationError?.message,
    verificationData: verificationData ? {
      valid: verificationData.valid,
      success: verificationData.success
    } : null,
    invitationData: invitationData ? {
      valid: invitationData.valid,
      success: invitationData.success
    } : null,
    emailData: emailData ? {
      valid: emailData.valid,
      success: emailData.success
    } : null
  });

  // Validate token format on component mount
  useEffect(() => {
    if (token && !validateTokenFormat(token)) {
      setError("Invalid token format");
      logSecurityEvent('invalid_token_format', { token: token.substring(0, 10) + '...' });
    }
  }, [token]);

  // Setup password mutation
  const { mutate: setupPassword, isPending: isSettingUp } = useSetupPassword();

  // Navigate when authentication state changes
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/welcome", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Handle verification errors
  useEffect(() => {
    if (verificationError) {
      if (verificationError instanceof ApiErrorClass) {
        setError(verificationError.message);
      } else {
        if (isEmailToken) {
          setError("Invalid or expired email verification link. Please try signing up again.");
        } else {
          setError("Invalid or expired invitation link. Please contact your administrator.");
        }
      }
    }
  }, [verificationError, isEmailToken]);

  const validateForm = (): boolean => {
    setError("");
    setFieldErrors({});

    if (!formData.password.trim()) {
      setFieldErrors((prev) => ({ ...prev, password: "Password is required" }));
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setFieldErrors((prev) => ({ ...prev, confirm_password: "Passwords do not match" }));
      return false;
    }

    // Use security utility for password validation
    const passwordValidation = validatePasswordStrength(formData.password);
    if (!passwordValidation.isValid) {
      setFieldErrors((prev) => ({ ...prev, password: passwordValidation.errors[0] }));
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !token) {
      return;
    }

    // Rate limiting check
    const rateLimitKey = `setup_password_${token.substring(0, 10)}`;
    if (invitationRateLimiter.isRateLimited(rateLimitKey)) {
      setError("Too many attempts. Please try again later.");
      logSecurityEvent('rate_limit_exceeded', { token: token.substring(0, 10) + '...' });
      return;
    }

    setupPassword(
      {
        token,
        password: formData.password,
        confirm_password: formData.confirmPassword,
      },
      {
        onSuccess: () => {
          logSecurityEvent('password_setup_success', { 
            email: invitationData?.user_info?.email,
            company: invitationData?.user_info?.company_name,
            token_type: isEmailToken ? 'email_verification' : 'invitation'
          });
          invitationRateLimiter.clearAttempts(rateLimitKey);
          toast.success("Password set successfully. You can sign in now.");
        },
        onError: (err) => {
          console.error("Setup password error:", err);
          logSecurityEvent('password_setup_failed', { 
            error: err instanceof ApiErrorClass ? err.message : 'Unknown error',
            token: token.substring(0, 10) + '...',
            token_type: isEmailToken ? 'email_verification' : 'invitation'
          });

          if (err instanceof ApiErrorClass) {
            setError(err.message);
          } else {
            setError("Something went wrong. Please try again.");
          }
          toast.error("Failed to set password. Please try again.");
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

  // Show loading while verifying invitation
  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light">
        <Loading
          size="lg"
          message="Verifying token..."
          subMessage="Please wait while we validate your link."
        />
      </div>
    );
  }

  // Show error if verification is invalid
  if (token && (verificationError || (verificationData && verificationData.valid === false))) {
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
              {isEmailToken ? "Invalid Email Verification" : "Invalid Invitation"}
            </h1>
            <p className="text-red-700 mb-4">
              {error || (isEmailToken ? "This email verification link is invalid or has expired." : "This invitation link is invalid or has expired.")}
            </p>
            <p className="text-sm text-red-600 mb-2">
              {isEmailToken ? "Please try signing up again." : "Please contact your administrator for a new invitation."}
            </p>
            <div className="text-xs text-gray-500 mt-4 p-2 bg-gray-100 rounded">
              <p>Debug info:</p>
              <p>Token: {token ? `${token.substring(0, 10)}...` : 'No token'}</p>
              <p>URL: {window.location.href}</p>
              <p>Pathname: {window.location.pathname}</p>
            </div>
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
              {isEmailToken ? "Set Up Your Password" : "Complete Your Account Setup"}
            </h1>
            <p className="text-green-darkest text-base font-regular px-4">
              {isEmailToken 
                ? "Create a secure password to complete your account setup." 
                : `Welcome to ${invitationData?.user_info?.company_name}! Set up your password to get started.`
              }
            </p>
          </div>

          {/* User Info Card - Only show for invitation tokens */}
          {!isEmailToken && invitationData?.user_info && (
            <div className="bg-white rounded-lg border border-border-dark p-4 space-y-2">
              <h2 className="font-medium text-gray-dark">Account Details</h2>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-light">Name:</span>
                  <span className="text-gray-dark">{invitationData.user_info.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-light">Email:</span>
                  <span className="text-gray-dark">{invitationData.user_info.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-light">Job Title:</span>
                  <span className="text-gray-dark">{invitationData.user_info.job_title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-light">Access Level:</span>
                  <span className="text-gray-dark">{invitationData.user_info.access_level}</span>
                </div>
              </div>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            <div>
              <PasswordInput
                id="password"
                label="Password"
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleInputChange("password")}
                disabled={isSettingUp}
                error={fieldErrors.password}
              />
            </div>

            <div>
              <PasswordInput
                id="confirmPassword"
                label="Confirm Password"
                name="confirmPassword"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleInputChange("confirmPassword")}
                disabled={isSettingUp}
                error={fieldErrors.confirm_password}
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center bg-red-50 p-2 rounded-md">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={isSettingUp}
              className="w-full"
            >
              {isSettingUp ? "Setting up account..." : (isEmailToken ? "Set Password" : "Complete Setup")}
            </Button>
          </form>

          <div className="text-center">
            <p className="text-xs text-gray-light">
              By completing this setup, you agree to our terms of service and privacy policy.
            </p>
            {isEmailToken && (
              <p className="text-xs text-gray-light mt-2">
                Already have an account?{" "}
                <button
                  onClick={() => navigate("/login")}
                  className="text-green-default hover:text-green-dark underline"
                >
                  Sign in
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetupPasswordPage; 