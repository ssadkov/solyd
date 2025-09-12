import Sidebar from './Sidebar'
import Dashboard from './Dashboard'
import HelpPanel from './HelpPanel'

export default function Layout() {
  return (
    <div className="h-screen flex bg-background text-foreground">
      {/* Left Sidebar */}
      <Sidebar />
      
      {/* Main Dashboard Area */}
      <div className="flex-1 flex">
        <Dashboard />
        
        {/* Right Help Panel */}
        <HelpPanel />
      </div>
    </div>
  )
}
