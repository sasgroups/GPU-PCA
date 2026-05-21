import { useState, useEffect, useCallback } from "react";
import toast, { Toaster } from "react-hot-toast";
import {
  fetchOperatorsAPI,
  addOperatorAPI,
  deleteOperatorAPI,
  resetPasswordAPI,
} from "../services/userService";

export default function OperatorManagement() {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [operators, setOperators] = useState([]);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // modal states
  const [resetId, setResetId] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [deleteId, setDeleteId] = useState(null);

  const handleApiError = (error, fallback = "Request failed") => {
    const msg = error?.response?.data?.message || fallback;
    toast.error(`❌ ${msg}`);
    // Keep console for dev visibility; ensure no sensitive data logged.
    console.error(msg, error);
  };

  const fetchOperators = useCallback(async () => {
    setListLoading(true);
    try {
      const res = await fetchOperatorsAPI();
      if (Array.isArray(res.data)) {
        setOperators(res.data);
      } else {
        setOperators([]);
        console.warn("Unexpected response format:", res.data);
      }
    } catch (error) {
      handleApiError(error, "Failed to fetch operators");
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    const role = localStorage.getItem("role");
    setIsAdmin(role === "admin");
    fetchOperators();
  }, [fetchOperators]);

  // Add operator
  const handleAddOperator = async (e) => {
    e?.preventDefault?.();
    if (!formData.username.trim() || !formData.password.trim()) {
      toast.error("⚠️ Please fill in both fields.");
      return;
    }
    try {
      setLoading(true);
      await addOperatorAPI(formData);
      toast.success("✅ Operator added successfully!");
      setFormData({ username: "", password: "" });
      fetchOperators();
    } catch (error) {
      handleApiError(error, "Failed to add operator");
    } finally {
      setLoading(false);
    }
  };

  // Delete operator
  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteOperatorAPI(deleteId);
      toast.success("🗑️ Operator deleted successfully");
      setDeleteId(null);
      fetchOperators();
    } catch (error) {
      handleApiError(error, "Failed to delete operator");
    }
  };

  // Reset password
  const handleResetPassword = async () => {
    if (!resetId) return;
    if (!newPassword.trim()) {
      toast.error("⚠️ Please enter a new password.");
      return;
    }
    try {
      await resetPasswordAPI(resetId, newPassword);
      toast.success("🔑 Password reset successfully!");
      setResetId(null);
      setNewPassword("");
    } catch (error) {
      handleApiError(error, "Failed to reset password");
    }
  };

  if (!isAdmin) {
    return (
      <div className="text-center text-red-600 mt-10 text-lg font-semibold">
        ❌ Access denied. Admins only.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-8 px-4">
      <Toaster position="top-right" reverseOrder={false} />

      {/* Add Operator Form */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Add Operator</h2>
        <form className="grid grid-cols-1 sm:grid-cols-3 gap-4" onSubmit={handleAddOperator}>
          <input
            type="text"
            placeholder="Username"
            value={formData.username}
            onChange={(e) => setFormData((p) => ({ ...p, username: e.target.value }))}
            className="border rounded-lg p-2 w-full focus:outline-none focus:ring focus:ring-blue-200"
            autoComplete="username"
          />
          <input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))}
            className="border rounded-lg p-2 w-full focus:outline-none focus:ring focus:ring-blue-200"
            autoComplete="new-password"
          />
          <button
            type="submit"
            disabled={loading}
            className={`rounded-lg px-4 py-2 text-white ${
              loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? "Adding..." : "Add Operator"}
          </button>
        </form>
      </div>

      {/* Operator List */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">Operator List</h2>
          {!listLoading && (
            <span className="text-sm text-gray-500">
              Total: {operators?.length ?? 0}
            </span>
          )}
        </div>

        {listLoading ? (
          <p className="text-gray-500 text-center py-6">Loading operators...</p>
        ) : operators.length === 0 ? (
          <p className="text-gray-500 text-center py-6">No operators found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-700">
                  <th className="text-left p-3 border-b">Username</th>
                  <th className="text-left p-3 border-b">Role</th>
                  <th className="text-left p-3 border-b">Created</th>
                  <th className="text-right p-3 border-b">Actions</th>
                </tr>
              </thead>
              <tbody>
                {operators.map((op) => (
                  <tr key={op.id || op._id} className="hover:bg-gray-50">
                    <td className="p-3 border-b">{op.username}</td>
                    <td className="p-3 border-b capitalize">{op.role || "operator"}</td>
                    <td className="p-3 border-b">
                      {op.createdAt
                        ? new Date(op.createdAt).toLocaleString()
                        : "-"}
                    </td>
                    <td className="p-3 border-b">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => setResetId(op.id || op._id)}
                          className="px-3 py-1 rounded-lg border hover:bg-gray-100"
                          title="Reset Password"
                        >
                          Reset Password
                        </button>
                        <button
                          onClick={() => setDeleteId(op.id || op._id)}
                          className="px-3 py-1 rounded-lg bg-red-600 text-white hover:bg-red-700"
                          title="Delete Operator"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reset Password Modal */}
      {resetId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">Reset Password</h3>
            <input
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="border rounded-lg p-2 w-full focus:outline-none focus:ring focus:ring-blue-200 mb-4"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setResetId(null);
                  setNewPassword("");
                }}
                className="px-4 py-2 rounded-lg border hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleResetPassword}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-2">Delete Operator</h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to delete this operator? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 rounded-lg border hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
