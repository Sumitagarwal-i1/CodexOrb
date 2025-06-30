import React, { useState } from 'react'
import { Plus, MessageSquare, Code, BarChart3, Cuboid as Cube, ChevronLeft, ChevronRight, Folder, Settings, Home } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { motion } from 'framer-motion'

export function Sidebar() {
  const { 
    sessions, 
    currentSession, 
    sidebarCollapsed, 
    toggleSidebar,
    createSession,
    joinSession
  } = useAppStore()
  
  const [newSessionName, setNewSessionName] = useState('')
  const [showNewSessionForm, setShowNewSessionForm] = useState(false)

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSessionName.trim()) return

    const session = await createSession(newSessionName)
    if (session) {
      setNewSessionName('')
      setShowNewSessionForm(false)
      await joinSession(session.id)
    }
  }

  const handleGoHome = () => {
    window.location.reload() // Simple way to go back to home page
  }

  return (
    <motion.div 
      className={`fixed left-0 top-0 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-40 transition-all duration-300 ${
        sidebarCollapsed ? 'w-16' : 'w-80'
      }`}
      initial={false}
      animate={{ width: sidebarCollapsed ? 64 : 320 }}
    >
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="h-16 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 flex-shrink-0">
          {!sidebarCollapsed && (
            <button
              onClick={handleGoHome}
              className="flex items-center space-x-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg px-2 py-1 transition-colors"
            >
              <Cube className="w-6 h-6 text-primary-500" />
              <span className="font-semibold text-gray-900 dark:text-gray-100">CodexOrb</span>
            </button>
          )}
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {!sidebarCollapsed && (
            <div className="p-4">
              {/* New Session */}
              <div className="mb-6">
                {showNewSessionForm ? (
                  <form onSubmit={handleCreateSession} className="space-y-2">
                    <input
                      type="text"
                      value={newSessionName}
                      onChange={(e) => setNewSessionName(e.target.value)}
                      placeholder="Session name..."
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      autoFocus
                    />
                    <div className="flex space-x-2">
                      <button
                        type="submit"
                        className="px-3 py-1 text-xs bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors"
                      >
                        Create
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowNewSessionForm(false)}
                        className="px-3 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    onClick={() => setShowNewSessionForm(true)}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>New Session</span>
                  </button>
                )}
              </div>

              {/* Sessions */}
              <div className="space-y-1">
                <h3 className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Recent Sessions ({sessions.length})
                </h3>
                <div className="max-h-96 overflow-y-auto scrollbar-thin space-y-1">
                  {sessions.map((session) => (
                    <motion.button
                      key={session.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      onClick={() => joinSession(session.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-3 text-sm rounded-lg transition-colors ${
                        currentSession?.id === session.id
                          ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      <Folder className="w-4 h-4 flex-shrink-0" />
                      <div className="flex-1 text-left truncate">
                        <div className="truncate font-medium">{session.name}</div>
                        <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                          <span className="capitalize">{session.language}</span>
                          <span>•</span>
                          <span>{session.is_public ? 'Public' : 'Private'}</span>
                        </div>
                      </div>
                      {currentSession?.id === session.id && (
                        <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></div>
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Collapsed Navigation */}
          {sidebarCollapsed && (
            <div className="flex flex-col items-center py-4 space-y-4">
              <button
                onClick={handleGoHome}
                className="p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Home"
              >
                <Home className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowNewSessionForm(true)}
                className="p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="New Session"
              >
                <Plus className="w-5 h-5" />
              </button>
              <button
                className="p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Chat"
              >
                <MessageSquare className="w-5 h-5" />
              </button>
              <button
                className="p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Code"
              >
                <Code className="w-5 h-5" />
              </button>
              <button
                className="p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Analytics"
              >
                <BarChart3 className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex-shrink-0">
          {!sidebarCollapsed && (
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center space-y-1">
              <div>Built with Bolt.new</div>
              <div>© 2025 CodexOrb</div>
              <div className="text-primary-500">https://codexorb.app</div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}