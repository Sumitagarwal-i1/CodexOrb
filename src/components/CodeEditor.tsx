import React, { useState } from 'react'
import Editor from '@monaco-editor/react'
import { 
  File, 
  Download, 
  Play, 
  AlertCircle, 
  CheckCircle,
  Loader2,
  Edit3,
  Save,
  X,
  Copy,
  ExternalLink
} from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

export function CodeEditor() {
  const { codeFiles, currentSession, darkMode, updateCodeFile } = useAppStore()
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState('')
  const [isRunning, setIsRunning] = useState(false)

  const currentFile = codeFiles.find(f => f.id === selectedFile)

  const handleDownload = () => {
    if (!codeFiles.length) return

    // Create a simple zip-like structure
    const files = codeFiles.map(file => ({
      name: file.filename,
      content: file.content
    }))

    // Create a blob with all files
    const fileContents = files.map(file => 
      `// File: ${file.name}\n${file.content}\n\n${'='.repeat(50)}\n\n`
    ).join('')

    const blob = new Blob([fileContents], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${currentSession?.name || 'project'}-files.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleEdit = () => {
    if (!currentFile) return
    setEditedContent(currentFile.content)
    setIsEditing(true)
  }

  const handleSave = async () => {
    if (!currentFile || !editedContent.trim()) return
    
    try {
      await updateCodeFile(currentFile.id, editedContent)
      setIsEditing(false)
      toast.success('File updated successfully!')
    } catch (error) {
      toast.error('Failed to update file')
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditedContent('')
  }

  const handleCopyCode = async () => {
    if (!currentFile) return
    
    try {
      await navigator.clipboard.writeText(currentFile.content)
      toast.success('Code copied to clipboard!')
    } catch (error) {
      toast.error('Failed to copy code')
    }
  }

  const handleRunCode = async () => {
    if (!currentFile) return
    
    setIsRunning(true)
    
    try {
      // Simulate code execution
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Create a simple output window
      const outputWindow = window.open('', '_blank', 'width=800,height=600')
      if (outputWindow) {
        outputWindow.document.write(`
          <html>
            <head>
              <title>Code Output - ${currentFile.filename}</title>
              <style>
                body { 
                  font-family: 'Fira Code', monospace; 
                  background: #1a1a1a; 
                  color: #fff; 
                  padding: 20px; 
                  margin: 0;
                }
                .header { 
                  border-bottom: 1px solid #333; 
                  padding-bottom: 10px; 
                  margin-bottom: 20px; 
                }
                .output { 
                  background: #000; 
                  padding: 15px; 
                  border-radius: 8px; 
                  white-space: pre-wrap; 
                  font-size: 14px;
                  line-height: 1.5;
                }
              </style>
            </head>
            <body>
              <div class="header">
                <h2>🚀 Code Execution Output</h2>
                <p>File: ${currentFile.filename}</p>
              </div>
              <div class="output">
                <div style="color: #4ade80;">✅ Code executed successfully!</div>
                <div style="color: #94a3b8; margin-top: 10px;">
                  Note: This is a simulated execution environment.
                  In a real implementation, this would run your ${currentFile.language} code.
                </div>
                <div style="margin-top: 20px; color: #fbbf24;">
                  📝 Generated Output:
                  ${currentFile.language === 'javascript' ? 
                    'console.log("Hello from CodexOrb!");' : 
                    'print("Hello from CodexOrb!")'
                  }
                </div>
              </div>
            </body>
          </html>
        `)
        outputWindow.document.close()
      }
      
      toast.success('Code executed successfully!')
    } catch (error) {
      toast.error('Failed to execute code')
    } finally {
      setIsRunning(false)
    }
  }

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-500'
    if (score >= 60) return 'text-yellow-500'
    return 'text-red-500'
  }

  const getHealthIcon = (score: number) => {
    if (score >= 80) return CheckCircle
    return AlertCircle
  }

  if (!currentSession) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <File className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No Active Session
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Create or join a session to view code
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex">
      {/* File Tree */}
      <div className="w-80 border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex flex-col">
        <div className="h-16 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 flex-shrink-0">
          <h2 className="font-medium text-gray-900 dark:text-gray-100">Files</h2>
          <button
            onClick={handleDownload}
            disabled={!codeFiles.length}
            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Download project"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-1">
          {codeFiles.length === 0 ? (
            <div className="text-center py-8">
              <File className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No files generated yet
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Start a conversation to generate code
              </p>
            </div>
          ) : (
            codeFiles.map((file) => {
              const HealthIcon = getHealthIcon(file.health_score)
              return (
                <motion.button
                  key={file.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={() => setSelectedFile(file.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-3 text-sm rounded-lg transition-colors ${
                    selectedFile === file.id
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <File className="w-4 h-4 flex-shrink-0" />
                  <div className="flex-1 text-left truncate">
                    <div className="truncate font-mono font-medium">{file.filename}</div>
                    <div className="flex items-center space-x-2 mt-1">
                      <HealthIcon className={`w-3 h-3 ${getHealthColor(file.health_score)}`} />
                      <span className={`text-xs ${getHealthColor(file.health_score)}`}>
                        {file.health_score.toFixed(0)}%
                      </span>
                      <span className="text-xs text-gray-400">
                        {file.language}
                      </span>
                    </div>
                  </div>
                </motion.button>
              )
            })
          )}
        </div>
      </div>
      
      {/* Editor */}
      <div className="flex-1 flex flex-col">
        {currentFile ? (
          <>
            <div className="h-16 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-6 flex-shrink-0">
              <div className="flex items-center space-x-4">
                <h2 className="font-medium text-gray-900 dark:text-gray-100 font-mono">
                  {currentFile.filename}
                </h2>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    currentFile.health_score >= 80 
                      ? 'bg-green-500' 
                      : currentFile.health_score >= 60 
                        ? 'bg-yellow-500' 
                        : 'bg-red-500'
                  }`}></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Health: {currentFile.health_score.toFixed(0)}%
                  </span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleSave}
                      className="flex items-center space-x-2 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save</span>
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="flex items-center space-x-2 px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                    >
                      <X className="w-4 h-4" />
                      <span>Cancel</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleEdit}
                      className="flex items-center space-x-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={handleCopyCode}
                      className="flex items-center space-x-2 px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                    >
                      <Copy className="w-4 h-4" />
                      <span>Copy</span>
                    </button>
                    <button
                      onClick={handleRunCode}
                      disabled={isRunning}
                      className="flex items-center space-x-2 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors text-sm"
                    >
                      {isRunning ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                      <span>{isRunning ? 'Running...' : 'Run'}</span>
                    </button>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex-1 overflow-hidden">
              <Editor
                height="100%"
                language={currentFile.language}
                value={isEditing ? editedContent : currentFile.content}
                onChange={(value) => isEditing && setEditedContent(value || '')}
                theme={darkMode ? 'vs-dark' : 'light'}
                options={{
                  minimap: { enabled: true },
                  fontSize: 14,
                  fontFamily: 'Fira Code, Menlo, Monaco, monospace',
                  readOnly: !isEditing,
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  wordWrap: 'on',
                  lineNumbers: 'on',
                  folding: true,
                  bracketMatching: 'always',
                  renderWhitespace: 'selection',
                  formatOnPaste: true,
                  formatOnType: true,
                  tabSize: 2,
                  insertSpaces: true,
                  scrollbar: {
                    vertical: 'visible',
                    horizontal: 'visible',
                    verticalScrollbarSize: 8,
                    horizontalScrollbarSize: 8
                  }
                }}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <File className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Select a file to view
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Choose a file from the sidebar to see its content
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}