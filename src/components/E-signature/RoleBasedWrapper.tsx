"use client";
// import { useAuth } from "@/lib/api/auth"; // Adjust based on your auth context

interface RoleBasedWrapperProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

export function RoleBasedWrapper({
  children,
  allowedRoles,
}: RoleBasedWrapperProps) {
  // const { user } = useAuth(); // Your auth context should provide user with role

  const user = {
    role: "employee",
  };
  // const user2 = {
  //   role: "admin",
  // };
  // const user3 = {
  //   role: "client",
  // };
  if (!user || !allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}

// Convenience components for specific roles
export function AdminOnly({ children }: { children: React.ReactNode }) {
  return (
    <RoleBasedWrapper allowedRoles={["admin"]}>{children}</RoleBasedWrapper>
  );
}

export function EmployeeOnly({ children }: { children: React.ReactNode }) {
  return (
    <RoleBasedWrapper allowedRoles={["employee"]}>{children}</RoleBasedWrapper>
  );
}

export function ClientOnly({ children }: { children: React.ReactNode }) {
  return (
    <RoleBasedWrapper allowedRoles={["client"]}>{children}</RoleBasedWrapper>
  );
}
