import React, { useState } from "react";
import { KeyRound, ShieldCheck, Users } from "lucide-react";
import UsersTab from "../../components/Users/UsersTab";
import RolesTab from "../../components/Roles/RolesTab";
import PermissionsTab from "../../components/Permission/PermissionsTab";
import { PageHeader } from "../../components/UI/PageKit";

const TABS = [
  { id: "users", name: "Users", icon: Users, text: "System users, their roles and status" },
  { id: "roles", name: "Roles", icon: ShieldCheck, text: "Groups of permissions given to users" },
  { id: "permissions", name: "Permissions", icon: KeyRound, text: "Every action a user can be allowed" },
];

const Security = () => {
  const [activeTab, setActiveTab] = useState("users");
  const current = TABS.find((t) => t.id === activeTab);

  return (
    <div className="space-y-6">
      <PageHeader title="Security" description="Manage who can sign in and what each person is allowed to do." />

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <nav className="flex gap-1 overflow-x-auto border-b border-slate-100 px-3 sm:px-4" role="tablist" aria-label="Security">
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveTab(tab.id)}
                className={`relative inline-flex shrink-0 items-center gap-2 px-3 py-3.5 text-sm font-medium transition-colors ${
                  active ? "text-[#155dfd]" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.name}
                {active && <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-[#155dfd]" />}
              </button>
            );
          })}
          <span className="ml-auto hidden self-center pr-2 text-xs text-slate-400 md:block">{current?.text}</span>
        </nav>

        <div className="p-4 sm:p-6">
          {activeTab === "users" && <UsersTab />}
          {activeTab === "roles" && <RolesTab />}
          {activeTab === "permissions" && <PermissionsTab />}
        </div>
      </section>
    </div>
  );
};

export default Security;
