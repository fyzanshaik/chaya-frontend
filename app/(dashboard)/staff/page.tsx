import { Metadata } from "next";
import { StaffDashboard } from "./components/staff-dashboard";
import { AuthProvider } from "@/app/providers/auth-provider";

export const metadata: Metadata = {
  title: "Staff Management",
  description: "Manage your staff members",
};

export default function StaffManagementPage() {
  return (
    <AuthProvider>
      <div className="container mx-auto py-1">
        <StaffDashboard />
      </div>
    </AuthProvider>
  );
}
