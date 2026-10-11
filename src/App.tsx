import { Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Toaster } from "@/components/ui/sonner";
import { TodayPage } from "@/pages/TodayPage";
import { WeekPage } from "@/pages/WeekPage";
import { TasksPage } from "@/pages/TasksPage";
import { WeekTasksPage } from "@/pages/WeekTasksPage";
import { WeeksPage } from "@/pages/WeeksPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { NotesPage } from "@/pages/NotesPage";
import { NotePage } from "@/pages/NotePage";
import { NotFoundPage } from "@/pages/NotFoundPage";

/**
 * App assumes it is already wrapped in <BrowserRouter> (see main.tsx).
 */
export default function App() {
  return (
    <>
      <AppLayout>
        <Routes>
          <Route path="/" element={<TodayPage />} />
          <Route path="/week" element={<WeekPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/tasks/weeks" element={<WeeksPage />} />
          <Route path="/tasks/:weekId" element={<WeekTasksPage />} />
          <Route path="/notes" element={<NotesPage />} />
          <Route path="/notes/:noteId" element={<NotePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/dashboard" element={<Navigate to="/" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AppLayout>
      <Toaster />
    </>
  );
}
