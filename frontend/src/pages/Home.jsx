import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './Home.css'

export default function Home() {
  const navigate = useNavigate()
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode')
    return saved ? JSON.parse(saved) : false
  })

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode))
    if (isDarkMode) {
      document.documentElement.setAttribute('data-theme', 'dark')
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
  }, [isDarkMode])

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
  }

  return (
    <div className="home-wrapper">
      <button className="theme-toggle" onClick={toggleDarkMode} title="Toggle dark mode">
        {isDarkMode ? '☀️' : '🌙'}
      </button>
      
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-logo">
            <span className="logo-icon">💬</span>
            <span className="logo-text">ChatFlow</span>
          </div>
          <ul className="nav-menu">
            <li><a href="#features">Features</a></li>
            <li><a href="#about">About</a></li>
            <li><a href="#contact">Contact</a></li>
          </ul>
        </div>
      </nav>

      <div className="home-container">
        <div className="hero-section">
          <div className="hero-content">
            <span className="hero-badge">✨ Welcome to ChatFlow</span>
            <h1 className="hero-title">Smart AI Chat Assistant</h1>
            <p className="hero-subtitle">Experience the power of intelligent conversation</p>
            <p className="hero-description">
              ChatFlow brings you a seamless chatting experience with advanced AI capabilities. 
              Chat in real-time, get instant answers, and collaborate effortlessly with our powerful platform 
              Developed by Syed Saad bin Tariq. 
            </p>
          </div>

          <div className="cta-buttons-primary">
            <button
              className="btn btn-primary"
              onClick={() => navigate('/login')}
            >
              <span className="btn-icon">🚀</span>
              <span>Get Started</span>
            </button>
            <button
              className="btn btn-outline"
              onClick={() => navigate('/register')}
            >
              <span className="btn-icon">✨</span>
              <span>Create Account</span>
            </button>
          </div>
        </div>

        <div className="features-section" id="features">
          <h2 className="section-title">Why Choose ChatFlow?</h2>
          <p className="section-subtitle">Everything you need for seamless communication</p>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon-large">⚡</div>
              <h3>Lightning Fast</h3>
              <p>Get instant responses with our optimized AI engine. No more waiting for answers.</p>
              <div className="feature-accent accent-1"></div>
            </div>
            <div className="feature-card">
              <div className="feature-icon-large">🔒</div>
              <h3>Bank-Level Security</h3>
              <p>Your conversations are encrypted and secure. We never share your data.</p>
              <div className="feature-accent accent-2"></div>
            </div>
            <div className="feature-card">
              <div className="feature-icon-large">🌍</div>
              <h3>Available 24/7</h3>
              <p>Chat anytime, anywhere. Our platform is always available for you.</p>
              <div className="feature-accent accent-3"></div>
            </div>
            <div className="feature-card">
              <div className="feature-icon-large">🎯</div>
              <h3>Smart Learning</h3>
              <p>Our AI learns from conversations to give you better and smarter responses.</p>
              <div className="feature-accent accent-4"></div>
            </div>
            <div className="feature-card">
              <div className="feature-icon-large">💡</div>
              <h3>Creative Solutions</h3>
              <p>Get unique ideas and creative suggestions for any problem you face.</p>
              <div className="feature-accent accent-5"></div>
            </div>
            <div className="feature-card">
              <div className="feature-icon-large">👥</div>
              <h3>Team Support</h3>
              <p>Collaborate with your team in real-time with our powerful chat features.</p>
              <div className="feature-accent accent-6"></div>
            </div>
          </div>
        </div>

        <div className="stats-section">
          <div className="stat-item">
            <h3 className="stat-number">100K+</h3>
            <p className="stat-label">Active Users</p>
          </div>
          <div className="stat-item">
            <h3 className="stat-number">500M+</h3>
            <p className="stat-label">Messages Processed</p>
          </div>
          <div className="stat-item">
            <h3 className="stat-number">99.9%</h3>
            <p className="stat-label">Uptime</p>
          </div>
        </div>

        <div className="cta-final">
          <h2>Ready to Join ChatFlow?</h2>
          <p>Start chatting with our AI assistant today. No credit card required.</p>
          
          <div className="button-group">
            <button
              className="btn btn-primary btn-lg"
              onClick={() => navigate('/login')}
            >
              Login Now
            </button>
            <button
              className="btn btn-secondary btn-lg"
              onClick={() => navigate('/register')}
            >
              Sign Up Free
            </button>
          </div>
        </div>
      </div>

      <footer className="home-footer">
        <div className="footer-content">
          <p>&copy; 2025 ChatFlow. All rights reserved by Syed Saad Bin Tariq.</p>
          <div className="footer-links">
            <a href="#privacy">Privacy Policy</a>
            <a href="#terms">Terms of Service</a>
            <a href="#contact">Contact Us</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
