
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { getTasks, deleteTask } from "@/services/task.service";
import ProtectedRoute from "@/components/ProtectedRoute";
import Loader from "@/components/Loader";
import { getCurrentUser } from "@/services/auth.service";

export default function DashboardPage() {
  const router = useRouter();

  const [tasks, setTasks] = useState([]);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [darkMode, setDarkMode] = useState(false);

  const [page, setPage] = useState(1);
  const limit = 10;
  useEffect(() => {
    const theme = localStorage.getItem("theme");

    if (!theme) {
      setDarkMode(true);
      localStorage.setItem("theme", "dark");
    } else {
      setDarkMode(theme === "dark");
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = !darkMode;

    setDarkMode(nextTheme);
    localStorage.setItem(
      "theme",
      nextTheme ? "dark" : "light"
    );
  };

  const loadUser = async () => {
    try {
      const res = await getCurrentUser();

      console.log(res);

      setUser(
        res.user ||
        res.data ||
        res
      );
    } catch (err) {
      console.log(err);
    }
  };

  const loadTasks = async () => {
    setLoading(true);

    try {
      const res = await getTasks(page, limit, status);

      const taskData =
        res.tasks ||
        res.data?.tasks ||
        res.data ||
        [];

      setTasks(taskData);
    } catch (err) {
      console.log(err);
      toast.error("Failed to fetch tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [page, status]);

  useEffect(() => {
    loadUser();
  }, []);

  const filteredTasks = tasks.filter((task) =>
    task.title.toLowerCase().includes(search.toLowerCase())
  );

  const pending = tasks.filter(
    (task) => task.status === "PENDING"
  ).length;

  const inProgress = tasks.filter(
    (task) => task.status === "IN_PROGRESS"
  ).length;

  const completed = tasks.filter(
    (task) => task.status === "COMPLETED"
  ).length;

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Delete this task?"
    );

    if (!confirmDelete) return;

    try {
      await deleteTask(id);
      toast.success("Task Deleted");
      loadTasks();
    } catch (err) {
      console.log(err);
      toast.error("Delete Failed");
    }
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <ProtectedRoute>
      <div
        className={`min-h-screen transition-all duration-300 ${darkMode
          ? "bg-gray-900 text-white"
          : "bg-gray-100 text-black"
          }`}
      >

        <nav
          className={`shadow px-8 py-4 flex justify-between items-center ${darkMode
            ? "bg-gray-800"
            : "bg-white"
            }`}
        >
          <div>
            <h1 className="text-3xl font-bold text-blue-600">
              TaskFlow RBAC
            </h1>

            <p
              className={`text-sm ${darkMode
                ? "text-gray-300"
                : "text-gray-500"
                }`}
            >
              Manage your daily tasks efficiently
            </p>
          </div>

          <div className="flex items-center gap-4">

            <div className="text-right">

              <h3
                className={`font-semibold ${darkMode
                  ? "text-white"
                  : "text-black"
                  }`}
              >
                {user?.name}
              </h3>

              <p
                className={`text-sm ${darkMode
                  ? "text-gray-300"
                  : "text-gray-500"
                  }`}
              >
                {user?.email}
              </p>

              <span
                className={`text-xs px-2 py-1 rounded ${darkMode
                  ? "bg-green-800 text-green-200"
                  : "bg-green-100 text-green-700"
                  }`}
              >
                {user?.role}
              </span>

            </div>

            <button
              onClick={toggleTheme}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg"
            >
              {darkMode ? "☀️ Light" : "🌙 Dark"}
            </button>

            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-lg"
            >
              Logout
            </button>

          </div>

        </nav>

        <div className="p-8">

          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
            <h2
              className={`text-4xl font-bold ${darkMode
                ? "text-white"
                : "text-black"
                }`}
            >
              Dashboard
            </h2>

            <div className="flex flex-wrap gap-3">

              <input
                type="text"
                placeholder="Search task..."
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                className={`border rounded-lg px-3 py-2 transition ${darkMode
                  ? "bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                  : "bg-white border-gray-300 text-black"
                  }`}
              />

              <select
                value={status}
                onChange={(e) => {
                  setPage(1);
                  setStatus(e.target.value);
                }}
                className={`border rounded-lg px-3 py-2 transition ${darkMode
                  ? "bg-gray-800 border-gray-700 text-white"
                  : "bg-white border-gray-300 text-black"
                  }`}
              >
                <option value="">All</option>

                <option value="PENDING">
                  Pending
                </option>

                <option value="IN_PROGRESS">
                  In Progress
                </option>

                <option value="COMPLETED">
                  Completed
                </option>
              </select>
              <Link
                href="/tasks/create"
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg"
              >
                + New Task
              </Link>

            </div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

            <div className={`rounded-2xl p-6 shadow-lg transition ${darkMode
                ? "bg-gradient-to-r from-blue-900 to-blue-700"
                : "bg-gradient-to-r from-blue-500 to-blue-600"
              } text-white`}>

              <p className="text-lg">📋 Total Tasks</p>

              <h2 className="text-5xl font-bold mt-3">
                {tasks.length}
              </h2>

            </div>

            <div className={`rounded-2xl p-6 shadow-lg transition ${darkMode
                ? "bg-gradient-to-r from-yellow-900 to-yellow-700"
                : "bg-gradient-to-r from-yellow-400 to-yellow-500"
              } text-white`}>

              <p className="text-lg">⏳ Pending</p>

              <h2 className="text-5xl font-bold mt-3">
                {pending}
              </h2>

            </div>

            <div className={`rounded-2xl p-6 shadow-lg transition ${darkMode
                ? "bg-gradient-to-r from-indigo-900 to-indigo-700"
                : "bg-gradient-to-r from-indigo-500 to-indigo-600"
              } text-white`}>

              <p className="text-lg">🚀 In Progress</p>

              <h2 className="text-5xl font-bold mt-3">
                {inProgress}
              </h2>

            </div>

            <div className={`rounded-2xl p-6 shadow-lg transition ${darkMode
                ? "bg-gradient-to-r from-green-900 to-green-700"
                : "bg-gradient-to-r from-green-500 to-green-600"
              } text-white`}>

              <p className="text-lg">✅ Completed</p>

              <h2 className="text-5xl font-bold mt-3">
                {completed}
              </h2>

            </div>

          </div>

          <div
            className={`rounded-lg shadow overflow-x-auto ${darkMode
              ? "bg-gray-800 text-white"
              : "bg-white text-black"
              }`}
          >

            <table className="w-full min-w-[900px]">

              <thead>

                <tr
                  className={`border-b ${darkMode
                    ? "bg-gray-700 text-white"
                    : "bg-gray-50 text-black"
                    }`}
                >

                  <th className="p-4 text-left">
                    Title
                  </th>

                  <th className="p-4 text-left">
                    Description
                  </th>

                  <th className="p-4 text-left">
                    Status
                  </th>

                  <th className="p-4 text-left">
                    Created
                  </th>

                  <th className="p-4 text-center">
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody>

                {filteredTasks.length === 0 ? (

                  <tr>

                    <td
                      colSpan={5}
                      className={`text-center p-10 ${darkMode
                        ? "bg-gray-800 text-white"
                        : "bg-white text-black"
                        }`}
                    >

                      <div>

                        <p className="text-5xl">
                          📭
                        </p>

                        <p className="text-xl font-semibold mt-3">
                          No Tasks Found
                        </p>
                        <p
                          className={`mt-2 ${darkMode
                            ? "text-gray-300"
                            : "text-gray-500"
                            }`}
                        >
                          Create your first task to get started.
                        </p>

                      </div>

                    </td>

                  </tr>

                ) : (

                  filteredTasks.map((task) => (

                    <tr
                      key={task.id}
                      className={`border-b transition ${darkMode
                        ? "hover:bg-gray-700"
                        : "hover:bg-blue-50"
                        }`}
                    >

                      <td className="p-4 font-semibold">
                        {task.title}
                      </td>

                      <td className="p-4">
                        {task.description}
                      </td>

                      <td className="p-4">

                        <span
                          className={`px-3 py-1 rounded-full text-white text-sm ${task.status === "PENDING"
                            ? "bg-yellow-500"
                            : task.status === "IN_PROGRESS"
                              ? "bg-blue-500"
                              : "bg-green-500"
                            }`}
                        >
                          {task.status}
                        </span>

                      </td>

                      <td className="p-4">
                        {new Date(
                          task.createdAt
                        ).toLocaleDateString()}
                      </td>

                      <td className="p-4 flex justify-center gap-3">

                        <Link
                          href={`/tasks/edit/${task.id}`}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded"
                        >
                          Edit
                        </Link>

                        <button
                          onClick={() =>
                            handleDelete(task.id)
                          }
                          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
                        >
                          Delete
                        </button>

                      </td>

                    </tr>

                  ))

                )}

              </tbody>

            </table>

          </div>

          <div className="flex justify-center items-center gap-4 mt-6">

            <button
              onClick={() =>
                setPage((prev) =>
                  Math.max(prev - 1, 1)
                )
              }
              disabled={page === 1}
              className={`px-4 py-2 rounded disabled:opacity-50 ${darkMode
                ? "bg-gray-700 text-white"
                : "bg-gray-300 text-black"
                }`}
            >
              Previous
            </button>

            <span
              className={`font-semibold ${darkMode
                ? "text-white"
                : "text-black"
                }`}
            >
              Page {page}
            </span>

            <button
              onClick={() => {
                if (tasks.length === limit) {
                  setPage((prev) => prev + 1);
                }
              }}
              disabled={tasks.length < limit}
              className={`text-white px-4 py-2 rounded disabled:opacity-50 ${darkMode
                ? "bg-indigo-600"
                : "bg-blue-600"
                }`}
            >
              Next
            </button>

          </div>

        </div>

      </div>
    </ProtectedRoute>
  );
}
