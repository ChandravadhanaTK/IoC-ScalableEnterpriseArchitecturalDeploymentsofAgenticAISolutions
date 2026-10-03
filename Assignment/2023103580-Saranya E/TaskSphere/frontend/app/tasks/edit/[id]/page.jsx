"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  getTaskById,
  updateTask,
} from "@/services/task.service";

export default function EditTaskPage() {
  const { register, handleSubmit, reset } = useForm();

  const params = useParams();
  const router = useRouter();

  const loadTask = async () => {
    try {
      const res = await getTaskById(params.id);

      const task =
        res.task ||
        res.data ||
        res;

      reset(task);
    } catch (err) {
      console.log(err);

      toast.error("Failed to load task");
    }
  };

  useEffect(() => {
    loadTask();
  }, []);

  const onSubmit = async (data) => {
    try {
      await updateTask(params.id, data);

      toast.success("Task Updated Successfully");

      router.push("/dashboard");
    } catch (err) {
      console.log(err);

      toast.error(
        err?.response?.data?.message ||
        "Update Failed"
      );
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-100">

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white shadow-lg rounded-lg p-8 w-full max-w-lg"
      >

        <h1 className="text-3xl font-bold mb-6">
          Edit Task
        </h1>

        <input
          {...register("title")}
          className="border p-3 rounded w-full mb-4"
          placeholder="Title"
        />

        <textarea
          {...register("description")}
          className="border p-3 rounded w-full mb-4"
          placeholder="Description"
        />

        <select
          {...register("status")}
          className="border p-3 rounded w-full mb-4"
        >
          <option value="PENDING">Pending</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
        </select>

        <button
          className="bg-blue-600 text-white p-3 rounded w-full"
        >
          Update Task
        </button>

      </form>

    </div>
  );
}