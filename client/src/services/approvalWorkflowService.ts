import api from "./api";

export interface ApprovalWorkflow {
  id: string;
  name: string;
  minDays: number;
  maxDays: number;
  approvalLevels: {
    level: number;
    roles: string[];
  }[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const createApprovalWorkflow = async (
  workflowData: Omit<ApprovalWorkflow, "id" | "createdAt" | "updatedAt">
) => {
  const response = await api.post("/approval-workflows", workflowData);
  return response.data;
};

export const getAllApprovalWorkflows = async () => {
  const response = await api.get("/approval-workflows");
  return response.data.approvalWorkflows || [];
};

export const getApprovalWorkflowById = async (id: string) => {
  const response = await api.get(`/approval-workflows/${id}`);
  return response.data.approvalWorkflow;
};

export const updateApprovalWorkflow = async (
  id: string,
  workflowData: Partial<
    Omit<ApprovalWorkflow, "id" | "createdAt" | "updatedAt">
  >
) => {
  const response = await api.put(`/approval-workflows/${id}`, workflowData);
  return response.data;
};

export const deleteApprovalWorkflow = async (id: string) => {
  const response = await api.delete(`/approval-workflows/${id}`);
  return response.data;
};

export const initializeDefaultWorkflows = async () => {
  const response = await api.post('/approval-workflows/initialize-defaults');
  return response.data;
};
