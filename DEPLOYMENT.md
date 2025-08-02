# Deployment Guide for Plamo Notes

This guide will walk you through the process of deploying the Plamo Notes application to a web server. The application consists of a PHP backend, MySQL database, and HTML/CSS/JavaScript frontend.

## Deployment Options

### Option 1: Shared Hosting (Beginner-Friendly)

Shared hosting is the simplest option for deploying a PHP/MySQL application.

#### Requirements
- Web hosting account with PHP 7.4+ support
- MySQL database
- FTP access or file manager

#### Steps

1. **Prepare Your Database**
   - Create a new MySQL database through your hosting control panel
   - Note down the database name, username, password, and host

2. **Update Configuration**
   - Edit `config.php` to match your database credentials:
     ```php
     $host = 'your_database_host'; // Often 'localhost'
     $port = '3306'; // Standard MySQL port
     $dbname = 'your_database_name';
     $username = 'your_database_username';
     $password = 'your_database_password';
     ```

3. **Upload Files**
   - Upload all project files to your web hosting using FTP or the file manager
   - Ensure files maintain their directory structure

4. **Import Database Schema**
   - Use phpMyAdmin or similar tool provided by your host
   - Import the `model_kit_manager.sql` file to set up the database structure

5. **Set Permissions**
   - Ensure the web server has read/write permissions for any directories that need to store uploads
   - Typically set directories to 755 and files to 644

6. **Test Your Application**
   - Navigate to your domain in a web browser
   - Test user registration and login functionality
   - Verify that projects can be created and managed

### Option 2: VPS Deployment (More Control)

A Virtual Private Server (VPS) gives you more control over the server environment.

#### Requirements
- VPS with SSH access
- Ubuntu 20.04 LTS or similar Linux distribution
- Basic command line knowledge

#### Steps

1. **Set Up Server**
   ```bash
   # Update system packages
   sudo apt update && sudo apt upgrade -y
   
   # Install LAMP stack
   sudo apt install apache2 mysql-server php libapache2-mod-php php-mysql php-gd php-mbstring php-xml php-curl -y
   
   # Start and enable services
   sudo systemctl start apache2
   sudo systemctl enable apache2
   sudo systemctl start mysql
   sudo systemctl enable mysql
   ```

2. **Secure MySQL**
   ```bash
   sudo mysql_secure_installation
   ```
   - Follow the prompts to set a root password and secure your MySQL installation

3. **Create Database**
   ```bash
   sudo mysql -u root -p
   ```
   ```sql
   CREATE DATABASE model_kit_manager;
   CREATE USER 'plamo_user'@'localhost' IDENTIFIED BY 'your_secure_password';
   GRANT ALL PRIVILEGES ON model_kit_manager.* TO 'plamo_user'@'localhost';
   FLUSH PRIVILEGES;
   EXIT;
   ```

4. **Configure Apache**
   ```bash
   # Create a new virtual host configuration
   sudo nano /etc/apache2/sites-available/plamo-notes.conf
   ```
   
   Add the following configuration:
   ```apache
   <VirtualHost *:80>
       ServerName yourdomain.com
       ServerAlias www.yourdomain.com
       DocumentRoot /var/www/plamo-notes
       
       <Directory /var/www/plamo-notes>
           Options Indexes FollowSymLinks
           AllowOverride All
           Require all granted
       </Directory>
       
       ErrorLog ${APACHE_LOG_DIR}/plamo-notes-error.log
       CustomLog ${APACHE_LOG_DIR}/plamo-notes-access.log combined
   </VirtualHost>
   ```

5. **Enable the Site**
   ```bash
   sudo a2ensite plamo-notes.conf
   sudo a2enmod rewrite
   sudo systemctl restart apache2
   ```

6. **Deploy Application**
   ```bash
   # Create the directory
   sudo mkdir -p /var/www/plamo-notes
   
   # Set ownership
   sudo chown -R $USER:www-data /var/www/plamo-notes
   ```

7. **Transfer Files**
   - Use SCP or SFTP to upload your application files to `/var/www/plamo-notes`
   - Alternatively, if using Git:
     ```bash
     cd /var/www/plamo-notes
     git clone your-repository-url .
     ```

8. **Update Configuration**
   ```bash
   nano /var/www/plamo-notes/config.php
   ```
   Update with your database credentials:
   ```php
   $host = 'localhost';
   $port = '3306';
   $dbname = 'model_kit_manager';
   $username = 'plamo_user';
   $password = 'your_secure_password';
   ```

9. **Import Database Schema**
   ```bash
   mysql -u plamo_user -p model_kit_manager < /var/www/plamo-notes/model_kit_manager.sql
   ```

10. **Set Permissions**
    ```bash
    sudo chown -R www-data:www-data /var/www/plamo-notes
    sudo find /var/www/plamo-notes -type d -exec chmod 755 {} \;
    sudo find /var/www/plamo-notes -type f -exec chmod 644 {} \;
    ```

