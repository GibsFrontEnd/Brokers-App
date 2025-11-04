import React, { useState } from "react";
import UsersTab from "../../components/Users/UsersTab";
import RolesTab from "../../components/Roles/RolesTab";
import PermissionsTab from "../../components/Permission/PermissionsTab";

const Security = () => {
  const [activeTab, setActiveTab] = useState("users");

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Security</h1>
          <p className="text-gray-600">Manage users, roles, and permissions</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex border-b border-gray-200">
            <button
              className={`py-3 px-6 font-medium text-sm ${
                activeTab === "users"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("users")}
            >
              Users
            </button>
            <button
              className={`py-3 px-6 font-medium text-sm ${
                activeTab === "roles"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("roles")}
            >
              Roles
            </button>
            <button
              className={`py-3 px-6 font-medium text-sm ${
                activeTab === "permissions"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("permissions")}
            >
              Permissions
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === "users" && <UsersTab />}
            {activeTab === "roles" && <RolesTab />}
            {activeTab === "permissions" && <PermissionsTab />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Security;
