import React from 'react'
import { 
  Sun, 
  Moon, 
  Mic, 
  MicOff, 
  User, 
  Settings,
  LogOut
} from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export function Header() {
  const { 
    user, 
    darkMode, 
    voiceInput, 
    currentSession,
    toggleDarkMode, 
    toggleVoiceInput,
    setUser
  } = useAppStore()

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      toast.error('Error signing out')
    } else {
      setUser(null)
      toast.success('Signed out successfully')
    }
  }

  return (
    <header className="h-16 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center justify-between px-6">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {currentSession ? `Session: ${currentSession.name}` : 'No active session'}
          </span>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <button
          onClick={toggleVoiceInput}
          className={`p-2 rounded-lg transition-colors ${
            voiceInput 
              ? 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400' 
              : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
          title={voiceInput ? 'Stop voice input' : 'Start voice input'}
        >
          {voiceInput ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
        </button>

        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-lg bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {user?.email?.split('@')[0] || 'User'}
          </span>
        </div>

        <button
          onClick={handleSignOut}
          className="p-2 rounded-lg bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors"
          title="Sign out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  )
}