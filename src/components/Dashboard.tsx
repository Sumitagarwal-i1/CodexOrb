import React from 'react'
import { 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Users, 
  Clock,
  Code,
  Bug
} from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { motion } from 'framer-motion'

export function Dashboard() {
  const { codeFiles, messages, currentSession } = useAppStore()

  const stats = {
    totalFiles: codeFiles.length,
    totalLines: codeFiles.reduce((sum, file) => sum + file.content.split('\n').length, 0),
    averageHealth: codeFiles.length > 0 
      ? codeFiles.reduce((sum, file) => sum + file.health_score, 0) / codeFiles.length 
      : 0,
    healthyFiles: codeFiles.filter(file => file.health_score >= 80).length,
    warningFiles: codeFiles.filter(file => file.health_score >= 60 && file.health_score < 80).length,
    issueFiles: codeFiles.filter(file => file.health_score < 60).length,
    totalMessages: messages.length,
    aiMessages: messages.filter(msg => msg.type === 'ai').length
  }

  const StatCard = ({ title, value, icon: Icon, color = 'text-gray-900 dark:text-gray-100' }: any) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
        </div>
        <Icon className={`w-8 h-8 ${color}`} />
      </div>
    </motion.div>
  )

  if (!currentSession) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No Active Session
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Create or join a session to view analytics
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Real-time analytics for {currentSession.name}
          </p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Files"
            value={stats.totalFiles}
            icon={Code}
          />
          <StatCard
            title="Lines of Code"
            value={stats.totalLines.toLocaleString()}
            icon={BarChart3}
          />
          <StatCard
            title="Average Health"
            value={`${stats.averageHealth.toFixed(0)}%`}
            icon={TrendingUp}
            color={stats.averageHealth >= 80 ? 'text-green-500' : stats.averageHealth >= 60 ? 'text-yellow-500' : 'text-red-500'}
          />
          <StatCard
            title="Chat Messages"
            value={stats.totalMessages}
            icon={Users}
          />
        </div>

        {/* Health Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Code Health Distribution
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700 dark:text-gray-300">Healthy Files</span>
                </div>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {stats.healthyFiles}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  <span className="text-gray-700 dark:text-gray-300">Warning Files</span>
                </div>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {stats.warningFiles}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Bug className="w-5 h-5 text-red-500" />
                  <span className="text-gray-700 dark:text-gray-300">Issue Files</span>
                </div>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {stats.issueFiles}
                </span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Session Activity
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Users className="w-5 h-5 text-blue-500" />
                  <span className="text-gray-700 dark:text-gray-300">Total Messages</span>
                </div>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {stats.totalMessages}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <BarChart3 className="w-5 h-5 text-purple-500" />
                  <span className="text-gray-700 dark:text-gray-300">AI Responses</span>
                </div>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {stats.aiMessages}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-gray-500" />
                  <span className="text-gray-700 dark:text-gray-300">Language</span>
                </div>
                <span className="font-semibold text-gray-900 dark:text-gray-100 capitalize">
                  {currentSession.language}
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* File List */}
        {codeFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Recent Files
            </h3>
            <div className="space-y-3">
              {codeFiles.slice(0, 5).map((file) => (
                <div key={file.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                  <div className="flex items-center space-x-3">
                    <Code className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900 dark:text-gray-100 font-mono text-sm">
                      {file.filename}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      file.health_score >= 80 ? 'bg-green-500' : 
                      file.health_score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {file.health_score.toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}