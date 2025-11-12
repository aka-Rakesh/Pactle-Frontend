import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useVerifyEmail, useResendVerification } from "../../hooks";
import { useAuthStore } from "../../stores";
import { Loading } from "../../components/ui/Loading";
import { ApiErrorClass } from "../../api";
import { validateEmailFormat } from "../../utils/invitationSecurity";
import logo from "/logo.svg";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { toast } from "sonner";

const VerifyEmailPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [error, setError] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [resendMessage, setResendMessage] = useState<string>("");
  const { login } = useAuthStore();
  const { mutate: resendVerification, isPending: isResending } = useResendVerification();

  // Verify email token
  const { 
    data: verificationData, 
    isLoading: isVerifying, 
    error: verificationError 
  } = useVerifyEmail(token || "");

  // Handle verification errors
  useEffect(() => {
    if (verificationError) {
      if (verificationError instanceof ApiErrorClass) {
        setError(verificationError.message);
      } else {
        setError("Invalid or expired verification link. Please try signing up again.");
      }
    }
  }, [verificationError]);

  useEffect(() => {
    if (verificationData?.success && token) {
      const tokens = (verificationData as any)?.tokens;
      const user = (verificationData as any)?.user;
      if (tokens?.access && user) {
        login(user, tokens.access);
        navigate(`/welcome`, { replace: true });
      } else {
        navigate(`/setup-password?token=${token}`, { replace: true });
      }
    }
  }, [verificationData, token, navigate]);

  // Show loading while verifying
  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light">
        <Loading
          size="lg"
          message="Verifying your email..."
          subMessage="Please wait while we validate your email address."
        />
      </div>
    );
  }

  const handleResendVerification = () => {
    if (!email.trim()) {
      setResendMessage("Please enter your email address.");
      return;
    }

    if (!validateEmailFormat(email)) {
      setResendMessage("Please enter a valid email address.");
      return;
    }

    resendVerification(
      { email: email.trim() },
      {
        onSuccess: () => {
          setResendMessage("Verification email sent successfully! Please check your inbox.");
          toast.success("Verification email sent successfully!");
        },
        onError: (err) => {
          console.error("Resend verification error:", err);
          if (err instanceof ApiErrorClass) {
            setResendMessage(err.message);
          } else {
            setResendMessage("Failed to send verification email. Please try again.");
          }
          toast.error("Failed to send verification email. Please try again.");
        },
      }
    );
  };

  // Show error if verification failed
  if (verificationError || !verificationData?.success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light p-3 sm:p-0">
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
              Email Verification Failed
            </h1>
            <p className="text-red-700 mb-4">
              {error || "This verification link is invalid or has expired."}
            </p>
            <p className="text-sm text-red-600 mb-4">
              Please try signing up again or contact support if the problem persists.
            </p>
            <div className="flex flex-col gap-4 p-4 bg-white rounded-md border">
              <p className="text-sm text-gray-dark">
                Need a new verification email? Enter your email address below:
              </p>
              <Input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button
                onClick={handleResendVerification}
                disabled={isResending}
              >
                {isResending ? "Sending..." : "Resend Verification Email"}
              </Button>
              {resendMessage && (
                <p className={`text-sm ${resendMessage.includes('successfully') ? 'text-green-dark' : 'text-pink-dark'}`}>
                  {resendMessage}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default VerifyEmailPage;
