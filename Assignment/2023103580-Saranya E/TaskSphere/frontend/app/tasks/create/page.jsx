
"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { createTask } from "@/services/task.service";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

export default function CreateTaskPage() {
  const { register, handleSubmit, reset } = useForm();
  const router = useRouter();

  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const theme = localStorage.getItem("theme");

    if (!theme) {
      setDarkMode(true);
      localStorage.setItem("theme", "dark");
    } else {
      setDarkMode(theme === "dark");
    }
  }, []);

  const onSubmit = async (data) => {
    try {
      await createTask(data);

      toast.success("Task Created Successfully");

      reset();

      router.push("/dashboard");
    } catch (err) {
      console.log(err);

      toast.error(
        err?.response?.data?.message ||
          "Task Creation Failed"
      );
    }
  };

  return (
    <div
      className={`min-h-screen flex justify-center items-center p-6 transition ${
        darkMode
          ? "bg-gray-900"
          : "bg-gray-100"
      }`}
    >
      <div
        className={`w-full max-w-2xl rounded-2xl shadow-2xl p-8 ${
          darkMode
            ? "bg-gray-800 text-white"
            : "bg-white text-black"
        }`}
      >
        <Link
          href="/dashboard"
          className="text-blue-500 hover:underline"
        >
          ← Back to Dashboard
        </Link>

        <h1 className="text-4xl font-bold mt-4 mb-2">
          📝 Create Task
        </h1>

        <p
          className={`mb-8 ${
            darkMode
              ? "text-gray-300"
              : "text-gray-500"
          }`}
        >
          Create and organize your daily tasks.
        </p>

        <form onSubmit={handleSubmit(onSubmit)}>

          <input
            {...register("title")}
            placeholder="Task Title"
            className={`w-full p-4 rounded-xl border mb-4 ${
              darkMode
                ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                : "bg-white border-gray-300 text-black"
            }`}
          />

          <textarea
            {...register("description")}
            placeholder="Task Description"
            rows={5}
            className={`w-full p-4 rounded-xl border mb-4 ${
              darkMode
                ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                : "bg-white border-gray-300 text-black"
            }`}
          />

          <select
            {...register("status")}
            className={`w-full p-4 rounded-xl border mb-6 ${
              darkMode
                ? "bg-gray-700 border-gray-600 text-white"
                : "bg-white border-gray-300 text-black"
            }`}
          >
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

          <button
            type="submit"
            className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold hover:scale-[1.02] transition"
          >
            ➕ Create Task
          </button>

        </form>
      </div>
    </div>
  );
}
