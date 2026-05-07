import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { useUser } from "./context/user-context"
import { Layout } from "./components/Layout"
import { Dashboard } from "./pages/Dashboard"
import { WebScrapers } from "./pages/WebScrapers"
import { Outcomes } from "./pages/Outcomes"
import { Research } from "./pages/Research"
import { TaskAutomations } from "./pages/TaskAutomations"
import { Login } from "./pages/Login"
import { Settings } from "./pages/Settings"
import { ServicePage } from "./pages/ServicePage"
import { Logs } from "./pages/Logs"

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useUser()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
          <Route path="/services/:slug" element={<ProtectedLayout><ServicePage /></ProtectedLayout>} />
          <Route path="/logs" element={<ProtectedLayout><Logs /></ProtectedLayout>} />
          <Route path="/settings" element={<ProtectedLayout><Settings /></ProtectedLayout>} />

          {/* Legacy pages — kept reachable by direct URL while we migrate. */}
          <Route path="/scrapers" element={<ProtectedLayout><WebScrapers /></ProtectedLayout>} />
          <Route path="/outcomes" element={<ProtectedLayout><Outcomes /></ProtectedLayout>} />
          <Route path="/research" element={<ProtectedLayout><Research /></ProtectedLayout>} />
          <Route path="/automations" element={<ProtectedLayout><TaskAutomations /></ProtectedLayout>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default App
