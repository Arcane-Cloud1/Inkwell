// 应用根组件：路由 + Toast
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from "@/pages/Home";
import Editor from "@/pages/Editor";
import Files from "@/pages/Files";
import Settings from "@/pages/Settings";
import ToastContainer from "@/components/Toast";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/editor" element={<Editor />} />
        <Route path="/files" element={<Files />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ToastContainer />
    </Router>
  );
}
