import { useEffect } from 'react'
import Head from 'next/head'

export default function Home() {
  useEffect(() => {
    // Load the landing.js script
    const script = document.createElement('script')
    script.src = '/landing.js'
    script.async = true
    document.body.appendChild(script)
    
    return () => {
      document.body.removeChild(script)
    }
  }, [])

  return (
    <>
      <Head>
        <title>Model Kit Manager</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css" />
      </Head>
      <div dangerouslySetInnerHTML={{ __html: `
        <header class="landing-header">
          <div class="container">
            <div class="logo">
              <i class="fas fa-tools"></i>
              Plamo Notes
            </div>
            <nav class="landing-nav">
              <a href="#features">Features</a>
              <a href="#about">About</a>
              <a href="#signin" class="signin-link">Sign In</a>
            </nav>
          </div>
        </header>
        
        <!-- Rest of your index.html content -->
      `}} />
    </>
  )
}