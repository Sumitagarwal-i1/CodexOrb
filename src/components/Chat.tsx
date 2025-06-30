import React, { useState, useRef, useEffect } from 'react'
import { Send, Mic, MicOff, Bot, User, Loader2, Zap, Users, Share2, Copy, Check } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'

export function Chat() {
  const [message, setMessage] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [copied, setCopied] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const recognition = useRef<SpeechRecognition | null>(null)
  
  const { 
    messages, 
    currentSession, 
    voiceInput, 
    isLoading,
    sendMessage, 
    generateCode,
    sessionParticipants,
    inviteToSession
  } = useAppStore()

  const hasGroqKey = !!import.meta.env.VITE_GROQ_API_KEY

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      recognition.current = new SpeechRecognition()
      recognition.current.continuous = true
      recognition.current.interimResults = true
      
      recognition.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('')
        
        setMessage(transcript)
      }
      
      recognition.current.onerror = () => {
        setIsListening(false)
      }
      
      recognition.current.onend = () => {
        setIsListening(false)
      }
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || !currentSession) return

    const userMessage = message.trim()
    setMessage('')
    
    // Send message first
    await sendMessage(userMessage, 'user')
    
    // Then generate code
    await generateCode(userMessage)
  }

  const toggleListening = () => {
    if (!recognition.current) return

    if (isListening) {
      recognition.current.stop()
      setIsListening(false)
    } else {
      recognition.current.start()
      setIsListening(true)
    }
  }

  const handleShare = async () => {
    if (!currentSession) return
    
    const shareUrl = `${window.location.origin}/session/${currentSession.id}`
    
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast.success('Session link copied to clipboard!')
    } catch (error) {
      toast.error('Failed to copy link')
    }
  }

  const handleInviteUser = async (email: string) => {
    if (!currentSession) return
    
    try {
      await inviteToSession(currentSession.id, email)
      toast.success(`Invitation sent to ${email}`)
      setShowShareModal(false)
    } catch (error) {
      toast.error('Failed to send invitation')
    }
  }

  if (!currentSession) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Bot className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No Active Session
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Create or join a session to start collaborating
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* AI Status Banner */}
      <div className={`${hasGroqKey ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'} border-b px-6 py-3`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Zap className={`w-4 h-4 ${hasGroqKey ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`} />
            <span className={`text-sm ${hasGroqKey ? 'text-green-800 dark:text-green-200' : 'text-yellow-800 dark:text-yellow-200'}`}>
              {hasGroqKey 
                ? 'Groq AI enabled - Real AI responses active' 
                : 'Mock AI mode - Add VITE_GROQ_API_KEY to .env for real AI'
              }
            </span>
          </div>
          
          {/* Collaboration Controls */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {sessionParticipants.length} participant{sessionParticipants.length !== 1 ? 's' : ''}
              </span>
            </div>
            <button
              onClick={() => setShowShareModal(true)}
              className="flex items-center space-x-1 px-3 py-1 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm"
            >
              <Share2 className="w-3 h-3" />
              <span>Share</span>
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-6 space-y-4">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`flex items-start space-x-3 ${
                msg.type === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.type === 'ai' && (
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
              
              <div className={`max-w-2xl ${msg.type === 'user' ? 'order-first' : ''}`}>
                <div className={`px-4 py-3 rounded-2xl font-mono text-sm ${
                  msg.type === 'user'
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                }`}>
                  {msg.content}
                </div>
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {new Date(msg.created_at).toLocaleTimeString()}
                </div>
              </div>
              
              {msg.type === 'user' && (
                <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-start space-x-3"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-gray-100 dark:bg-gray-800 px-4 py-3 rounded-2xl">
              <div className="flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {hasGroqKey ? 'Generating code with Groq AI...' : 'Generating code...'}
                </span>
              </div>
            </div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 dark:border-gray-800 p-6">
        <form onSubmit={handleSubmit} className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe what you want to build..."
              className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm disabled:opacity-50"
              disabled={isLoading}
            />
            
            {voiceInput && recognition.current && (
              <button
                type="button"
                onClick={toggleListening}
                className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-md transition-colors ${
                  isListening
                    ? 'text-red-500 bg-red-50 dark:bg-red-900/20'
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
              >
                {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              </button>
            )}
          </div>
          
          <button
            type="submit"
            disabled={!message.trim() || isLoading}
            className="px-6 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span>Send</span>
          </button>
        </form>
        
        <div className="mt-2 flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
          <Zap className={`w-3 h-3 ${hasGroqKey ? 'text-green-500' : 'text-yellow-500'}`} />
          <span>
            {hasGroqKey 
              ? 'Powered by Groq AI - Ultra-fast inference' 
              : 'Mock AI mode - Add VITE_GROQ_API_KEY to .env for real AI'
            }
          </span>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Share Session
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Session Link
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={`${window.location.origin}/session/${currentSession.id}`}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-sm"
                  />
                  <button
                    onClick={handleShare}
                    className="px-3 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Invite by Email
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="email"
                    placeholder="colleague@example.com"
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const email = (e.target as HTMLInputElement).value
                        if (email) {
                          handleInviteUser(email)
                          ;(e.target as HTMLInputElement).value = ''
                        }
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      const input = document.querySelector('input[type="email"]') as HTMLInputElement
                      if (input?.value) {
                        handleInviteUser(input.value)
                        input.value = ''
                      }
                    }}
                    className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                  >
                    Invite
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowShareModal(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}