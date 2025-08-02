# Plamo Notes - Model Kit Manager

Plamo Notes is a comprehensive web application designed to help model kit builders organize, track, and manage their model kit projects. Whether you're a casual hobbyist or a serious model builder, this tool helps you keep track of your backlog, document your progress, and plan your building schedule.

## Features

### Project Management
- **Project Portfolio**: Create and manage detailed profiles for all your model kit projects
- **Progress Tracking**: Set completion criteria and track progress for each project
- **Categorization**: Organize projects by category (Gundam, Military Vehicle, Aircraft, Ship, Car, etc.)
- **Image Support**: Upload and store images of your projects

### Build Documentation
- **Build Logbook**: Document your building journey with timestamped entries
- **Photo Documentation**: Add photos to track progress at different stages
- **Completion Criteria**: Define custom completion criteria for each project

### Event Planning
- **Calendar Integration**: Schedule building sessions, competitions, and deadlines
- **Event Management**: Create and track model-related events

### User Account
- **User Authentication**: Secure sign-in and registration system
- **Account Settings**: Personalize your experience
- **Quick Stats**: View at-a-glance statistics about your projects

## Technical Overview

### Frontend
- HTML5, CSS3, and JavaScript
- Responsive design for desktop and mobile devices
- Font Awesome for icons

### Backend
- PHP for server-side processing
- MySQL database for data storage
- RESTful API architecture

### Project Structure
```
/
├── api/                  # Backend API endpoints
│   ├── events.php        # Event management API
│   ├── projects.php      # Project management API
│   ├── signin.php        # User authentication
│   ├── signup.php        # User registration
│   ├── update_password.php # Password management
│   └── update_user.php   # User profile management
├── config.php           # Database configuration
├── dashboard.html       # Main application dashboard
├── data.js              # Client-side data handling
├── index.html           # Landing page
├── landing-styles.css   # Landing page styles
├── landing.js           # Landing page functionality
├── model_kit_manager.sql # Database schema
├── script.js            # Main application JavaScript
└── styles.css           # Main application styles
```

### Database Structure
- **Users**: Store user account information (id, email, username, full_name, password_hash, created_at)
- **Projects**: Track model kit projects and their details (id, user_id, name, description, category, status, progress, plan_to_complete, created_date)
- **Project Criteria**: Store completion criteria for each project (id, project_id, criteria_text, is_completed)
- **Project Images**: Store images associated with projects (id, project_id, image_data)
- **Project Logbook**: Track build progress with timestamped entries (id, project_id, date, entry)
- **Project Tags**: Store tags for projects to improve searchability (id, project_id, tag)
- **Events**: Manage calendar events and deadlines (id, user_id, title, date, location, description, plan, type, created_at)

#### Database Relationships
- **Users to Projects**: One-to-many (one user can have many projects)
- **Users to Events**: One-to-many (one user can have many events)
- **Projects to Project Criteria**: One-to-many (one project can have many completion criteria)
- **Projects to Project Images**: One-to-many (one project can have many images)
- **Projects to Project Logbook**: One-to-many (one project can have many logbook entries)
- **Projects to Project Tags**: One-to-many (one project can have many tags)

#### Complete Database Schema

```sql
-- Users table stores user account information
CREATE TABLE `users` (
  `id` bigint(20) NOT NULL,
  `email` varchar(255) NOT NULL,
  `username` varchar(255) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Projects table stores model kit project information
CREATE TABLE `projects` (
  `id` bigint(20) NOT NULL,
  `user_id` bigint(20) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text,
  `category` varchar(50) DEFAULT NULL,
  `status` varchar(20) DEFAULT 'active',
  `progress` int(11) DEFAULT '0',
  `plan_to_complete` date DEFAULT NULL,
  `created_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Project criteria tracks completion steps for each project
CREATE TABLE `project_criteria` (
  `id` bigint(20) NOT NULL,
  `project_id` bigint(20) NOT NULL,
  `criteria_text` varchar(255) NOT NULL,
  `is_completed` tinyint(1) DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Project images stores photos associated with projects
CREATE TABLE `project_images` (
  `id` bigint(20) NOT NULL,
  `project_id` bigint(20) NOT NULL,
  `image_data` longblob NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Project logbook tracks build progress with timestamped entries
CREATE TABLE `project_logbook` (
  `id` bigint(20) NOT NULL,
  `project_id` bigint(20) NOT NULL,
  `date` date NOT NULL,
  `entry` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Project tags stores tags for projects to improve searchability
CREATE TABLE `project_tags` (
  `id` bigint(20) NOT NULL,
  `project_id` bigint(20) NOT NULL,
  `tag` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Events table stores calendar events and deadlines
CREATE TABLE `events` (
  `id` bigint(20) NOT NULL,
  `user_id` bigint(20) NOT NULL,
  `title` varchar(255) NOT NULL,
  `date` date NOT NULL,
  `location` varchar(255) DEFAULT NULL,
  `description` text,
  `plan` text,
  `type` varchar(50) DEFAULT 'user-created',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### Primary Keys and Indexes

All tables use `id` as their primary key with auto-increment. Foreign key relationships are established between:

- `projects.user_id` → `users.id`
- `project_criteria.project_id` → `projects.id`
- `project_images.project_id` → `projects.id`
- `project_logbook.project_id` → `projects.id`
- `project_tags.project_id` → `projects.id`
- `events.user_id` → `users.id`

## Getting Started

### Prerequisites
- Web server with PHP support (Apache/Nginx)
- MySQL database
- PHP 7.4 or higher

### Installation
1. Clone this repository to your web server directory
2. Import the `model_kit_manager.sql` file to create the database structure
3. Configure database connection in `config.php`
4. Access the application through your web browser

## Usage

1. **Sign Up/Sign In**: Create an account or sign in to an existing account
2. **Add Projects**: Create new project entries for your model kits
3. **Track Progress**: Update project status and completion criteria as you build
4. **Plan Events**: Add important dates to your calendar
5. **View Portfolio**: See all your projects in one organized dashboard

## Application Workflow

### User Authentication Flow
1. User visits the landing page (index.html)
2. User signs up or signs in through the authentication forms
3. Authentication is processed by signin.php or signup.php
4. Upon successful authentication, user is redirected to dashboard.html

### Project Management Flow
1. User creates a new project through the New Project form
2. Project data is sent to projects.php API endpoint
3. Project is stored in the database with associated criteria and tags
4. User can view and update projects from the Portfolio page
5. Project progress is tracked through completion criteria and logbook entries

### Event Management Flow
1. User creates events through the New Event form
2. Event data is sent to events.php API endpoint
3. Events are displayed on the Calendar page
4. User can track upcoming events and deadlines

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Developed for model kit enthusiasts to better organize their hobby
- Inspired by the needs of the plastic model (plamo) building community