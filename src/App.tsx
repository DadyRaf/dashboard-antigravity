import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { Layout } from "./components/Layout"
import { Dashboard } from "./pages/Dashboard"
import { WebScrapers } from "./pages/WebScrapers"
import { Outcomes } from "./pages/Outcomes"
import { Research } from "./pages/Research"
import { TaskAutomations } from "./pages/TaskAutomations"

import { Settings } from "./pages/Settings"

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/scrapers" element={<WebScrapers />} />
          <Route path="/outcomes" element={<Outcomes />} />
          <Route path="/research" element={<Research />} />
          <Route path="/automations" element={<TaskAutomations />} />
          {/* Placeholder for future routes */}
          <Route path="/logs" element={<div className="p-4">Logs Page (Coming Soon)</div>} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default App
