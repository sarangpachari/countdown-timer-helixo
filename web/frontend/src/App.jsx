import { Routes, Route, Navigate } from "react-router-dom";
import TimerManagerPage from "./pages/TimerManagerPage.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/timers" replace />} />
      <Route path="/timers" element={<TimerManagerPage />} />
    </Routes>
  );
}
