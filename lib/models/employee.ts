import type { ContactInfo, EntityId, OwnedEntity, Timestamped, WorkloadStatus } from "./common";

export type EmployeeStatus = "Active" | "Away" | "Pending" | "Inactive" | "Archived";
export type EmployeeAvailability = "Available" | "Limited" | "Busy" | "Unavailable";
export type EmployeeRole =
  | "CEO"
  | "Operations Director"
  | "Project Manager"
  | "Site Engineer"
  | "Architect"
  | "Procurement Manager"
  | "Logistics Coordinator"
  | "Finance Manager"
  | "HR Manager"
  | "BIM Engineer"
  | "Quantity Surveyor"
  | "Consultant";

export interface Employee extends Timestamped, OwnedEntity {
  id: EntityId;
  organizationId?: EntityId;
  departmentId?: EntityId;
  profileId?: EntityId;
  employeeNumber?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  name: string;
  role: EmployeeRole | string;
  jobTitle?: string;
  department: string;
  departmentName?: string;
  managerName?: string;
  email?: string;
  avatar?: string;
  avatarUrl?: string;
  phone?: string;
  employmentType?: string;
  status: EmployeeStatus | string;
  tasks?: number;
  workload?: number;
  activeProjects?: number;
  hireDate?: string;
  workloadStatus?: WorkloadStatus;
  contact?: ContactInfo;
  assignedProjects?: string[];
  skills?: string[];
  certifications?: string[];
  availability?: EmployeeAvailability;
  managerId?: EntityId;
  metadata?: Record<string, unknown>;
}

export type EmployeeInput = {
  organizationId: EntityId;
  departmentId?: EntityId;
  profileId?: EntityId;
  managerId?: EntityId;
  employeeNumber?: string;
  firstName: string;
  lastName: string;
  jobTitle?: string;
  phone?: string;
  email?: string;
  employmentType?: string;
  status?: EmployeeStatus;
  hireDate?: string;
  avatarUrl?: string;
  metadata?: Record<string, unknown>;
};