11. **Configure Domain**
    - Point your domain's DNS to your server's IP address
    - Wait for DNS propagation (can take up to 48 hours)

### Option 3: Docker Deployment (Advanced)

For a more portable and isolated deployment, you can use Docker.

#### Requirements
- Server with Docker and Docker Compose installed
- Basic Docker knowledge

#### Steps

1. **Create a Dockerfile**
   Create a file named `Dockerfile` in your project root:
   ```dockerfile
   FROM php:7.4-apache
   
   # Install dependencies
   RUN apt-get update && apt-get install -y \
       libfreetype6-dev \
       libjpeg62-turbo-dev \
       libpng-dev \
       && docker-php-ext-configure gd --with-freetype --with-jpeg \
       && docker-php-ext-install -j$(nproc) gd mysqli pdo pdo_mysql
   
   # Enable Apache mod_rewrite
   RUN a2enmod rewrite
   
   # Copy application files
   COPY . /var/www/html/
   
   # Set permissions
   RUN chown -R www-data:www-data /var/www/html
   ```

2. **Create Docker Compose File**
   Create a file named `docker-compose.yml`:
   ```yaml
   version: '3'
   
   services:
     web:
       build: .
       ports:
         - "80:80"
       volumes:
         - ./:/var/www/html
       depends_on:
         - db
       environment:
         - MYSQL_HOST=db
         - MYSQL_PORT=3306
         - MYSQL_DATABASE=model_kit_manager
         - MYSQL_USER=plamo_user
         - MYSQL_PASSWORD=your_secure_password
   
     db:
       image: mysql:5.7
       ports:
         - "3306:3306"
       environment:
         - MYSQL_ROOT_PASSWORD=root_password
         - MYSQL_DATABASE=model_kit_manager
         - MYSQL_USER=plamo_user
         - MYSQL_PASSWORD=your_secure_password
       volumes:
         - db_data:/var/lib/mysql
         - ./model_kit_manager.sql:/docker-entrypoint-initdb.d/model_kit_manager.sql
   
   volumes:
     db_data:
   ```

3. **Update Configuration for Docker**
   Create a modified `config.php` that uses environment variables:
   ```php
   <?php
   // config.php
   $host = getenv('MYSQL_HOST') ?: 'localhost';
   $port = getenv('MYSQL_PORT') ?: '3306';
   $dbname = getenv('MYSQL_DATABASE') ?: 'model_kit_manager';
   $username = getenv('MYSQL_USER') ?: 'root';
   $password = getenv('MYSQL_PASSWORD') ?: 'root';
   
   try {
       $pdo = new PDO("mysql:host=$host;port=$port;dbname=$dbname", $username, $password);
       $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
   } catch (PDOException $e) {
       error_log('Connection failed: ' . $e->getMessage());
       die("Connection failed: " . $e->getMessage());
   }
   ?>
   ```

4. **Build and Run with Docker Compose**
   ```bash
   docker-compose up -d
   ```

5. **Access Your Application**
   - Visit `http://your-server-ip` in your browser

## Production Considerations

### Security

1. **HTTPS Setup**
   - Obtain an SSL certificate (Let's Encrypt is free)
   - Configure your web server to use HTTPS

2. **Secure Headers**
   - Add security headers to your Apache configuration or via PHP

3. **Input Validation**
   - Ensure all user inputs are properly validated and sanitized

4. **Database Security**
   - Use a strong password for your database
   - Limit database user permissions to only what's needed

### Performance

1. **Caching**
   - Consider implementing browser caching for static assets
   - Use PHP opcode caching (OPcache)

2. **Database Optimization**
   - Add indexes to frequently queried columns
   - Optimize your MySQL configuration for your server's resources

3. **Content Delivery Network (CDN)**
   - Consider using a CDN for static assets

### Maintenance

1. **Backups**
   - Set up regular database backups
   - Store backups in a separate location

2. **Monitoring**
   - Implement server monitoring to track performance and uptime
   - Set up error logging and notifications

3. **Updates**
   - Regularly update your server software and dependencies
   - Keep your application code updated with security patches

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify database credentials in `config.php`
   - Check if MySQL service is running
   - Ensure the database and user exist with proper permissions

2. **Permission Issues**
   - Check file and directory permissions
   - Ensure the web server user (www-data, apache, etc.) has appropriate access

3. **404 Errors**
   - Verify that mod_rewrite is enabled if using .htaccess
   - Check virtual host configuration

4. **500 Internal Server Errors**
   - Check PHP error logs for details
   - Verify PHP version compatibility
   - Check for syntax errors in PHP files

## Conclusion

You've now deployed the Plamo Notes application! Remember to regularly back up your database and keep your server software updated for security and performance.

For any issues or questions, refer to the troubleshooting section or consult with your hosting provider's support team.