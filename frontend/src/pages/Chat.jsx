import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import './Chat.css'

export default function Chat() {
  const navigate = useNavigate()
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode')
    return saved ? JSON.parse(saved) : false
  })

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showNewChatModal, setShowNewChatModal] = useState(false)
  const [newChatName, setNewChatName] = useState('')
  const [chats, setChats] = useState([])
  const [selectedChat, setSelectedChat] = useState(null)
  const [messages, setMessages] = useState([])
  const [messageInput, setMessageInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef(null)

  const [userInfo, setUserInfo] = useState({
    name: 'User',
    email: 'user@example.com',
    plan: 'Free Plan',
    avatar: 'U',
  })

  // Dark mode effect
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode))
    if (isDarkMode) {
      document.documentElement.setAttribute('data-theme', 'dark')
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
  }, [isDarkMode])

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Fetch chats on mount
  useEffect(() => {
    // Small delay to ensure localStorage is updated
    setTimeout(() => {
      fetchUserInfo()
      fetchChats()
    }, 100)
  }, [])

  // Fetch user info from localStorage or API
  const fetchUserInfo = async () => {
    try {
      const userData = localStorage.getItem('userInfo')
      // console.log('Raw userData from localStorage:', userData)
      if (userData) {
        const parsed = JSON.parse(userData)
        // console.log('Parsed userData:', parsed)
        setUserInfo({
          name: parsed.firstName || 'User',
          email: parsed.email || 'user@example.com',
          plan: 'Free Plan',
          avatar: (parsed.firstName?.[0] || 'U').toUpperCase(),
        })
      }
    } catch (error) {
      console.log('User info not found', error)
    }
  }

  // Fetch all chats
  const fetchChats = async () => {
    try {
      setIsLoading(true)
      const response = await axios.get('http://localhost:3000/api/chat/chats', {
        withCredentials: true,
      })
      if (response.data.chats && response.data.chats.length > 0) {
        setChats(response.data.chats)
        // Load messages for first chat
        loadChatMessages(response.data.chats[0])
        setSelectedChat(response.data.chats[0])
      }
    } catch (error) {
      console.log('No chats found, create one to start')
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch messages for a specific chat
  const loadChatMessages = async (chat) => {
    try {
      const response = await axios.get(`http://localhost:3000/api/chat/chats/${chat._id}/messages`, {
        withCredentials: true,
      })
      setMessages(response.data.messages || [])
    } catch (error) {
      console.log('Error loading messages:', error.message)
      setMessages([])
    }
  }

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
  }

  const handleLogout = () => {
    localStorage.removeItem('userInfo')
    localStorage.removeItem('darkMode')
    navigate('/login')
  }

  const handleDeleteChat = async (chatId) => {
    if (window.confirm('Are you sure you want to delete this chat?')) {
      try {
        await axios.delete(`http://localhost:3000/api/chat/chats/${chatId}`, {
          withCredentials: true,
        })
        
        // Remove deleted chat from state
        const updatedChats = chats.filter((chat) => chat._id !== chatId)
        setChats(updatedChats)
        
        // If deleted chat was selected, select first remaining chat or clear
        if (selectedChat?._id === chatId) {
          if (updatedChats.length > 0) {
            setSelectedChat(updatedChats[0])
            loadChatMessages(updatedChats[0])
          } else {
            setSelectedChat(null)
            setMessages([])
          }
        }
      } catch (error) {
        console.error('Error deleting chat:', error.message)
        alert('Failed to delete chat')
      }
    }
  }

  const handleCreateNewChat = async () => {
    if (!newChatName.trim()) return

    try {
      const response = await axios.post(
        'http://localhost:3000/api/chat/chats',
        { chat: newChatName },
        { withCredentials: true }
      )
      const newChat = response.data.chat
      setChats([newChat, ...chats])
      setSelectedChat(newChat)
      setMessages([])
      setNewChatName('')
      setShowNewChatModal(false)
      setSidebarOpen(false)
    } catch (error) {
      console.error('Error creating chat:', error.message)
    }
  }

  const handleSelectChat = async (chat) => {
    setSelectedChat(chat)
    await loadChatMessages(chat)
    setSidebarOpen(false)
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!messageInput.trim() || !selectedChat || isSending) return

    try {
      setIsSending(true)
      const userMessage = {
        content: messageInput,
        role: 'user',
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      }

      // Add user message to UI immediately
      setMessages([...messages, userMessage])
      setMessageInput('')

      // Send message to backend
      const response = await axios.post(
        `http://localhost:3000/api/chat/chats/${selectedChat._id}/messages`,
        { content: messageInput, role: 'user' },
        { withCredentials: true }
      )

      // If there's an AI response, add it
      if (response.data.aiResponse) {
        // Extract content and clean it
        let aiContent = response.data.aiResponse.content || response.data.aiResponse
        if (typeof aiContent === 'string') {
          aiContent = aiContent.replace(/\\n/g, '\n').trim()
        } else if (typeof aiContent === 'object') {
          aiContent = JSON.stringify(aiContent)
        }
        
        const aiMessage = {
          content: aiContent,
          role: 'model',
          timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        }
        setMessages((prev) => [...prev, aiMessage])
      }
    } catch (error) {
      console.error('Error sending message:', error.message)
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="chat-wrapper">
      {/* Dark Mode Toggle - Top Left */}
      <button 
        className="theme-toggle-btn" 
        onClick={toggleDarkMode} 
        title="Toggle dark mode"
      >
        {isDarkMode ? '☀️' : '🌙'}
      </button>

      {/* Top Navigation Bar */}
      <nav className="chat-navbar">
        <div className="chat-nav-brand">
          <span className="brand-icon">💬</span>
          <span className="brand-name">ChatFlow</span>
        </div>
        <div className="nav-divider"></div>
      </nav>

      <div className="chat-container">
        {/* Sidebar */}
        <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-header">
            <button 
              className="new-chat-btn" 
              onClick={() => setShowNewChatModal(true)}
              title="Start a new chat"
            >
              <span className="icon">✎</span>
              <span className="text">New chat</span>
            </button>
            <button 
              className="close-sidebar-btn" 
              onClick={() => setSidebarOpen(false)}
              title="Close sidebar"
            >
              ✕
            </button>
          </div>

          {/* Chat History */}
          <div className="chats-section">
            <h3 className="section-title">Chat History</h3>
            {isLoading ? (
              <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Loading...</p>
            ) : chats.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No chats yet</p>
            ) : (
              <div className="chats-list">
                {chats.map((chat) => (
                  <div key={chat._id} className={`chat-item-wrapper ${selectedChat?._id === chat._id ? 'active' : ''}`}>
                    <button
                      className={`chat-item`}
                      onClick={() => handleSelectChat(chat)}
                    >
                      <span className="chat-name">💬 {chat.chat}</span>
                      <span className="chat-date">{new Date(chat.createdAt).toLocaleDateString()}</span>
                    </button>
                    <button
                      className="chat-delete-btn"
                      onClick={() => handleDeleteChat(chat._id)}
                      title="Delete chat"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* User Profile Section */}
          <div className="sidebar-footer">
            <div className="user-card">
              <div className="user-avatar">{userInfo.avatar}</div>
              <div className="user-details">
                <div className="user-name">{userInfo.name}</div>
                <div className="user-email">{userInfo.email}</div>
                <div className="user-plan">{userInfo.plan}</div>
              </div>
            </div>
            <button className="logout-btn" onClick={handleLogout}>Logout</button>
          </div>
        </aside>

        {/* Main Chat Area */}
        <main className="chat-main">
          {/* Header */}
          <div className="chat-header">
            <button 
              className="menu-btn"
              onClick={() => setSidebarOpen(true)}
              title="Open menu"
            >
              ☰
            </button>
            <h1 className="chat-title">{selectedChat?.chat || 'Select a Chat'}</h1>
          </div>

          {/* Messages Area */}
          <div className="messages-area">
            <div className="messages-container">
              {isLoading ? (
                <div className="empty-state">
                  <div className="loading-spinner">⏳</div>
                  <h2>Loading chats...</h2>
                </div>
              ) : messages.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">💬</div>
                  <h2>Start a New Conversation</h2>
                  <p>Ask me anything or start discussing a topic</p>
                </div>
              ) : (
                <div className="messages-list">
                  {messages.map((message, index) => (
                    <div key={index} className={`message ${message.role || message.sender}`}>
                      <div className="message-bubble">
                        <p className="message-text">
                          {typeof (message.content || message.text) === 'string' 
                            ? (message.content || message.text).split('\n').map((line, i) => (
                                <React.Fragment key={i}>
                                  {line}
                                  {i < (message.content || message.text).split('\n').length - 1 && <br />}
                                </React.Fragment>
                              ))
                            : (message.content || message.text)
                          }
                        </p>
                        <span className="message-time">{message.timestamp}</span>
                      </div>
                    </div>
                  ))}
                  {isSending && (
                    <div className="message ai">
                      <div className="message-bubble">
                        <p className="message-text typing-indicator">
                          <span></span><span></span><span></span>
                        </p>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
          </div>

          {/* Input Area */}
          <div className="input-section">
            <form className="message-form" onSubmit={handleSendMessage}>
              <div className="input-container">
                <button 
                  type="button" 
                  className="input-action-btn"
                  title="Add attachment"
                  disabled={isSending}
                >
                  📎
                </button>
                <input
                  type="text"
                  className="message-input"
                  placeholder="Type your message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  disabled={!selectedChat || isSending}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage(e)
                    }
                  }}
                />
                <button 
                  type="button" 
                  className="input-action-btn"
                  title="Voice message"
                  disabled={isSending}
                >
                  🎤
                </button>
                <button 
                  type="submit" 
                  className="send-btn"
                  disabled={!messageInput.trim() || !selectedChat || isSending}
                  title="Send message"
                >
                  {isSending ? '⏳' : '➤'}
                </button>
              </div>
              <p className="input-hint">Press Enter to send, Shift+Enter for new line</p>
            </form>
          </div>
        </main>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="modal-overlay" onClick={() => setShowNewChatModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button 
              className="modal-close" 
              onClick={() => setShowNewChatModal(false)}
            >
              ✕
            </button>
            <h2>Create New Chat</h2>
            <input 
              type="text" 
              placeholder="Enter chat topic or name..."
              value={newChatName}
              onChange={(e) => setNewChatName(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleCreateNewChat()
                }
              }}
              autoFocus
            />
            <div className="modal-buttons">
              <button 
                className="btn-cancel"
                onClick={() => {
                  setShowNewChatModal(false)
                  setNewChatName('')
                }}
              >
                Cancel
              </button>
              <button 
                className="btn-create"
                onClick={handleCreateNewChat}
                disabled={!newChatName.trim()}
              >
                Create Chat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
