
"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { registerUser } from "@/services/auth.service";

export default function RegisterPage() {
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
      await registerUser(data);

      toast.success("Registration Successful");

      reset();

      router.push("/login");
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
          "Registration Failed"
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
        className={`w-full max-w-md rounded-2xl shadow-2xl p-8 ${
          darkMode
            ? "bg-gray-800 text-white"
            : "bg-white text-black"
        }`}
      >
        <Link
          href="/login"
          className="text-blue-500 hover:underline"
        >
          ← Back to Login
        </Link>

        <h1 className="text-4xl font-bold mt-4 mb-2">
          🚀 Register
        </h1>

        <p
          className={`mb-8 ${
            darkMode
              ? "text-gray-300"
              : "text-gray-500"
          }`}
        >
          Create your TaskFlow account.
        </p>

        <form onSubmit={handleSubmit(onSubmit)}>

          <input
            {...register("name")}
            placeholder="Full Name"
            className={`w-full p-4 rounded-xl border mb-4 ${
              darkMode
                ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                : "bg-white border-gray-300 text-black"
            }`}
          />

          <input
            type="email"
            {...register("email")}
            placeholder="Email Address"
            className={`w-full p-4 rounded-xl border mb-4 ${
              darkMode
                ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                : "bg-white border-gray-300 text-black"
            }`}
          />

          <input
            type="password"
            {...register("password")}
            placeholder="Password"
            className={`w-full p-4 rounded-xl border mb-6 ${
              darkMode
                ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                : "bg-white border-gray-300 text-black"
            }`}
          />

          <button
            type="submit"
            className="w-full py-4 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold hover:scale-[1.02] transition"
          >
            🚀 Register
          </button>

        </form>

        <p
          className={`mt-6 text-center ${
            darkMode
              ? "text-gray-300"
              : "text-gray-600"
          }`}
        >
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-blue-500 hover:underline"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
