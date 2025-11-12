import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useSignup, useResendVerification } from "../../hooks";
import { useAuthStore } from "../../stores";
import { ApiErrorClass } from "../../api";
import { validatePasswordStrength, validateEmailFormat } from "../../utils/invitationSecurity";
import logo from "/logo.svg";
import backgroundImage from "/background-dashboard.jpg";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { PasswordInput } from "../../components/ui/PasswordInput";
import { toast } from "sonner";

const SignUp: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { mutate: signup, isPending: isLoading } = useSignup();
  const { mutate: resendVerification, isPending: isResending } = useResendVerification();
  const { isAuthenticated } = useAuthStore();

  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const from = location.state?.from?.pathname || "/welcome";

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const validateForm = (): boolean => {
    setError("");

    if (!formData.name.trim()) {
      setError("Name is required");
      return false;
    }

    if (!formData.email.trim()) {
      setError("Email is required");
      return false;
    }

    if (!formData.password.trim()) {
      setError("Password is required");
      return false;
    }

    if (!formData.confirmPassword.trim()) {
      setError("Please confirm your password");
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

    // Password confirmation validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const signupPayload = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      password: formData.password,
      confirm_password: formData.confirmPassword,
    };

    signup(signupPayload, {
      onSuccess: () => {
        setSuccess("Account created successfully! Please check your email to verify your account.");
        setShowResendVerification(true);
        setError("");
        toast.success("Account created! Please verify your email.");
      },
      onError: (err) => {
        console.error("Signup error:", err);

        if (err instanceof ApiErrorClass) {
          setError(err.message);
        } else {
          setError("Something went wrong. Please try again.");
        }
        setSuccess("");
        setShowResendVerification(false);
        toast.error("Signup failed. Please try again.");
      },
    });
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
      if (success) {
        setSuccess("");
        setShowResendVerification(false);
      }
    };

  const handleResendVerification = () => {
    if (!formData.email.trim()) {
      return;
    }

    resendVerification(
      { email: formData.email.trim() },
      {
        onSuccess: () => {
          setSuccess("Verification email sent successfully! Please check your inbox.");
          toast.success("Verification email sent successfully!");
        },
        onError: (err) => {
          console.error("Resend verification error:", err);
          if (err instanceof ApiErrorClass) {
            setError(err.message);
          } else {
            setError("Failed to send verification email. Please try again.");
          }
          setSuccess("");
          toast.error("Failed to send verification email. Please try again.");
        },
      }
    );
  };

  return (
    <div className="min-h-screen flex bg-background-light p-3 sm:p-0">
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-md space-6">
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
              Deals close fast. We keep up.
            </h1>
            <p className="text-green-darkest text-base font-regular px-4">
              Use Pactle to manage contracts, invoices and follow-ups right in
              Slack so nothing slips through.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            <div>
              <Input
                id="name"
                name="name"
                label="Name"
                type="text"
                placeholder="Enter Name"
                value={formData.name}
                onChange={handleInputChange("name")}
                disabled={isLoading}
                required
              />
            </div>
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
                required
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
                required
              />
              <p className="text-xs text-gray-light mt-1">
                Must be at least 8 characters
              </p>
            </div>
            <div>
              <PasswordInput
                id="confirmPassword"
                name="confirmPassword"
                label="Confirm Password"
                placeholder="Re-enter password"
                value={formData.confirmPassword}
                onChange={handleInputChange("confirmPassword")}
                disabled={isLoading}
                required
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center bg-red-50 p-1 rounded-md">
                {error}
              </div>
            )}

            {success && (
              <div className="text-green-dark text-xs text-center bg-green-50 p-3 rounded-md">
                <p className="mb-1">{success}</p>
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
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              size="sm"
              disabled={isLoading}
            >
              {isLoading ? "Creating Account..." : "Sign Up"}
            </Button>

            <div className="text-center">
              <p className="text-sm text-gray-light">
                Already have an account?{" "}
                <Link to="/login" className="underline cursor-pointer">
                  Sign in
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

export default SignUp;
