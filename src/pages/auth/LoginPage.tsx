import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useLogin, useResendVerification } from "../../hooks";
import { useAuthStore } from "../../stores";
import { ApiErrorClass } from "../../api";
import { validatePasswordStrength, validateEmailFormat } from "../../utils/invitationSecurity";
import logo from "/logo.svg";
import backgroundImage from "/background-dashboard.jpg";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { PasswordInput } from "../../components/ui/PasswordInput";
import { toast } from "sonner";

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { mutate: login, isPending: isLoading } = useLogin();
  const { mutate: resendVerification, isPending: isResending } = useResendVerification();
  const { isAuthenticated } = useAuthStore();

  const [error, setError] = useState<string>("");
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [resendMessage, setResendMessage] = useState<string>("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const from = location.state?.from?.pathname || "/dashboard";
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const validateForm = (): boolean => {
    setError("");

    if (!formData.email.trim()) {
      setError("Email is required");
      return false;
    }

    if (!formData.password.trim()) {
      setError("Password is required");
      return false;
    }

    if (!validateEmailFormat(formData.email)) {
      setError("Enter a valid email address.");
      return false;
    }

    const passwordValidation = validatePasswordStrength(formData.password);
    if (!passwordValidation.isValid) {
      setError(passwordValidation.errors[0]);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    login(
      { email: formData.email.trim(), password: formData.password },
      {
        onError: (err) => {
          console.error("Login error:", err);

          if (err instanceof ApiErrorClass) {
            if (err.errors?.non_field_errors?.some((msg: string) => 
              msg.toLowerCase().includes('verify your email') || 
              msg.toLowerCase().includes('verification')
            )) {
              setError(err.message);
              setShowResendVerification(true);
            } else {
              setError(err.message);
              setShowResendVerification(false);
            }
          } else {
            setError("Something went wrong. Please try again.");
            setShowResendVerification(false);
          }
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
        setShowResendVerification(false);
        setResendMessage("");
      }
    };

  const handleResendVerification = () => {
    if (!formData.email.trim()) {
      setResendMessage("Please enter your email address first.");
      return;
    }

    resendVerification(
      { email: formData.email.trim() },
      {
        onSuccess: () => {
          setResendMessage("Verification email sent successfully! Please check your inbox.");
          setShowResendVerification(false);
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

  return (
    <div className="min-h-screen flex bg-background-light p-3 sm:p-0">
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-md space-6 lg:space-y-12">
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
            <h1 className="text-5xl font-medium text-green-darkest leading-tight">
              Orders move fast. You stay in control.
            </h1>
            <p className="text-green-darkest text-base font-regular px-12">
              Use Pactle to manage quotes, POs, and invoices in one place so
              nothing slips through.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            <div>
              <Input
                id="email"
                name="email"
                label="Email"
                type="email"
                autoComplete="email"
                placeholder="you@yourcompany.com"
                value={formData.email}
                onChange={handleInputChange("email")}
                disabled={isLoading}
              />
            </div>
            <div>
              <PasswordInput
                id="password"
                name="password"
                label="Password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleInputChange("password")}
                disabled={isLoading}
              />
            </div>

            <div className="text-right">
              <Link
                to="/forgot-password"
                className="text-sm text-green-default hover:text-green-dark underline"
              >
                Forgot your password?
              </Link>
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center bg-red-50 p-1 rounded-md">
                <p className="">{error}</p>
                {showResendVerification && (
                  <div className="">
                    <Button
                      type="button"
                      onClick={handleResendVerification}
                      disabled={isResending}
                      size="sm"
                    >
                      {isResending ? "Sending..." : "Resend verification email"}
                    </Button>
                  </div>
                )}
                {resendMessage && (
                  <p className={`text-sm ${resendMessage.includes('successfully') ? 'text-green-dark' : 'text-pink-dark'}`}>
                    {resendMessage}
                  </p>
                )}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              size="sm"
              disabled={isLoading}
            >
              {isLoading ? "Verifying..." : "Sign In"}
            </Button>

            <div className="text-center">
              <p className="text-sm text-gray-light">
                Don't have an account?{" "}
                <Link
                  to="/signup"
                  className="underline"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>

      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden h-screen">
        <img
          src={backgroundImage}
          alt="Dashboard Background"
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
    </div>
  );
};

export default LoginPage;
