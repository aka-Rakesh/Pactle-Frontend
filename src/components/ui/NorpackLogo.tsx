import React from "react";

interface NorpackLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "default" | "white" | "dark";
  className?: string;
}

const NorpackLogo: React.FC<NorpackLogoProps> = ({
  size = "md",
  className = "",
}) => {
  const sizeClasses = {
    sm: "h-8",
    md: "h-12",
    lg: "h-16",
    xl: "h-20",
  };

  return (
    <div className={`flex flex-col ${className}`}>
      <div className="flex items-center">
        <img
          src="/norpack-logo.png"
          alt="NORPACK Logo"
          className={`${sizeClasses[size]} object-contain`}
        />
      </div>
    </div>
  );
};

export default NorpackLogo;
