import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useForgotPassword } from "../../hooks";
import { ApiErrorClass } from "../../api";
import { validateEmailFormat } from "../../utils/invitationSecurity";
import logo from "/logo.svg";
import backgroundImage from "/background-dashboard.jpg";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { toast } from "sonner";

const ForgotPasswordPage: React.FC = () => {
  const { mutate: forgotPassword, isPending: isLoading } = useForgotPassword();

  const [error, setError] = useState<string>("");
  const [email, setEmail] = useState("");

  const validateForm = (): boolean => {
    setError("");

    if (!email.trim()) {
      setError("Email is required");
      return false;
    }

    if (!validateEmailFormat(email)) {
      setError("Enter a valid email address.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    forgotPassword(
      { email: email.trim() },
      {
        onSuccess: () => {
          toast.success("Password reset link sent. Please check your email.");
        },
        onError: (err) => {
          console.error("Forgot password error:", err);

          if (err instanceof ApiErrorClass) {
            setError(err.message);
          } else {
            setError("Something went wrong. Please try again.");
          }
        },
      }
    );
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (error) {
      setError("");
    }
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
              Forgot Your Password?
            </h1>
            <p className="text-green-darkest text-base font-regular px-4">
              Enter your email address and we'll send you a link to reset your password.
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
                value={email}
                onChange={handleEmailChange}
                disabled={isLoading}
                required
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center bg-red-50 p-1 rounded-md">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              size="sm"
              disabled={isLoading}
            >
              {isLoading ? "Sending..." : "Send Reset Link"}
            </Button>

            <div className="text-center">
              <p className="text-sm text-gray-light">
                Remember your password?{" "}
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

export default ForgotPasswordPage;
