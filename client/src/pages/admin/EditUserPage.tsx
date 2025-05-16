import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  getUser,
  updateUser,
  resetUserPassword,
} from "../../services/userService";
import { getAllDepartments } from "../../services/departmentService";
import { getAllPositions } from "../../services/positionService";
import { useUsers } from "../../hooks";
import ResetPasswordModal from "../../components/users/ResetPasswordModal";

type FormValues = {
  firstName: string;
  lastName: string;
  email: string;
  role: "employee" | "team_lead" | "manager" | "hr" | "admin" | "super_admin";
  department: string;
  position: string;
  managerId?: string;
  hrId?: string;
  teamLeadId?: string;
  isActive: boolean;
};

export default function EditUserPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] =
    useState(false);

  const {
    data: userResponse,
    isLoading: isLoadingUser,
    error: userError,
  } = useQuery({
    queryKey: ["user", id],
    queryFn: () => getUser(id as string),
    enabled: !!id,
    retry: 1,
  });

  // Extract the user data from the response
  const user = userResponse?.user;

  const { data } = useUsers();
  const users = data?.users || [];

  // Fetch departments
  const { data: departmentsData } = useQuery({
    queryKey: ["departments"],
    queryFn: () => getAllDepartments({}),
  });

  // Fetch positions
  const { data: positionsData } = useQuery({
    queryKey: ["positions"],
    queryFn: () => getAllPositions({}),
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      role: "employee",
      department: "",
      position: "",
      managerId: "",
      hrId: "",
      teamLeadId: "",
      isActive: true,
    },
  });

  useEffect(() => {
    if (user) {
      reset({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        department: user.department || "",
        position: user.position || "",
        managerId: user.managerId || "",
        hrId: user.hrId || "",
        teamLeadId: user.teamLeadId || "",
        isActive: user.isActive,
      });
    }
  }, [user, reset]);

  const watchRole = watch("role");
  const watchDepartment = watch("department");

  const updateMutation = useMutation({
    mutationFn: (data: Partial<FormValues>) => updateUser(id as string, data),
    onSuccess: () => {
      navigate("/users");
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || "Failed to update user");
    },
  });

  const onSubmit = (data: FormValues) => {
    // Only include managerId if role is employee or team_lead
    const userData = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      role: data.role,
      department: data.department || null,
      position: data.position || null,
      isActive: data.isActive,
      managerId:
        (data.role === "employee" || data.role === "team_lead") && data.managerId
          ? data.managerId
          : null,
      hrId: data.hrId || null,
      teamLeadId: data.teamLeadId || null,
    };

    // Remove any empty string values that should be null for UUID fields
    Object.keys(userData).forEach(key => {
      // @ts-ignore
      if (userData[key] === "") {
        // @ts-ignore
        userData[key] = null;
      }
    });

    updateMutation.mutate(userData);
  };

  // Handle reset password
  const handleResetPassword = () => {
    setIsResetPasswordModalOpen(true);
  };

  // Submit reset password
  const handleResetPasswordSubmit = async (newPassword: string) => {
    if (!id) return;

    try {
      await resetUserPassword(id, { newPassword });
      setSuccessMessage(`Password has been reset successfully`);
      setIsResetPasswordModalOpen(false);
    } catch (err: any) {
      throw new Error(
        err.response?.data?.message || "Failed to reset password"
      );
    }
  };

  if (isLoadingUser) {
    return (
      <div className="flex justify-center items-center h-64">
        Loading user data...
      </div>
    );
  }

  if ((!user && !isLoadingUser) || userError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          User not found or you don't have permission to view it.
        </div>
        <button
          onClick={() => navigate("/users")}
          className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          Back to Users
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Edit User</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {successMessage}
          <button
            className="float-right text-green-700 hover:text-green-900"
            onClick={() => setSuccessMessage(null)}
          >
            &times;
          </button>
        </div>
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white shadow-md rounded-lg p-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              First Name *
            </label>
            <input
              {...register("firstName", { required: "First name is required" })}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              type="text"
            />
            {errors.firstName && (
              <p className="text-red-500 text-xs italic">
                {errors.firstName.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Last Name *
            </label>
            <input
              {...register("lastName", { required: "Last name is required" })}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              type="text"
            />
            {errors.lastName && (
              <p className="text-red-500 text-xs italic">
                {errors.lastName.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Email *
            </label>
            <input
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                  message: "Invalid email address",
                },
              })}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              type="email"
            />
            {errors.email && (
              <p className="text-red-500 text-xs italic">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Role *
            </label>
            <select
              {...register("role", { required: "Role is required" })}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            >
              <option value="employee">Employee</option>
              <option value="team_lead">Team Lead</option>
              <option value="manager">Manager</option>
              <option value="hr">HR</option>
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
            {errors.role && (
              <p className="text-red-500 text-xs italic">
                {errors.role.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Department
            </label>
            <select
              {...register("department")}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            >
              <option value="">No Department</option>
              {departmentsData?.map((dept: any) => (
                <option
                  key={dept.id}
                  value={dept.id}
                  selected={user?.department === dept.id}
                >
                  {dept.name}
                </option>
              ))}
            </select>
            {errors.department && (
              <p className="text-red-500 text-xs italic">
                {errors.department.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Position
            </label>
            <select
              {...register("position")}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            >
              <option value="">No Position</option>
              {positionsData?.map((pos: any) => (
                <option
                  key={pos.id}
                  value={pos.id}
                  selected={user?.position === pos.id}
                >
                  {pos.name}
                </option>
              ))}
            </select>
            {errors.position && (
              <p className="text-red-500 text-xs italic">
                {errors.position.message}
              </p>
            )}
          </div>

          {(watchRole === "employee" || watchRole === "team_lead") && (
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Manager
              </label>
              <select
                {...register("managerId")}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              >
                <option value="">No Manager</option>
                {users
                  .filter((u: any) => 
                    u.role === "manager" && 
                    u.id !== id && 
                    (watchDepartment ? u.department === watchDepartment : true)
                  )
                  .map((manager: any) => (
                    <option key={manager.id} value={manager.id}>
                      {manager.firstName} {manager.lastName}
                    </option>
                  ))}
              </select>
            </div>
          )}
          
          {watchRole === "employee" && (
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                HR Representative
              </label>
              <select
                {...register("hrId")}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              >
                <option value="">No HR Representative</option>
                {users
                  .filter((u: any) => 
                    u.role === "hr" && 
                    u.id !== id && 
                    (watchDepartment ? u.department === watchDepartment : true)
                  )
                  .map((hr: any) => (
                    <option key={hr.id} value={hr.id}>
                      {hr.firstName} {hr.lastName}
                    </option>
                  ))}
              </select>
            </div>
          )}
          
          {watchRole === "employee" && (
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Team Lead
              </label>
              <select
                {...register("teamLeadId")}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              >
                <option value="">No Team Lead</option>
                {users
                  .filter((u: any) => 
                    u.role === "team_lead" && 
                    u.id !== id && 
                    (watchDepartment ? u.department === watchDepartment : true)
                  )
                  .map((teamLead: any) => (
                    <option key={teamLead.id} value={teamLead.id}>
                      {teamLead.firstName} {teamLead.lastName}
                    </option>
                  ))}
              </select>
            </div>
          )}

          <div className="md:col-span-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                {...register("isActive")}
                className="mr-2"
              />
              <span className="text-gray-700 text-sm">Active User</span>
            </label>
          </div>
        </div>

        <div className="flex justify-between">
          <button
            type="button"
            onClick={handleResetPassword}
            className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded"
          >
            Reset Password
          </button>

          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => navigate("/users")}
              className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </form>

      {/* Reset Password Modal */}
      {user && (
        <ResetPasswordModal
          isOpen={isResetPasswordModalOpen}
          onClose={() => setIsResetPasswordModalOpen(false)}
          onSubmit={handleResetPasswordSubmit}
          userName={`${user.firstName} ${user.lastName}`}
        />
      )}
    </div>
  );
}
