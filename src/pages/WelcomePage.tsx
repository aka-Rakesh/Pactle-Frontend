import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores";
import logo from "/logo.svg";
import backgroundImage from "/e2bc0c27026e54ed81dcf03889534ad6f649b271.jpg";
import { Button } from "../components/ui/Button";
import { IconArrowRight } from "@tabler/icons-react";
import { Loading } from "../components/ui/Loading";

const WelcomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Redirect based on user role if they're already authenticated
  useEffect(() => {
    if (isAuthenticated && user && !isLoading) {
      setIsRedirecting(true);
      const timer = setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, user, isLoading, navigate]);

  const getFirstName = (fullName: string): string => {
    return fullName?.split(" ")[0] || "";
  };

  const handleContinue = () => {
    setIsRedirecting(true);
    // Navigate to members page for admin users, dashboard for regular users
    if (user?.is_admin) {
      navigate("/dashboard/members", { replace: true });
    } else {
      navigate("/dashboard", { replace: true });
    }
  };

  if (isLoading) {
    return (
      <Loading
        size="lg"
        fullscreen
        message="Loading your workspace..."
        subMessage="Please wait a moment..."
      />
    );
  }

  // Show redirect message if user is already authenticated
  if (isAuthenticated && user && isRedirecting) {
    return (
      <Loading
        size="lg"
        fullscreen
        message="Welcome back! Redirecting you to your workspace..."
        subMessage={"Taking you to your dashboard..."}
      />
    );
  }

  return (
    <div className="min-h-screen flex relative">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${backgroundImage})`,
        }}
      />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.55)_0%,rgba(0,0,0,0.85)_100%)]" />
      <div className="relative z-10 flex-1 flex items-center justify-center">
        <div className="bg-background-dark rounded-lg shadow-xl p-8 max-w-xl w-full text-center space-y-4">
          <div className="flex justify-center">
            <img
              src={logo}
              alt="Pactle AI Logo"
              width={24}
              height={24}
              loading="lazy"
              className="object-cover"
            />
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl font-medium text-green-dark">
              Welcome to Pactle, {user ? getFirstName(user?.name ?? "") : ""}
            </h1>
            <p className="text-gray-light text-base">
              Your company's workspace has been created.
            </p>
            <p className="text-gray-light text-sm">
              Let's set up your organization so you can start using Pactle
              smoothly.
            </p>
          </div>

          <Button onClick={handleContinue} width={"full"}>
            Continue
            <IconArrowRight size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;
