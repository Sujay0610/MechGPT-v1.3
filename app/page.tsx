'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useChat } from './context/ChatContext'
import { useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import MainLayout from './components/MainLayout'

// Add backend URL configuration
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://api.aigentsify.com'

interface Message {
  id: string
  text: string
  sender: 'user' | 'bot'
  timestamp: Date
}

interface Conversation {
  id: string
  agent_name: string
  title: string
  created_at: string
  updated_at: string
  message_count: number
}

interface Agent {
  id: string
  name: string
  description: string
  extra_instructions: string
  created_at: string
  updated_at: string
}

interface AgentStats {
  agent_name: string
  total_chunks: number
  total_files: number
  files: string[]
  created_at: string
  updated_at: string
  description: string
  extra_instructions: string
}

function ChatPage() {
  const {
    messages,
    conversations,
    currentConversationId,
    addMessage,
    clearMessages,
    loadConversation,
    loadAgentConversations,
    createNewConversation,
    deleteConversation,
    setCurrentConversationId,
    isLoading,
    setIsLoading
  } = useChat()

  const { user } = useAuth()
  const router = useRouter()

  // Helper function to get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token')
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  const [agents, setAgents] = useState<Agent[]>([])
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [agentStats, setAgentStats] = useState<Record<string, AgentStats>>({})
  const [input, setInput] = useState('')
  const [agentsLoading, setAgentsLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newAgentName, setNewAgentName] = useState('')
  const [newAgentDescription, setNewAgentDescription] = useState('')
  const [newAgentInstructions, setNewAgentInstructions] = useState('')
  const [creating, setCreating] = useState(false)
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadMode, setUploadMode] = useState<'files' | 'text' | 'links'>('files')
  const [textContent, setTextContent] = useState('')
  const [textTitle, setTextTitle] = useState('')
  const [linkUrls, setLinkUrls] = useState('')
  const [showConversations, setShowConversations] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [agentToDelete, setAgentToDelete] = useState<Agent | null>(null)
  const [deleting, setDeleting] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Handle Supabase authentication redirects
  useEffect(() => {
    const handleSupabaseAuth = () => {
      if (typeof window !== 'undefined') {
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        const type = hashParams.get('type')
        const error = hashParams.get('error')
        const errorDescription = hashParams.get('error_description')

        if (error) {
          console.error('Supabase auth error:', error, errorDescription)
          router.push('/auth/login?error=' + encodeURIComponent(errorDescription || error))
          return
        }

        if (accessToken && type) {
          // Clear the hash from URL
          window.history.replaceState(null, '', window.location.pathname)
          
          if (type === 'recovery') {
            // Password reset - redirect to reset password page
            router.push('/auth/reset-password#' + window.location.hash.substring(1))
            return
          } else if (type === 'signup') {
            // Email confirmation - redirect to login with success message
            router.push('/auth/login?confirmed=true')
            return
          }
        }
      }
    }

    handleSupabaseAuth()
    fetchAgents()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchAgents = async () => {
    try {
      const response = await axios.get('/api/agents', {
        headers: getAuthHeaders()
      })
      setAgents(response.data)
      
      // Fetch stats for each agent
      const statsPromises = response.data.map(async (agent: Agent) => {
        try {
          const statsResponse = await axios.get(`/api/agents/${agent.name}/stats`, {
            headers: getAuthHeaders()
          })
          return { [agent.name]: statsResponse.data }
        } catch (error) {
          console.error(`Error fetching stats for agent ${agent.name}:`, error)
          return { [agent.name]: {
            agent_name: agent.name,
            total_chunks: 0,
            total_files: 0,
            files: [],
            created_at: agent.created_at,
            updated_at: agent.updated_at,
            description: agent.description,
            extra_instructions: agent.extra_instructions
          }}
        }
      })
      
      const statsResults = await Promise.all(statsPromises)
      const statsMap = statsResults.reduce((acc, stat) => ({ ...acc, ...stat }), {})
      setAgentStats(statsMap)
    } catch (error) {
      console.error('Error fetching agents:', error)
    } finally {
      setAgentsLoading(false)
    }
  }

  const createAgent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newAgentName.trim()) return
    
    setCreating(true)
    try {
      await axios.post('/api/agents', {
        name: newAgentName,
        description: newAgentDescription,
        extra_instructions: newAgentInstructions
      }, {
        headers: getAuthHeaders()
      })
      
      // Wait for backend to fully initialize the agent
      await fetchAgents()
      
      setNewAgentName('')
      setNewAgentDescription('')
      setNewAgentInstructions('')
      setShowCreateForm(false)
    } catch (error) {
      console.error('Error creating agent:', error)
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteAgent = (agent: Agent, e: React.MouseEvent) => {
    e.stopPropagation()
    setAgentToDelete(agent)
    setShowDeleteConfirm(true)
  }

  const confirmDeleteAgent = async () => {
    if (!agentToDelete) return
    
    setDeleting(true)
    try {
      await axios.delete(`/api/agents/${agentToDelete.name}`, {
        headers: getAuthHeaders()
      })
      
      if (selectedAgent?.name === agentToDelete.name) {
        setSelectedAgent(null)
        setShowConversations(false)
        clearMessages()
      }
      
      fetchAgents()
      setShowDeleteConfirm(false)
      setAgentToDelete(null)
    } catch (error) {
      console.error('Error deleting agent:', error)
    } finally {
      setDeleting(false)
    }
  }

  const cancelDeleteAgent = () => {
    setShowDeleteConfirm(false)
    setAgentToDelete(null)
  }

  const selectAgent = async (agent: Agent) => {
    setSelectedAgent(agent)
    setShowConversations(true)
    clearMessages()
    try {
      await loadAgentConversations(agent.name)
    } catch (error) {
      console.error('Error loading conversations:', error)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files))
    }
  }

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (e.dataTransfer.files) {
      setSelectedFiles(Array.from(e.dataTransfer.files))
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  const [uploadProgress, setUploadProgress] = useState('')
  const [uploadResult, setUploadResult] = useState('')
  const [showUploadStatus, setShowUploadStatus] = useState(false)
  const [uploadingAgent, setUploadingAgent] = useState<string | null>(null)

  const pollJobStatus = async (jobId: string, agentName: string) => {
    const maxAttempts = 120 // 10 minutes with 5-second intervals
    let attempts = 0
    
    const poll = async (): Promise<void> => {
      try {
        // Call backend directly instead of Netlify proxy
        const response = await axios.get(`${BACKEND_URL}/api/agents/${agentName}/upload/status/${jobId}`, {
          headers: getAuthHeaders()
        })
        const status = response.data
        
        // Create detailed progress text
        const progressDetails = [
          `Status: ${status.status}`,
          `Progress: ${status.progress}/${status.total_files} files`,
          `Processed: ${status.processed_files?.length || 0}`,
          `Skipped: ${status.skipped_files?.length || 0}`,
          `Failed: ${status.failed_files?.length || 0}`,
          '',
          status.message || 'Processing...'
        ].join('\n')
        
        setUploadProgress(progressDetails)
        
        if (status.status === 'completed') {
          setUploadResult(status.message)
          setUploading(false)
          setUploadingAgent(null)
          await fetchAgents() // Refresh agents
          
          // Hide upload status after 8 seconds
          setTimeout(() => {
            setShowUploadStatus(false)
            setUploadProgress('')
            setUploadResult('')
          }, 8000)
          return
        }
        
        if (status.status === 'failed') {
          setUploadResult(`Processing failed: ${status.message}`)
          setUploading(false)
          setUploadingAgent(null)
          
          // Hide upload status after 12 seconds for errors
          setTimeout(() => {
            setShowUploadStatus(false)
            setUploadProgress('')
            setUploadResult('')
          }, 12000)
          return
        }
        
        // Continue polling if still processing
        if (status.status === 'processing' && attempts < maxAttempts) {
          attempts++
          setTimeout(poll, 3000) // Poll every 3 seconds
        } else if (attempts >= maxAttempts) {
          setUploadResult('Status check timed out. Files may still be processing.')
          setUploading(false)
          setUploadingAgent(null)
        }
      } catch (error) {
        console.error('Error polling job status:', error)
        setUploadResult('Error checking upload status')
        setUploading(false)
        setUploadingAgent(null)
        
        setTimeout(() => {
          setShowUploadStatus(false)
          setUploadProgress('')
          setUploadResult('')
        }, 10000)
      }
    }
    
    poll()
  }

  const uploadFiles = async () => {
    if (!selectedAgent || selectedFiles.length === 0) return
    
    setUploading(true)
    setUploadingAgent(selectedAgent.name)
    setShowUploadStatus(true)
    setUploadProgress('')
    setUploadResult('')
    
    try {
      const formData = new FormData()
      selectedFiles.forEach(file => {
        formData.append('files', file)
      })
      
      // Call backend directly instead of Netlify proxy
      const response = await axios.post(
        `${BACKEND_URL}/api/agents/${selectedAgent.name}/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            ...getAuthHeaders()
          }
        }
      )
      
      const { job_id } = response.data
      
      // Close modal after 5 seconds
      setSelectedFiles([])
      setTimeout(() => {
        setShowUploadForm(false)
      }, 5000)
      
      if (job_id) {
        // Start polling for job status
        pollJobStatus(job_id, selectedAgent.name)
      } else {
        setUploadResult('Upload completed successfully!')
        setUploading(false)
        setUploadingAgent(null)
        fetchAgents()
        
        setTimeout(() => {
          setShowUploadStatus(false)
          setUploadProgress('')
          setUploadResult('')
        }, 5000)
      }
    } catch (error) {
      console.error('Error uploading files:', error)
      setUploadResult('Upload failed. Please try again.')
      setUploading(false)
      setUploadingAgent(null)
      
      setTimeout(() => {
        setShowUploadStatus(false)
        setUploadProgress('')
        setUploadResult('')
      }, 10000)
    }
  }

  const uploadText = async () => {
    if (!selectedAgent || !textContent.trim()) return
    
    setUploading(true)
    setUploadingAgent(selectedAgent.name)
    setShowUploadStatus(true)
    setUploadProgress('')
    setUploadResult('')
    
    try {
      // Call backend directly instead of Netlify proxy
      const response = await axios.post(
        `${BACKEND_URL}/api/agents/${selectedAgent.name}/upload-text`,
        {
          content: textContent,
          title: textTitle || 'Text Content'
        },
        {
          headers: getAuthHeaders()
        }
      )
      
      const { job_id } = response.data
      
      // Close modal after 5 seconds
      setTextContent('')
      setTextTitle('')
      setTimeout(() => {
        setShowUploadForm(false)
      }, 5000)
      
      if (job_id) {
        pollJobStatus(job_id, selectedAgent.name)
      } else {
        setUploadResult('Text processed successfully!')
        setUploading(false)
        setUploadingAgent(null)
        fetchAgents()
        
        setTimeout(() => {
          setShowUploadStatus(false)
          setUploadProgress('')
          setUploadResult('')
        }, 5000)
      }
    } catch (error) {
      console.error('Error uploading text:', error)
      setUploadResult('Text processing failed. Please try again.')
      setUploading(false)
      setUploadingAgent(null)
      
      setTimeout(() => {
        setShowUploadStatus(false)
        setUploadProgress('')
        setUploadResult('')
      }, 10000)
    }
  }

  const uploadLinks = async () => {
    if (!selectedAgent || !linkUrls.trim()) return
    
    setUploading(true)
    setUploadingAgent(selectedAgent.name)
    setShowUploadStatus(true)
    setUploadProgress('')
    setUploadResult('')
    
    try {
      const urls = linkUrls.split('\n').filter(url => url.trim())
      
      // Call backend directly instead of Netlify proxy
      const response = await axios.post(
        `${BACKEND_URL}/api/agents/${selectedAgent.name}/upload-links`,
        { urls },
        {
          headers: getAuthHeaders()
        }
      )
      
      const { job_id } = response.data
      
      // Close modal after 5 seconds
      setLinkUrls('')
      setTimeout(() => {
        setShowUploadForm(false)
      }, 5000)
      
      if (job_id) {
        pollJobStatus(job_id, selectedAgent.name)
      } else {
        setUploadResult('Links processed successfully!')
        setUploading(false)
        setUploadingAgent(null)
        fetchAgents()
        
        setTimeout(() => {
          setShowUploadStatus(false)
          setUploadProgress('')
          setUploadResult('')
        }, 5000)
      }
    } catch (error) {
      console.error('Error uploading links:', error)
      setUploadResult('Link processing failed. Please try again.')
      setUploading(false)
      setUploadingAgent(null)
      
      setTimeout(() => {
        setShowUploadStatus(false)
        setUploadProgress('')
        setUploadResult('')
      }, 10000)
    }
  }

  const handleUpload = () => {
    switch (uploadMode) {
      case 'files':
        uploadFiles()
        break
      case 'text':
        uploadText()
        break
      case 'links':
        uploadLinks()
        break
    }
  }

  const removeFile = (index: number) => {
    setSelectedFiles(files => files.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || !selectedAgent || isLoading) return
    
    const userMessage = input.trim()
    setInput('')
    setIsLoading(true)
    
    try {
      addMessage(userMessage, 'user')
      
      const response = await axios.post(
        `/api/agents/${selectedAgent.name}/chat`,
        {
          message: userMessage,
          conversation_id: currentConversationId
        },
        {
          headers: getAuthHeaders()
        }
      )
      
      addMessage(response.data.response, 'bot')
      
      if (response.data.conversation_id && response.data.conversation_id !== currentConversationId) {
        setCurrentConversationId(response.data.conversation_id)
        await loadAgentConversations(selectedAgent.name)
      }
    } catch (error) {
      console.error('Error sending message:', error)
      addMessage('Sorry, I encountered an error. Please try again.', 'bot')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="page-container flex h-[calc(100vh-8rem)] max-w-7xl mx-auto">
      {/* Upload Status Indicator - Removed as we now use bottom-right popup only */}

      {/* Sidebar */}
      <div className="w-72 bg-gray-800 border-r border-gray-700 flex flex-col shadow-lg">
        {/* Header */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold text-gray-100">
              {selectedAgent && showConversations ? 'Conversations' : 'Agents'}
            </h2>
            <div className="flex space-x-2">
              {selectedAgent && showConversations && (
                <button
                  onClick={createNewConversation}
                  className="animated-button bg-blue-800 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-900 shadow-sm"
                >
                  💬 New Chat
                </button>
              )}
              {!(selectedAgent && showConversations) && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="animated-button bg-blue-800 text-white px-3 py-1 rounded text-sm hover:bg-blue-900"
                >
                  + Agent
                </button>
              )}
            </div>
          </div>
          <p className="text-sm text-gray-400">
            {selectedAgent && showConversations 
              ? `Chat history for ${selectedAgent.name}` 
              : 'Select an agent to chat with'}
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {selectedAgent && showConversations ? (
            // Conversations List
            <div className="p-2">
              {conversations.length === 0 ? (
                <div className="p-4 text-center">
                  <div className="text-gray-500 text-3xl mb-2">💬</div>
                  <p className="text-sm text-gray-400 mb-3">No conversations yet</p>
                  <button
                    onClick={createNewConversation}
                    className="animated-button bg-blue-800 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-900 shadow-sm"
                  >
                    💬 Start First Chat
                  </button>
                </div>
              ) : (
                conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`p-3 mb-2 rounded-lg cursor-pointer transition-colors ${
                      currentConversationId === conversation.id
                        ? 'bg-blue-800 bg-opacity-50 border border-blue-600'
                        : 'bg-gray-700 hover:bg-gray-600 border border-gray-600'
                    }`}
                    onClick={() => {
                      if (currentConversationId !== conversation.id) {
                        loadConversation(conversation.id)
                      }
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-100 truncate">{conversation.title}</h3>
                        <p className="text-xs text-gray-400 mt-1">{conversation.message_count} messages</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            // Agents List
            agentsLoading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-800"></div>
              </div>
            ) : agents.length === 0 ? (
              <div className="p-4 text-center">
                <div className="text-gray-500 text-3xl mb-2">🤖</div>
                <p className="text-sm text-gray-400 mb-3">No agents yet</p>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="animated-button bg-blue-800 text-white px-3 py-2 rounded text-sm hover:bg-blue-900"
                >
                  Create First Agent
                </button>
              </div>
            ) : (
              <div className="p-2">
                {agents.map((agent) => {
                  const stats = agentStats[agent.name]
                  return (
                    <div
                      key={agent.id}
                      className={`p-3 mb-2 rounded-lg cursor-pointer transition-colors relative group ${
                        selectedAgent?.id === agent.id
                          ? 'bg-blue-800 bg-opacity-50 border border-blue-600'
                          : 'bg-gray-700 hover:bg-gray-600 border border-gray-600'
                      }`}
                      onClick={() => selectAgent(agent)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-100 truncate">{agent.name}</h3>
                          <p className="text-xs text-gray-400 mt-1 line-clamp-2">{agent.description}</p>
                          {stats && (
                            <div className="flex items-center space-x-3 mt-2 text-xs text-gray-500">
                              <span>📄 {stats.total_files} files</span>
                              <span>📝 {stats.total_chunks} chunks</span>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={(e) => handleDeleteAgent(agent, e)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 text-sm ml-2"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col chat-widget m-4">
        {selectedAgent ? (
          <>
            {/* Chat Header */}
            <div className="chat-widget-header">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <span className="text-lg">🤖</span>
                  </div>
                  <div>
                    <h1 className="text-lg font-semibold">{selectedAgent.name}</h1>
                    <p className="text-sm text-gray-300 opacity-90">{selectedAgent.description}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-xs text-gray-300 bg-gray-600 bg-opacity-50 px-2 py-1 rounded-full">
                    {agentStats[selectedAgent.name]?.total_files || 0} files
                  </div>
                  <button
                    onClick={() => setShowUploadForm(true)}
                    disabled={!!uploadingAgent && uploadingAgent !== selectedAgent.name}
                    className={`animated-button px-3 py-1.5 rounded-lg text-sm ${
                      uploadingAgent && uploadingAgent !== selectedAgent.name
                        ? 'bg-gray-400 text-gray-600 cursor-not-allowed opacity-50'
                        : 'bg-white bg-opacity-20 hover:bg-opacity-30 text-white'
                    }`}
                  >
                    📁 Upload
                  </button>
                  <button
                    onClick={() => {
                      setSelectedAgent(null)
                      setShowConversations(false)
                      clearMessages()
                      setCurrentConversationId(null)
                    }}
                    disabled={!!uploadingAgent && uploadingAgent !== selectedAgent.name}
                    className={`animated-button px-3 py-1.5 rounded-lg text-sm ${
                      uploadingAgent && uploadingAgent !== selectedAgent.name
                        ? 'bg-gray-400 text-gray-600 cursor-not-allowed opacity-50'
                        : 'bg-white bg-opacity-20 hover:bg-opacity-30 text-white'
                    }`}
                  >
                    ← Back
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="chat-widget-messages">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-4">
                    <span className="text-2xl">🤖</span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Start a conversation with {selectedAgent.name}</h3>
                  <p className="text-gray-300 opacity-75 max-w-md">
                    {selectedAgent.description}
                  </p>
                  {selectedAgent.extra_instructions && (
                    <div className="mt-4 p-3 bg-gray-600 bg-opacity-50 rounded-lg max-w-md">
                      <p className="text-sm text-gray-200">
                        <strong>Special Instructions:</strong> {selectedAgent.extra_instructions}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`message-bubble ${
                          message.sender === 'user' ? 'user-message' : 'bot-message'
                        }`}
                      >
                        {message.sender === 'user' ? (
                          <p className="text-sm">{message.text}</p>
                        ) : (
                          <div className="text-sm prose prose-sm max-w-none">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                p: ({children}) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                                ul: ({children}) => <ul className="list-disc list-inside mb-3 space-y-1 pl-2">{children}</ul>,
                                ol: ({children}) => <ol className="list-decimal list-inside mb-3 space-y-1 pl-2">{children}</ol>,
                                li: ({children}) => <li className="text-sm leading-relaxed">{children}</li>,
                                strong: ({children}) => <strong className="font-semibold text-gray-100">{children}</strong>,
                                em: ({children}) => <em className="italic text-gray-100">{children}</em>,
                                code: ({children}) => <code className="bg-gray-700 text-gray-200 px-2 py-1 rounded text-xs font-mono border border-gray-600">{children}</code>,
                                pre: ({children}) => <pre className="bg-gray-800 text-gray-200 p-3 rounded-lg border border-gray-600 overflow-x-auto mb-3">{children}</pre>,
                                blockquote: ({children}) => <blockquote className="border-l-4 border-gray-600 pl-4 py-2 bg-gray-700 rounded-r mb-3 italic">{children}</blockquote>,
                                h1: ({children}) => <h1 className="text-lg font-bold mb-3 text-gray-100 border-b border-gray-600 pb-1">{children}</h1>,
                                h2: ({children}) => <h2 className="text-base font-bold mb-2 text-gray-100">{children}</h2>,
                                h3: ({children}) => <h3 className="text-sm font-bold mb-2 text-gray-200">{children}</h3>,
                                a: ({href, children}) => (
                                  <a 
                                    href={href} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-400 hover:text-blue-300 underline decoration-blue-400 hover:decoration-blue-300 transition-colors duration-200 font-medium"
                                  >
                                    {children}
                                    <span className="inline-block ml-1 text-xs">↗</span>
                                  </a>
                                ),
                                table: ({children}) => (
                                  <div className="overflow-x-auto mb-4">
                                    <table className="min-w-full border border-gray-600 rounded-lg">
                                      {children}
                                    </table>
                                  </div>
                                ),
                                thead: ({children}) => (
                                  <thead className="bg-gray-700">
                                    {children}
                                  </thead>
                                ),
                                tbody: ({children}) => (
                                  <tbody className="bg-gray-800">
                                    {children}
                                  </tbody>
                                ),
                                tr: ({children}) => (
                                  <tr className="border-b border-gray-600 hover:bg-gray-750">
                                    {children}
                                  </tr>
                                ),
                                th: ({children}) => (
                                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-100 border-r border-gray-600 last:border-r-0">
                                    {children}
                                  </th>
                                ),
                                td: ({children}) => (
                                  <td className="px-4 py-2 text-xs text-gray-200 border-r border-gray-600 last:border-r-0">
                                    {children}
                                  </td>
                                ),
                              }}
                            >
                              {message.text}
                            </ReactMarkdown>
                          </div>
                        )}
                        <p className="text-xs opacity-70 mt-1">
                          {typeof window !== 'undefined' ? message.timestamp.toLocaleTimeString() : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="message-bubble bot-message">
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                          <span className="text-sm">Thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="chat-widget-input">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={`Message ${selectedAgent.name}...`}
                  className="flex-1 px-4 py-3 bg-gray-600 bg-opacity-50 border border-gray-500 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-800 focus:border-transparent"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="animated-button bg-blue-800 text-white px-6 py-3 rounded-lg hover:bg-blue-900 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send
                </button>
              </div>
            </form>
          </>
        ) : agents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-6">
              <span className="text-3xl">🤖</span>
            </div>
            <h2 className="text-2xl font-bold mb-4">Welcome to MechAgent</h2>
            <p className="text-gray-300 opacity-75 max-w-md mb-6">
              Create or select an AI agent to start chatting. Upload documents to give your agents knowledge about specific topics.
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="animated-button bg-blue-800 text-white px-6 py-3 rounded-lg hover:bg-blue-900"
            >
              Create Your First Agent
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-6">
              <span className="text-3xl">🤖</span>
            </div>
            <h2 className="text-2xl font-bold mb-4">Select an Agent</h2>
            <p className="text-gray-300 opacity-75 max-w-md mb-6">
              Choose an agent from the sidebar to start chatting.
            </p>
          </div>
        )}
      </div>

      {/* Create Agent Modal */}
      {showCreateForm && (
        <div className="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="modal-content bg-gray-800 rounded-lg p-6 w-full max-w-md border border-gray-700">
            <h2 className="text-xl font-bold mb-4 text-gray-100">Create New Agent</h2>
            <form onSubmit={createAgent}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Agent Name *
                </label>
                <input
                  type="text"
                  value={newAgentName}
                  onChange={(e) => setNewAgentName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-800"
                  placeholder="Enter agent name"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={newAgentDescription}
                  onChange={(e) => setNewAgentDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-800"
                  placeholder="Describe what this agent does"
                  rows={3}
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Extra Instructions
                </label>
                <textarea
                  value={newAgentInstructions}
                  onChange={(e) => setNewAgentInstructions(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-800"
                  placeholder="Additional instructions for the agent's behavior"
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false)
                    setNewAgentName('')
                    setNewAgentDescription('')
                    setNewAgentInstructions('')
                  }}
                  className="px-4 py-2 text-gray-400 hover:text-gray-200 bg-transparent hover:bg-gray-700 rounded-lg transition-colors"
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newAgentName.trim() || creating}
                  className="animated-button bg-blue-800 text-white px-4 py-2 rounded-lg hover:bg-blue-900 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? 'Creating...' : 'Create Agent'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadForm && selectedAgent && (
        <div className="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="modal-content bg-gray-800 rounded-lg p-6 w-full max-w-2xl border border-gray-700 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-100">Upload Content to {selectedAgent?.name || 'Agent'}</h2>
              <button
                onClick={() => {
                  setShowUploadForm(false)
                  setSelectedFiles([])
                  setTextContent('')
                  setTextTitle('')
                  setLinkUrls('')
                  setUploadProgress('')
                  setUploadResult('')
                }}
                className="text-gray-400 hover:text-gray-200 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-700 transition-colors"
              >
                ×
              </button>
            </div>
            
            {/* Upload Mode Tabs */}
            <div className="flex border-b mb-4">
              <button
                onClick={() => setUploadMode('files')}
                className={`px-4 py-2 font-medium ${uploadMode === 'files' ? 'border-b-2 border-blue-800 text-blue-300' : 'text-gray-400 hover:text-gray-200'}`}
              >
                Files
              </button>
              <button
                onClick={() => setUploadMode('text')}
                className={`px-4 py-2 font-medium ${uploadMode === 'text' ? 'border-b-2 border-blue-800 text-blue-300' : 'text-gray-400 hover:text-gray-200'}`}
              >
                Text/Markdown
              </button>
              <button
                onClick={() => setUploadMode('links')}
                className={`px-4 py-2 font-medium ${uploadMode === 'links' ? 'border-b-2 border-blue-800 text-blue-300' : 'text-gray-400 hover:text-gray-200'}`}
              >
                Links
              </button>
            </div>

            {/* File Upload Mode */}
            {uploadMode === 'files' && (
              <>
                {/* File Drop Zone */}
                <div
                  onDrop={handleFileDrop}
                  onDragOver={handleDragOver}
                  className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center mb-4 hover:border-blue-800 transition-colors bg-gray-700"
                >
                  <div className="text-gray-400 text-4xl mb-4">📄</div>
                  <p className="text-gray-300 mb-2">Drag and drop PDF files here, or</p>
                  <label className="animated-button bg-blue-800 text-white px-4 py-2 rounded-lg hover:bg-blue-900 cursor-pointer inline-block">
                    Choose Files
                    <input
                      type="file"
                      multiple
                      accept=".pdf"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                  <p className="text-sm text-gray-400 mt-2">Only PDF files are supported</p>
                </div>

                {/* Selected Files List */}
                {selectedFiles.length > 0 && (
                  <div className="mb-4">
                    <h3 className="font-medium mb-2 text-gray-300">Selected Files ({selectedFiles.length})</h3>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-700 p-2 rounded border border-gray-600">
                          <div className="flex items-center space-x-2">
                            <span className="text-red-500">📄</span>
                            <span className="text-sm text-gray-200">{file.name}</span>
                            <span className="text-xs text-gray-400">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                          </div>
                          <button
                            onClick={() => removeFile(index)}
                            className="text-red-500 hover:text-red-700 text-sm"
                            disabled={uploading}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Text Upload Mode */}
            {uploadMode === 'text' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Title (optional)
                  </label>
                  <input
                    type="text"
                    value={textTitle}
                    onChange={(e) => setTextTitle(e.target.value)}
                    placeholder="Enter a title for this content"
                    className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Content *
                  </label>
                  <textarea
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    placeholder="Enter your text or markdown content here..."
                    rows={12}
                    className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-800 resize-vertical"
                  />
                  <p className="text-sm text-gray-400 mt-1">Supports plain text and Markdown formatting</p>
                </div>
              </div>
            )}

            {/* Links Upload Mode */}
            {uploadMode === 'links' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    URLs to Crawl *
                  </label>
                  <textarea
                    value={linkUrls}
                    onChange={(e) => setLinkUrls(e.target.value)}
                    placeholder="Enter URLs, one per line:\nhttps://example.com/page1\nhttps://example.com/page2"
                    rows={8}
                    className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-800 resize-vertical"
                  />
                  <p className="text-sm text-gray-400 mt-1">Enter one URL per line. The content will be crawled and processed automatically.</p>
                </div>
              </div>
            )}

            {/* Upload Progress */}
            {uploading && (
              <div className="mb-4">
                <div className="bg-gray-700 border border-gray-600 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-800"></div>
                    <span className="text-sm font-medium text-gray-200">
                      {uploadMode === 'files' && `Processing ${selectedFiles.length} file${selectedFiles.length !== 1 ? 's' : ''}...`}
                      {uploadMode === 'text' && 'Processing text content...'}
                      {uploadMode === 'links' && 'Crawling and processing links...'}
                    </span>
                  </div>
                  {uploadProgress && (
                    <div className="text-xs text-gray-300 whitespace-pre-line">
                      {uploadProgress}
                    </div>
                  )}
                  {!uploadProgress && uploadMode === 'files' && (
                    <div className="text-xs text-gray-300">
                      <div>• Uploading files to server</div>
                      <div>• Parsing PDFs with LlamaParse</div>
                      <div>• Creating text chunks and embeddings</div>
                      <div>• Indexing in knowledge base</div>
                      <div className="mt-1 font-medium">This may take several minutes for large files or batches.</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Upload Result */}
            {uploadResult && (
              <div className="mb-4">
                <div className={`border rounded-lg p-4 ${
                  uploadResult.includes('failed') || uploadResult.includes('error') 
                    ? 'bg-red-900 border-red-600 text-red-200' 
                    : 'bg-green-900 border-green-600 text-green-200'
                }`}>
                  <div className="text-sm whitespace-pre-line">{uploadResult}</div>
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowUploadForm(false)
                  setSelectedFiles([])
                  setTextContent('')
                  setTextTitle('')
                  setLinkUrls('')
                  setUploadProgress('')
                  setUploadResult('')
                }}
                className="px-4 py-2 text-gray-400 hover:text-gray-200 bg-transparent hover:bg-gray-700 rounded-lg transition-colors"
                disabled={uploading}
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={(
                  (uploadMode === 'files' && selectedFiles.length === 0) ||
                  (uploadMode === 'text' && !textContent.trim()) ||
                  (uploadMode === 'links' && !linkUrls.trim())
                ) || uploading}
                className="animated-button bg-blue-800 text-white px-4 py-2 rounded-lg hover:bg-blue-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploadMode === 'files' && (uploading ? 'Uploading...' : `Upload ${selectedFiles.length} File${selectedFiles.length !== 1 ? 's' : ''}`)}
                {uploadMode === 'text' && (uploading ? 'Processing...' : 'Process Text')}
                {uploadMode === 'links' && (uploading ? 'Crawling...' : 'Crawl & Process Links')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
          <div className="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="modal-content bg-gray-800 rounded-lg p-6 w-full max-w-md border border-gray-700">
            <h2 className="text-xl font-bold mb-4 text-red-400">Delete Agent</h2>
            <div className="mb-6">
              <p className="text-gray-300 mb-2">
                Are you sure you want to delete the agent <strong className="text-gray-100">"{agentToDelete?.name}"</strong>?
              </p>
              <p className="text-sm text-red-400">
                This action cannot be undone. All uploaded files, conversations, and knowledge base data for this agent will be permanently deleted.
              </p>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={cancelDeleteAgent}
                className="px-4 py-2 text-gray-400 hover:text-gray-200 bg-transparent hover:bg-gray-700 rounded-lg transition-colors"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteAgent}
                disabled={deleting}
                className="animated-button bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? 'Deleting...' : 'Delete Agent'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Status Popup */}
      {showUploadStatus && (
        <div className="fixed bottom-4 right-4 bg-gray-900 border border-gray-600 rounded-lg shadow-2xl z-40 w-96 max-w-sm">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-100">
                Processing - {uploadingAgent}
              </h3>
              <button
                onClick={() => setShowUploadStatus(false)}
                disabled={uploading}
                className={`text-sm rounded p-1 ${
                  uploading 
                    ? 'text-gray-600 cursor-not-allowed opacity-50' 
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                }`}
              >
                ✕
              </button>
            </div>
            
            {uploading && (
              <div className="flex items-center space-x-2 mb-3">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                <span className="text-xs text-blue-300 font-medium">Processing...</span>
              </div>
            )}
            
            {uploadProgress && (
              <div className="mb-3">
                <div className="text-xs text-gray-200 whitespace-pre-line bg-gray-800 p-3 rounded border border-gray-700 max-h-40 overflow-y-auto font-mono">
                  {uploadProgress}
                </div>
              </div>
            )}
            
            {uploadResult && (
              <div className="mb-2">
                <div className={`text-xs p-3 rounded border font-medium ${
                  uploadResult.includes('failed') || uploadResult.includes('error') 
                    ? 'bg-red-900 border-red-600 text-red-200' 
                    : 'bg-green-900 border-green-600 text-green-200'
                }`}>
                  {uploadResult}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function ProtectedChatPage() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <ChatPage />
      </MainLayout>
    </ProtectedRoute>
  )
}