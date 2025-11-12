import React from "react";
import { Link } from "react-router-dom";
import { IconClock, IconHome } from "@tabler/icons-react";

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light">
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="text-center">
          <IconClock className="w-12 h-12 text-gray-light mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-dark mb-2">
            Coming Soon
          </h3>
          <p className="text-gray-light">This section is under development.</p>
        </div>
          <Link
            to="/dashboard"
            className="inline-flex items-center space-x-2 bg-green-dark text-white px-4 py-2 rounded-md hover:bg-green-icon transition-colors"
          >
            <IconHome className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
