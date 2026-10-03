import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./index.css";
import { AuthProvider } from "./lib/auth";
import { Layout, ProtectedRoute } from "./components/Layout";
import Landing from "./pages/Landing"; import Login from "./pages/Login"; import Dashboard from "./pages/Dashboard"; import PdfLibrary from "./pages/PdfLibrary";
import Quiz from "./pages/Quiz"; import Results from "./pages/Results"; import StudyPlan from "./pages/StudyPlan"; import Profile from "./pages/Profile"; import Admin from "./pages/Admin";
createRoot(document.getElementById("root")!).render(<StrictMode><BrowserRouter><AuthProvider><Routes>
  <Route path="/" element={<Landing />} /><Route path="/login" element={<Login />} />
  <Route element={<ProtectedRoute />}><Route element={<Layout />}>
    <Route path="/dashboard" element={<Dashboard />} /><Route path="/library" element={<PdfLibrary />} /><Route path="/quiz" element={<Quiz />} />
    <Route path="/results" element={<Results />} /><Route path="/study-plan" element={<StudyPlan />} /><Route path="/profile" element={<Profile />} />
    <Route element={<ProtectedRoute roles={["admin"]} />}><Route path="/admin" element={<Admin />} /></Route>
  </Route></Route></Routes></AuthProvider></BrowserRouter></StrictMode>);
