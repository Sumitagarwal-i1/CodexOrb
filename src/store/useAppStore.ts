import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'
import toast from 'react-hot-toast'

interface Message {
  id: string
  session_id: string
  user_id: string
  content: string
  type: 'user' | 'ai' | 'system'
  created_at: string
  metadata?: Record<string, any>
}

interface CodeFile {
  id: string
  session_id: string
  filename: string
  content: string
  language: string
  created_at: string
  updated_at: string
  health_score: number
  issues?: Record<string, any>[]
}

interface Session {
  id: string
  name: string
  description?: string
  owner_id: string
  created_at: string
  updated_at: string
  is_public: boolean
  language: 'python' | 'javascript'
}

interface SessionParticipant {
  id: string
  session_id: string
  user_id: string
  role: 'owner' | 'developer' | 'designer' | 'qa' | 'viewer'
  joined_at: string
  last_active: string
}

interface AppState {
  user: User | null
  currentSession: Session | null
  sessions: Session[]
  messages: Message[]
  codeFiles: CodeFile[]
  sessionParticipants: SessionParticipant[]
  isLoading: boolean
  error: string | null
  darkMode: boolean
  voiceInput: boolean
  sidebarCollapsed: boolean
  
  // Actions
  setUser: (user: User | null) => void
  setCurrentSession: (session: Session | null) => void
  setSessions: (sessions: Session[]) => void
  setMessages: (messages: Message[]) => void
  setCodeFiles: (files: CodeFile[]) => void
  setSessionParticipants: (participants: SessionParticipant[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  toggleDarkMode: () => void
  toggleVoiceInput: () => void
  toggleSidebar: () => void
  
  // Async actions
  loadSessions: () => Promise<void>
  createSession: (name: string, description?: string, language?: 'python' | 'javascript') => Promise<Session | null>
  joinSession: (sessionId: string) => Promise<void>
  sendMessage: (content: string, type?: 'user' | 'ai' | 'system') => Promise<void>
  generateCode: (prompt: string) => Promise<void>
  updateCodeFile: (fileId: string, content: string) => Promise<void>
  inviteToSession: (sessionId: string, email: string) => Promise<void>
  setupRealtimeSubscriptions: () => void
  cleanupSubscriptions: () => void
}

export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  currentSession: null,
  sessions: [],
  messages: [],
  codeFiles: [],
  sessionParticipants: [],
  isLoading: false,
  error: null,
  darkMode: true,
  voiceInput: false,
  sidebarCollapsed: false,

  setUser: (user) => set({ user }),
  setCurrentSession: (session) => set({ currentSession: session }),
  setSessions: (sessions) => set({ sessions }),
  setMessages: (messages) => set({ messages }),
  setCodeFiles: (files) => set({ codeFiles: files }),
  setSessionParticipants: (participants) => set({ sessionParticipants: participants }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
  toggleVoiceInput: () => set((state) => ({ voiceInput: !state.voiceInput })),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  loadSessions: async () => {
    const { user } = get()
    if (!user) return

    set({ isLoading: true, error: null })
    
    try {
      // First get sessions where user is owner
      const { data: ownedSessions, error: ownedError } = await supabase
        .from('sessions')
        .select('*')
        .eq('owner_id', user.id)
        .order('updated_at', { ascending: false })

      if (ownedError) throw ownedError

      // Then get sessions where user is participant
      const { data: participantSessions, error: participantError } = await supabase
        .from('session_participants')
        .select(`
          sessions (
            id, name, description, owner_id, created_at, updated_at, is_public, language
          )
        `)
        .eq('user_id', user.id)

      if (participantError) throw participantError

      // Combine and deduplicate sessions
      const allSessions = [...(ownedSessions || [])]
      
      if (participantSessions) {
        participantSessions.forEach((participant: any) => {
          if (participant.sessions && !allSessions.find(s => s.id === participant.sessions.id)) {
            allSessions.push(participant.sessions)
          }
        })
      }

      // Sort by updated_at
      allSessions.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      
      set({ sessions: allSessions, isLoading: false })
    } catch (error: any) {
      console.error('Error loading sessions:', error)
      set({ error: error.message, isLoading: false })
      toast.error('Failed to load sessions')
    }
  },

  createSession: async (name, description = '', language = 'javascript') => {
    const { user } = get()
    if (!user) {
      toast.error('You must be logged in to create a session')
      return null
    }

    set({ isLoading: true, error: null })

    try {
      const { data, error } = await supabase
        .from('sessions')
        .insert([{
          name,
          description,
          owner_id: user.id,
          language,
          is_public: false
        }])
        .select()
        .single()

      if (error) throw error

      // Add user as owner participant
      const { error: participantError } = await supabase
        .from('session_participants')
        .insert([{
          session_id: data.id,
          user_id: user.id,
          role: 'owner'
        }])

      if (participantError) {
        console.warn('Failed to add participant record:', participantError)
        // Don't fail the session creation for this
      }

      set({ isLoading: false })
      toast.success('Session created successfully!')
      
      // Reload sessions
      await get().loadSessions()
      
      return data
    } catch (error: any) {
      console.error('Error creating session:', error)
      set({ error: error.message, isLoading: false })
      toast.error('Failed to create session')
      return null
    }
  },

  joinSession: async (sessionId) => {
    const { user } = get()
    if (!user) {
      toast.error('You must be logged in to join a session')
      return
    }

    set({ isLoading: true, error: null })

    try {
      // Get session details first
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', sessionId)
        .single()

      if (sessionError) {
        console.error('Session fetch error:', sessionError)
        throw new Error('Session not found or access denied')
      }

      if (!session) {
        throw new Error('Session not found')
      }

      // Check if user can access this session
      const canAccess = session.owner_id === user.id || session.is_public

      if (!canAccess) {
        // Check if user is already a participant
        const { data: participant } = await supabase
          .from('session_participants')
          .select('id')
          .eq('session_id', sessionId)
          .eq('user_id', user.id)
          .single()

        if (!participant) {
          throw new Error('You do not have access to this session')
        }
      }

      // Add user as participant if not owner and not already participant
      if (session.owner_id !== user.id) {
        const { error: participantError } = await supabase
          .from('session_participants')
          .upsert({
            session_id: sessionId,
            user_id: user.id,
            role: 'developer'
          }, {
            onConflict: 'session_id,user_id'
          })

        if (participantError) {
          console.warn('Failed to add participant:', participantError)
          // Don't fail joining for this
        }
      }

      // Load messages for this session
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })

      if (messagesError) {
        console.error('Messages fetch error:', messagesError)
        // Don't fail for this, just set empty messages
      }

      // Load code files for this session
      const { data: codeFiles, error: filesError } = await supabase
        .from('code_files')
        .select('*')
        .eq('session_id', sessionId)
        .order('updated_at', { ascending: false })

      if (filesError) {
        console.error('Files fetch error:', filesError)
        // Don't fail for this, just set empty files
      }

      // Load session participants
      const { data: participants, error: participantsError } = await supabase
        .from('session_participants')
        .select('*')
        .eq('session_id', sessionId)

      if (participantsError) {
        console.error('Participants fetch error:', participantsError)
      }

      // Cleanup existing subscriptions
      get().cleanupSubscriptions()

      set({
        currentSession: session,
        messages: messages || [],
        codeFiles: codeFiles || [],
        sessionParticipants: participants || [],
        isLoading: false,
        error: null
      })

      // Setup real-time subscriptions
      get().setupRealtimeSubscriptions()

      toast.success(`Joined session: ${session.name}`)
    } catch (error: any) {
      console.error('Error joining session:', error)
      set({ error: error.message, isLoading: false })
      toast.error(error.message || 'Failed to join session')
    }
  },

