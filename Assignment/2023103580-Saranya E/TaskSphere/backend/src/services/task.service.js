import prisma from "../config/prisma.js";

export const createTaskService = async (
data,
user
) => {
const { title, description, status } = data;

const task = await prisma.task.create({
data: {
title,
description,
status,
userId: user.userId,
},
});

return task;
};

export const getTasksService = async (
user,
query
) => {
const page = parseInt(query.page) || 1;
const limit = parseInt(query.limit) || 10;

const skip = (page - 1) * limit;

const where = {};

if (user.role !== "ADMIN") {
where.userId = user.userId;
}

if (query.status) {
where.status = query.status;
}

const tasks = await prisma.task.findMany({
where,
skip,
take: limit,
orderBy: {
createdAt: "desc",
},
});

const total = await prisma.task.count({
where,
});

return {
tasks,
pagination: {
total,
page,
limit,
totalPages: Math.ceil(total / limit),
},
};
};

export const getTaskByIdService = async (
taskId,
user
) => {
const task = await prisma.task.findUnique({
where: {
id: taskId,
},
});

if (!task) {
throw new Error("Task not found");
}

if (
user.role !== "ADMIN" &&
task.userId !== user.userId
) {
throw new Error("Access denied");
}

return task;
};

export const updateTaskService = async (
taskId,
data,
user
) => {
const task = await prisma.task.findUnique({
where: {
id: taskId,
},
});

if (!task) {
throw new Error("Task not found");
}

if (
user.role !== "ADMIN" &&
task.userId !== user.userId
) {
throw new Error("Access denied");
}

return await prisma.task.update({
where: {
id: taskId,
},
data,
});
};

export const deleteTaskService = async (
taskId,
user
) => {
const task = await prisma.task.findUnique({
where: {
id: taskId,
},
});

if (!task) {
throw new Error("Task not found");
}

if (
user.role !== "ADMIN" &&
task.userId !== user.userId
) {
throw new Error("Access denied");
}

return await prisma.task.delete({
where: {
id: taskId,
},
});
};
