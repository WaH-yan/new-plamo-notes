import { useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'

export default function Dashboard() {
  const router = useRouter()
  
  useEffect(() => {
    // Check if user is logged in
    const currentUser = localStorage.getItem('currentUser')
    if (!currentUser) {
      router.push('/')
      return
    }
    
    // Load the script.js script
    const script = document.createElement('script')
    script.src = '/script.js'
    script.async = true
    document.body.appendChild(script)
    
    return () => {
      if (script.parentNode) {
        document.body.removeChild(script)
      }
    }
  }, [])

  return (
    <>
      <Head>
        <title>Plamo Notes - Dashboard</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </Head>
      <div dangerouslySetInnerHTML={{ __html: `
        <div class="main-app">
          <div class="sidebar">
            <div class="sidebar-header">
              <h1>Model Kit Manager</h1>
              <input type="text" id="searchInput" placeholder="Search projects by name or tag..." class="search-bar">
            </div>
            <nav class="sidebar-nav">
              <a href="#" class="nav-item" data-page="portfolio"><i class="fas fa-home"></i> Portfolio</a>
              <a href="#" class="nav-item" data-page="new-project"><i class="fas fa-plus"></i> New Project</a>
              <a href="#" class="nav-item" data-page="new-event"><i class="fas fa-calendar-plus"></i> New Event</a>
              <a href="#" class="nav-item" data-page="calendar"><i class="fas fa-calendar"></i> Calendar</a>
              <a href="#" class="nav-item" data-page="account"><i class="fas fa-user"></i> Account Settings</a>
            </nav>
            <div class="quick-stats">
              <h3>Quick Stats</h3>
              <div class="stats-grid">
                <div class="stat-item">
                  <div class="stat-number" id="activeCount">0</div>
                  <div class="stat-label">Active</div>
                </div>
                <div class="stat-item">
                  <div class="stat-number" id="completeCount">0</div>
                  <div class="stat-label">Complete</div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Rest of your dashboard.html content -->
        </div>
      `}} />
    </>
  )
}