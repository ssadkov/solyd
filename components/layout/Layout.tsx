import Sidebar from './Sidebar'
import Dashboard from './Dashboard'

export default function Layout() {
  return (
    <div className="h-screen flex bg-background text-foreground">
      {/* Left Sidebar */}
      <Sidebar />
      
      {/* Main Dashboard Area - Full Width */}
      <div className="flex-1 flex">
        <Dashboard />
      </div>
    </div>
  )
}
