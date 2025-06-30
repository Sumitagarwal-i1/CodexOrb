import React, { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { supabase } from './lib/supabase'
import { useAppStore } from './store/useAppStore'
import { Auth } from './components/Auth'
import { Layout } from './components/Layout'
import { HomePage } from './components/HomePage'
import { Chat } from './components/Chat'
import { CodeEditor } from './components/CodeEditor'
import { CodeSculpture } from './components/CodeSculpture'
import { Dashboard } from './components/Dashboard'
import { MessageSquare, Code, BarChart3, Cuboid as Cube, Loader2 } from 'lucide-react'

function MainApp() {
  const [activeTab, setActiveTab] = useState<'chat' | 'code' | 'sculpture' | 'dashboard'>('chat')
  const [showHomePage, setShowHomePage] = useState(true)
  const { loadSessions, currentSession, cleanupSubscriptions } = useAppStore()

  useEffect(() => {
    loadSessions()
    
    // Cleanup subscriptions on unmount
    return () => {
      cleanupSubscriptions()
    }
  }, [loadSessions, cleanupSubscriptions])

  const tabs = [
    { id: 'chat', label: 'Chat', icon: MessageSquare, component: Chat },
    { id: 'code', label: 'Code', icon: Code, component: CodeEditor },
    { id: 'sculpture', label: '3D View', icon: Cube, component: CodeSculpture },
    { id: 'dashboard', label: 'Analytics', icon: BarChart3, component: Dashboard },
  ] as const

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || Chat

  const handleGetStarted = () => {
    setShowHomePage(false)
  }

  if (showHomePage) {
    return <HomePage onGetStarted={handleGetStarted} />
  }

  return (
    <Layout>
      <div className="flex h-full">
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="flex-1">
            <ActiveComponent />
          </div>
        </div>
      </div>
    </Layout>
  )
}

function App() {
  const { user, setUser, darkMode } = useAppStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    }).catch((error) => {
      console.error('Error getting session:', error)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [setUser])

  useEffect(() => {
    // Apply dark mode class to html element
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading CodexOrb...</p>
        </div>
      </div>
    )
  }

  return (
    <Router>
      <div className="App">
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: darkMode ? '#1f2937' : '#ffffff',
              color: darkMode ? '#f9fafb' : '#111827',
              border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
            },
          }}
        />
        
        <Routes>
          <Route
            path="/"
            element={user ? <MainApp /> : <Auth />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App