import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import WelcomeModal from './WelcomeModal'

export default function MainLayout() {
  return (
    <div className="min-h-screen flex relative">
      <WelcomeModal />
      {/* Ambient orbs */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div className="orb orb-purple w-[500px] h-[500px] absolute -top-32 -left-32 opacity-50" />
        <div className="orb orb-blue w-[400px] h-[400px] absolute top-1/2 right-0 opacity-35 animate-float" />
        <div className="orb orb-pink w-[300px] h-[300px] absolute bottom-0 left-1/3 opacity-25 animate-float delay-1000" />
      </div>

      <Sidebar />

      {/*
        Desktop → geser kanan sejauh lebar sidebar
        Mobile  → tidak digeser, cukup padding atas untuk top navbar
      */}
      <main
        className="flex-1 relative pt-[5rem] pb-6 px-4 md:pt-6 md:px-6 md:ml-[17rem]"
        style={{ zIndex: 1 }}
      >
        <div className="max-w-4xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}