  sendMessage: async (content, type = 'user') => {
    const { user, currentSession } = get()
    if (!user || !currentSession) {
      toast.error('No active session')
      return
    }

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert([{
          session_id: currentSession.id,
          user_id: user.id,
          content,
          type
        }])
        .select()
        .single()

      if (error) throw error

      // Add message to local state immediately for better UX
      if (type === 'user') {
        const { messages } = get()
        set({ messages: [...messages, data] })
      }

      // If this is a user message, also call chat-response edge function
      if (type === 'user') {
        try {
          console.log('Calling chat-response edge function...')
          
          const { data: { session } } = await supabase.auth.getSession()
          if (!session) throw new Error('No auth session')

          const { data: chatData, error: chatError } = await supabase.functions.invoke('chat-response', {
            body: {
              message: content,
              sessionId: currentSession.id,
              context: `Session: ${currentSession.name}`
            },
            headers: {
              Authorization: `Bearer ${session.access_token}`
            }
          })

          console.log('Chat response result:', chatData)

          if (chatError) {
            console.error('Chat response error:', chatError)
            // Don't fail the message sending for this
          }
        } catch (chatError: any) {
          console.error('Error calling chat-response:', chatError)
          // Don't fail the message sending for this
        }
      }
    } catch (error: any) {
      console.error('Error sending message:', error)
      set({ error: error.message })
      toast.error('Failed to send message')
    }
  },

  generateCode: async (prompt) => {
    const { currentSession, user } = get()
    if (!currentSession || !user) {
      toast.error('No active session')
      return
    }

    set({ isLoading: true })

    try {
      console.log('Calling generate-code edge function...')

      // Get auth token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('No auth session')

      // Always call the edge function - let it handle the API key logic
      const { data, error } = await supabase.functions.invoke('generate-code', {
        body: {
          prompt,
          language: currentSession.language,
          context: `Session: ${currentSession.name}`,
          sessionId: currentSession.id,
          existingFiles: get().codeFiles.map(f => ({ filename: f.filename, content: f.content }))
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      })

      console.log('Edge function response:', data)

      if (error) {
        console.error('Edge function error:', error)
        throw error
      }

      if (data && data.success) {
        // Files and messages will be updated via real-time subscriptions
        toast.success(`Generated ${data.codeFile.filename}`)
      } else {
        throw new Error(data?.error || 'Failed to generate code')
      }
    } catch (error: any) {
      console.error('Error generating code:', error)
      set({ error: error.message })
      
      // Fallback to mock generation if edge function fails
      console.log('Falling back to mock code generation')
      await get().generateMockCode(prompt)
    } finally {
      set({ isLoading: false })
    }
  },

  updateCodeFile: async (fileId: string, content: string) => {
    const { user } = get()
    if (!user) {
      throw new Error('User not authenticated')
    }

    try {
      const { data, error } = await supabase
        .from('code_files')
        .update({ content })
        .eq('id', fileId)
        .select()
        .single()

      if (error) throw error

      // Update local state
      const { codeFiles } = get()
      const updatedFiles = codeFiles.map(file => 
        file.id === fileId ? { ...file, content } : file
      )
      set({ codeFiles: updatedFiles })

      return data
    } catch (error: any) {
      console.error('Error updating code file:', error)
      throw error
    }
  },

  inviteToSession: async (sessionId: string, email: string) => {
    const { user } = get()
    if (!user) {
      throw new Error('User not authenticated')
    }

    try {
      // In a real implementation, this would send an email invitation
      // For now, we'll just simulate it
      console.log(`Inviting ${email} to session ${sessionId}`)
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // In a real app, you'd have an invitation system
      return true
    } catch (error: any) {
      console.error('Error inviting user:', error)
      throw error
    }
  },

  // Mock code generation for when API key is not available
  generateMockCode: async (prompt: string) => {
    const { currentSession, user, sendMessage } = get()
    if (!currentSession || !user) return

    set({ isLoading: true })

    try {
      // Generate mock code based on prompt
      const mockCode = generateMockCode(prompt, currentSession.language)
      
      // Create code file
      const { data, error } = await supabase
        .from('code_files')
        .insert([{
          session_id: currentSession.id,
          filename: mockCode.filename,
          content: mockCode.content,
          language: currentSession.language,
          health_score: Math.floor(Math.random() * 40) + 60, // 60-100
          issues: mockCode.issues
        }])
        .select()
        .single()

      if (error) throw error

      // Send AI response
      await sendMessage(`I've generated ${mockCode.filename} for you. The code includes ${mockCode.description}`, 'ai')
      
      toast.success(`Generated ${mockCode.filename} (Mock Mode)`)
    } catch (error: any) {
      console.error('Error generating mock code:', error)
      set({ error: error.message })
      toast.error('Failed to generate code')
    } finally {
      set({ isLoading: false })
    }
  },

  setupRealtimeSubscriptions: () => {
    const { currentSession, user } = get()
    if (!currentSession || !user) return

    // Cleanup existing subscriptions first
    get().cleanupSubscriptions()

    try {
      // Subscribe to new messages
      const messagesSubscription = supabase
        .channel(`messages:${currentSession.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `session_id=eq.${currentSession.id}`
          },
          (payload) => {
            const newMessage = payload.new as Message
            // Only add if it's not from current user (avoid duplicates)
            if (newMessage.user_id !== user.id) {
              const { messages } = get()
              set({ messages: [...messages, newMessage] })
            }
          }
        )
        .subscribe()

      // Subscribe to new code files
      const filesSubscription = supabase
        .channel(`code_files:${currentSession.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'code_files',
            filter: `session_id=eq.${currentSession.id}`
          },
          (payload) => {
            const newFile = payload.new as CodeFile
            const { codeFiles } = get()
            // Check if file already exists to avoid duplicates
            if (!codeFiles.find(f => f.id === newFile.id)) {
              set({ codeFiles: [newFile, ...codeFiles] })
            }
          }
        )
        .subscribe()

      // Subscribe to code file updates
      const fileUpdatesSubscription = supabase
        .channel(`code_files_updates:${currentSession.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'code_files',
            filter: `session_id=eq.${currentSession.id}`
          },
          (payload) => {
            const updatedFile = payload.new as CodeFile
            const { codeFiles } = get()
            const updatedFiles = codeFiles.map(file => 
              file.id === updatedFile.id ? updatedFile : file
            )
            set({ codeFiles: updatedFiles })
          }
        )
        .subscribe()

      // Store subscriptions for cleanup
      ;(window as any).supabaseSubscriptions = [messagesSubscription, filesSubscription, fileUpdatesSubscription]
    } catch (error) {
      console.error('Error setting up subscriptions:', error)
    }
  },

  cleanupSubscriptions: () => {
    const subscriptions = (window as any).supabaseSubscriptions
    if (subscriptions && Array.isArray(subscriptions)) {
      subscriptions.forEach((subscription: any) => {
        try {
          supabase.removeChannel(subscription)
        } catch (error) {
          console.error('Error cleaning up subscription:', error)
        }
      })
      ;(window as any).supabaseSubscriptions = []
    }
  }
}))

// Mock code generation function
function generateMockCode(prompt: string, language: 'python' | 'javascript') {
  const isJavaScript = language === 'javascript'
  const lowerPrompt = prompt.toLowerCase()
  
  if (lowerPrompt.includes('todo') || lowerPrompt.includes('task')) {
    return {
      filename: isJavaScript ? 'TodoApp.js' : 'todo_app.py',
      content: isJavaScript ? `// Todo App Implementation
class TodoApp {
  constructor() {
    this.todos = [];
    this.nextId = 1;
  }

  addTodo(text) {
    const todo = {
      id: this.nextId++,
      text,
      completed: false,
      createdAt: new Date()
    };
    this.todos.push(todo);
    return todo;
  }

  toggleTodo(id) {
    const todo = this.todos.find(t => t.id === id);
    if (todo) {
      todo.completed = !todo.completed;
    }
    return todo;
  }

  deleteTodo(id) {
    this.todos = this.todos.filter(t => t.id !== id);
  }

  getTodos() {
    return this.todos;
  }

  getCompletedTodos() {
    return this.todos.filter(t => t.completed);
  }

  getPendingTodos() {
    return this.todos.filter(t => !t.completed);
  }
}

export default TodoApp;` : `# Todo App Implementation
from datetime import datetime
from typing import List, Dict, Optional

class TodoApp:
    def __init__(self):
        self.todos: List[Dict] = []
        self.next_id = 1
    
    def add_todo(self, text: str) -> Dict:
        todo = {
            'id': self.next_id,
            'text': text,
            'completed': False,
            'created_at': datetime.now()
        }
        self.todos.append(todo)
        self.next_id += 1
        return todo
    
    def toggle_todo(self, todo_id: int) -> Optional[Dict]:
        for todo in self.todos:
            if todo['id'] == todo_id:
                todo['completed'] = not todo['completed']
                return todo
        return None
    
    def delete_todo(self, todo_id: int) -> bool:
        self.todos = [t for t in self.todos if t['id'] != todo_id]
        return True
    
    def get_todos(self) -> List[Dict]:
        return self.todos
    
    def get_completed_todos(self) -> List[Dict]:
        return [t for t in self.todos if t['completed']]
    
    def get_pending_todos(self) -> List[Dict]:
        return [t for t in self.todos if not t['completed']]

if __name__ == "__main__":
    app = TodoApp()
    app.add_todo("Learn Python")
    app.add_todo("Build a todo app")
    print(f"Total todos: {len(app.get_todos())}")`,
      description: 'a complete todo management system with add, toggle, delete, and filter functionality',
      issues: []
    }
  }

  if (lowerPrompt.includes('calculator') || lowerPrompt.includes('math')) {
    return {
      filename: isJavaScript ? 'Calculator.js' : 'calculator.py',
      content: isJavaScript ? `// Advanced Calculator Implementation
class Calculator {
  constructor() {
    this.history = [];
  }

  add(a, b) {
    const result = a + b;
    this.history.push(\`\${a} + \${b} = \${result}\`);
    return result;
  }

  subtract(a, b) {
    const result = a - b;
    this.history.push(\`\${a} - \${b} = \${result}\`);
    return result;
  }

  multiply(a, b) {
    const result = a * b;
    this.history.push(\`\${a} × \${b} = \${result}\`);
    return result;
  }

  divide(a, b) {
    if (b === 0) {
      throw new Error('Division by zero is not allowed');
    }
    const result = a / b;
    this.history.push(\`\${a} ÷ \${b} = \${result}\`);
    return result;
  }

  power(base, exponent) {
    const result = Math.pow(base, exponent);
    this.history.push(\`\${base}^\${exponent} = \${result}\`);
    return result;
  }

  sqrt(number) {
    if (number < 0) {
      throw new Error('Cannot calculate square root of negative number');
    }
    const result = Math.sqrt(number);
    this.history.push(\`√\${number} = \${result}\`);
    return result;
  }

  getHistory() {
    return this.history;
  }

  clearHistory() {
    this.history = [];
  }
}

export default Calculator;` : `# Advanced Calculator Implementation
import math
from typing import List

class Calculator:
    def __init__(self):
        self.history: List[str] = []
    
    def add(self, a: float, b: float) -> float:
        result = a + b
        self.history.append(f"{a} + {b} = {result}")
        return result
    
    def subtract(self, a: float, b: float) -> float:
        result = a - b
        self.history.append(f"{a} - {b} = {result}")
        return result
    
    def multiply(self, a: float, b: float) -> float:
        result = a * b
        self.history.append(f"{a} × {b} = {result}")
        return result
    
    def divide(self, a: float, b: float) -> float:
        if b == 0:
            raise ValueError("Division by zero is not allowed")
        result = a / b
        self.history.append(f"{a} ÷ {b} = {result}")
        return result
    
    def power(self, base: float, exponent: float) -> float:
        result = math.pow(base, exponent)
        self.history.append(f"{base}^{exponent} = {result}")
        return result
    
    def sqrt(self, number: float) -> float:
        if number < 0:
            raise ValueError("Cannot calculate square root of negative number")
        result = math.sqrt(number)
        self.history.append(f"√{number} = {result}")
        return result
    
    def get_history(self) -> List[str]:
        return self.history
    
    def clear_history(self) -> None:
        self.history = []

if __name__ == "__main__":
    calc = Calculator()
    print(calc.add(10, 5))
    print(calc.multiply(3, 4))
    print(calc.get_history())`,
      description: 'an advanced calculator with basic operations, power, square root, and calculation history',
      issues: []
    }
  }

  // Default generic code
  return {
    filename: isJavaScript ? 'app.js' : 'app.py',
    content: isJavaScript ? `// Generated JavaScript Application
console.log('Welcome to CodexOrb!');

class Application {
  constructor(name) {
    this.name = name;
    this.version = '1.0.0';
    this.initialized = false;
  }

  initialize() {
    console.log(\`Initializing \${this.name} v\${this.version}\`);
    this.initialized = true;
    return this;
  }

  processInput(input) {
    if (!this.initialized) {
      throw new Error('Application not initialized');
    }
    
    return input.toString().toUpperCase();
  }

  getStatus() {
    return {
      name: this.name,
      version: this.version,
      initialized: this.initialized,
      timestamp: new Date().toISOString()
    };
  }
}

// Usage example
const app = new Application('CodexOrb Demo');
app.initialize();

console.log('Application Status:', app.getStatus());
console.log('Processed Input:', app.processInput('hello world'));

export default Application;` : `# Generated Python Application
print('Welcome to CodexOrb!')

class Application:
    def __init__(self, name: str):
        self.name = name
        self.version = '1.0.0'
        self.initialized = False
    
    def initialize(self):
        print(f"Initializing {self.name} v{self.version}")
        self.initialized = True
        return self
    
    def process_input(self, input_data):
        if not self.initialized:
            raise RuntimeError('Application not initialized')
        
        return str(input_data).upper()
    
    def get_status(self):
        from datetime import datetime
        return {
            'name': self.name,
            'version': self.version,
            'initialized': self.initialized,
            'timestamp': datetime.now().isoformat()
        }

# Usage example
if __name__ == "__main__":
    app = Application('CodexOrb Demo')
    app.initialize()
    
    print('Application Status:', app.get_status())
    print('Processed Input:', app.process_input('hello world'))`,
    description: 'a basic application structure with initialization and input processing',
    issues: []
  }
}