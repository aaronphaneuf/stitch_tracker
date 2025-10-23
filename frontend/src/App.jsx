import Sidebar from './components/Sidebar';
import ProjectGrid from './components/ProjectGrid';
import { useEffect } from 'react'
import { Outlet } from "react-router-dom";

function ThemeToggle() {
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light') 
  }, [])

  const toggleTheme = () => {
    const current = document.documentElement.getAttribute('data-theme')
    const next = current === 'light' ? 'dark' : 'light'
    document.documentElement.setAttribute('data-theme', next)
  }

  return (
    <button className="btn btn-sm btn-outline" onClick={toggleTheme}>
      Toggle Theme
    </button>
  )
}

export default function App() {
  return (
    <div className="md:flex min-h-screen bg-base-100">
      <Sidebar />
      <main className="flex-1 p-4">
        <Outlet /> 
      </main>
    </div>
  );
}
