import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  getUsers,
  activateUser,
  deactivateUser,
} from "../../services/userService";
import { getAllDepartments, Department } from "../../services/departmentService";
import { getAllPositions, Position } from "../../services/positionService";
import { User } from "../../types";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Alert from "../../components/ui/Alert";
import { getErrorMessage } from "../../utils/errorUtils";

const UsersPage: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);

  // Fetch departments and positions
  useEffect(() => {
    const fetchDepartmentsAndPositions = async () => {
      try {
        const [departmentsData, positionsData] = await Promise.all([
          getAllDepartments(),
          getAllPositions()
        ]);
        setDepartments(departmentsData);
        setPositions(positionsData);
      } catch (err) {
        setError(getErrorMessage(err));
      }
    };
    
    fetchDepartmentsAndPositions();
  }, []);

  // Fetch users
  const { data, refetch } = useQuery({
    queryKey: ["users", selectedRole, selectedStatus],
    queryFn: () =>
      getUsers({
        role: selectedRole !== "all" ? (selectedRole as any) : undefined,
        isActive:
          selectedStatus !== "all" ? selectedStatus === "active" : undefined,
      }),
    onError: (err: any) => setError(getErrorMessage(err)),
  });

  // Handle activate/deactivate user
  const handleToggleUserStatus = async (id: string, isActive: boolean) => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (isActive) {
        await deactivateUser(id);
        setSuccessMessage("User deactivated successfully");
      } else {
        await activateUser(id);
        setSuccessMessage("User activated successfully");
      }
      refetch();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to get department name from ID
  const getDepartmentName = (departmentId: string | undefined) => {
    if (!departmentId) return "N/A";
    const department = departments.find(dept => dept.id === departmentId);
    return department ? department.name : "N/A";
  };

  // Helper function to get position name from ID
  const getPositionName = (positionId: string | undefined) => {
    if (!positionId) return "N/A";
    const position = positions.find(pos => pos.id === positionId);
    return position ? position.name : "N/A";
  };

  // Helper function to render role badge
  const renderRoleBadge = (role: string) => {
    switch (role) {
      case "super_admin":
        return <Badge variant="primary">Super Admin</Badge>;
      case "admin":
        return <Badge variant="primary">Admin</Badge>;
      case "manager":
        return <Badge variant="info">Manager</Badge>;
      case "team_lead":
        return <Badge variant="success">Team Lead</Badge>;
      case "employee":
        return <Badge variant="default">Employee</Badge>;
      case "hr":
        return <Badge variant="warning">HR</Badge>;
      default:
        return <Badge>{role}</Badge>;
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Users</h1>
        <Link to="/users/create">
          <Button>Create User</Button>
        </Link>
      </div>

      {error && (
        <Alert
          variant="error"
          message={error}
          onClose={() => setError(null)}
          className="mb-6"
        />
      )}

      {successMessage && (
        <Alert
          variant="success"
          message={successMessage}
          onClose={() => setSuccessMessage(null)}
          className="mb-6"
        />
      )}

      <Card className="mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="w-full sm:w-auto">
            <label
              htmlFor="role"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Role
            </label>
            <select
              id="role"
              className="form-input"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
            >
              <option value="all">All Roles</option>
              <option value="super_admin">Super Admin</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="team_lead">Team Lead</option>
              <option value="employee">Employee</option>
              <option value="hr">HR</option>
            </select>
          </div>
          <div className="w-full sm:w-auto">
            <label
              htmlFor="status"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Status
            </label>
            <select
              id="status"
              className="form-input"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </Card>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {data?.users && data.users.length > 0 ? (
            data.users.map((user: User) => (
              <li key={user.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-500 font-medium">
                          {user.firstName.charAt(0)}
                          {user.lastName.charAt(0)}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.email}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {renderRoleBadge(user.role)}
                      <Badge variant={user.isActive ? "success" : "danger"}>
                        {user.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex space-x-4">
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <span className="mr-1 font-medium">Phone:</span>
                        {user.phoneNumber || "N/A"}
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <span className="mr-1 font-medium">Department:</span>
                        {getDepartmentName(user.department)}
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <span className="mr-1 font-medium">Position:</span>
                        {getPositionName(user.position)}
                      </div>
                    </div>
                    <div className="mt-2 flex items-center text-sm sm:mt-0 space-x-2">
                      <Link to={`/users/edit/${user.id}`}>
                        <Button variant="secondary" size="sm">
                          Edit
                        </Button>
                      </Link>
                      <Button
                        variant={user.isActive ? "danger" : "success"}
                        size="sm"
                        onClick={() =>
                          handleToggleUserStatus(user.id, user.isActive)
                        }
                        disabled={isLoading}
                      >
                        {user.isActive ? "Deactivate" : "Activate"}
                      </Button>
                    </div>
                  </div>
                </div>
              </li>
            ))
          ) : (
            <li className="px-4 py-8 text-center text-gray-500">
              No users found matching the selected filters.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default UsersPage;
