const swaggerDocument = {
openapi: "3.0.0",
info: {
title: "TaskFlow RBAC API",
version: "1.0.0",
description:
"Task Management API with JWT Authentication and RBAC",
},

servers: [
{
url: "http://localhost:5000",
},
],

paths: {
"/api/v1/auth/register": {
post: {
summary: "Register User",
},
},


"/api/v1/auth/login": {
  post: {
    summary: "Login User",
  },
},

"/api/v1/tasks": {
  get: {
    summary: "Get Tasks",
  },

  post: {
    summary: "Create Task",
  },
},


},
};

export default swaggerDocument;
