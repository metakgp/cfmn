<div id="top"></div>

<!-- PROJECT SHIELDS -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links-->
<div align="center">

[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![MIT License][license-shield]][license-url]
[![Wiki][wiki-shield]][wiki-url]

</div>

<!-- PROJECT LOGO -->
<br />
<!-- UPDATE -->
<div align="center">
  <a href="https://github.com/metakgp/cfmn">
     <img width="140" alt="image" src="https://raw.githubusercontent.com/metakgp/design/main/logos/black-large.jpg">
  </a>

<h3 align="center">CFMN: Can't Find My Notes</h3>

  <p align="center">
  <!-- UPDATE -->
    <i>No more venturing into dark alleys</i>
    <br />
    <a href="https://notes.metakgp.org">Website</a>
    ·
    <a href="https://github.com/metakgp/cfmn/issues">Request Feature / Report Bug</a>
  </p>
</div>


<!-- TABLE OF CONTENTS -->
<details>
<summary>Table of Contents</summary>

- [About The Project](#about-the-project)
- [Getting Started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Environment Setup](#environment-setup)
    - [Google OAuth Setup](#google-oauth-setup)
    - [Database Setup](#database-setup)
    - [Installation](#installation)
- [Usage](#usage)
- [Contact](#contact)
    - [Maintainer(s)](#maintainers)
    - [creators(s)](#creators)
- [Additional documentation](#additional-documentation)

</details>


<!-- ABOUT THE PROJECT -->
## About The Project
[WIP]


## Getting Started
[WIP]


### Prerequisites
[WIP]

### Environment Setup

This project requires proper environment configuration for both development and production environments. Environment files contain sensitive configuration like API keys, database credentials, and other settings.

#### Setting up Development Environment (.env)

1. **Copy the template file:**
   ```bash
   cp .env.template .env
   ```

2. **Configure the environment variables in `.env`:**
   ```env
   # Google OAuth - Get this from Google Cloud Console (see Google OAuth Setup section)
   GOOGLE_CLIENT_ID=your_actual_client_id.apps.googleusercontent.com
   
   # JWT Configuration - Generate a secure random string
   SIGNING_SECRET=your-secure-signing-secret-here
   EXPIRATION_TIME_SECONDS="86400"  # 24 hours
   
   # File Upload Configuration
   FILE_SIZE_LIMIT="50"  # MB
   
   # Server Configuration
   PORT=8085
   
   # Database Configuration (for local development)
   DB_NAME=cfmn_dev
   DB_HOST=localhost  # Should be localhost for development
   DB_PORT=5432
   DB_USER=cfmn_user
   DB_PASSWORD=cfmn_password
   
   # File Storage Paths (create these directories locally)
   UPLOADED_NOTES_PATH=cfmn/notes/uploaded
   PREVIEWS_PATH=cfmn/previews/uploaded
   LOG_LOCATION=/path/to/your/log/directory
   
   # Static Files Configuration
   STATIC_FILES_URL=http://localhost:8085
   STATIC_FILE_STORAGE_LOCATION=/path/to/your/static/files
   ```

#### Setting up Production Environment (.production.env)

1. **Copy the template file:**
   ```bash
   cp .production.env.template .production.env
   ```

2. **Configure the environment variables in `.production.env`:**
   ```env
   # Google OAuth - Same as development but for production domain
   GOOGLE_CLIENT_ID=your_production_client_id.apps.googleusercontent.com
   
   # JWT Configuration - Use a different, secure signing secret for production
   SIGNING_SECRET=your-production-signing-secret-here
   EXPIRATION_TIME_SECONDS="86400"
   
   # File Upload Configuration
   FILE_SIZE_LIMIT="50"
   
   # Server Configuration
   PORT=8085
   VITE_API_BASE_URL=https://your-production-api-url.com
   FRONTEND_BUILD_DIR=../frontend/dist/
   
   # Database Configuration (for production)
   DB_NAME=cfmn_production
   DB_HOST=postgres  # Docker service name or production database host
   DB_PORT=5432
   DB_USER=your_production_db_user
   DB_PASSWORD=your_production_db_password
   
   # File Storage Paths (production paths)
   UPLOADED_NOTES_PATH=cfmn/notes/uploaded
   PREVIEWS_PATH=cfmn/previews/uploaded
   
   # Static Files Configuration (production)
   STATIC_FILES_URL=http://static.metakgp.org
   
   # Docker Container Paths
   LOG_LOCATION=/app/log
   STATIC_FILE_STORAGE_LOCATION=/app/static_files
   ```

#### Frontend Environment Setup

The frontend also requires environment configuration:

**For Development (`frontend/.env.local`):**
```env
VITE_GOOGLE_CLIENT_ID=your_actual_client_id.apps.googleusercontent.com
VITE_API_BASE_URL=http://localhost:8085
```

**For Production (`frontend/.env.production`):**
```env
VITE_GOOGLE_CLIENT_ID=your_production_client_id.apps.googleusercontent.com
VITE_API_BASE_URL=https://your-production-api-url.com
```

#### Important Notes

- **Never commit actual environment files** (`.env`, `.production.env`) to version control
- **Generate secure, random signing secrets** for production environments
- **Use different Google OAuth Client IDs** for development and production
- **Ensure database credentials match** your actual database configuration
- **Create required directories** specified in file paths before running the application

### Google OAuth Setup

This project requires Google OAuth for authentication. You need to set up a Google OAuth client and configure the client ID in multiple environment files.

#### Step 1: Create Google OAuth Credentials

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. If prompted, configure the OAuth consent screen first:
- Choose **External** user type
- Fill in the required fields (App name, User support email, Developer contact email)
- Add your domain to **Authorized domains** if deploying to production
6. For **Application type**, select **Web application**
7. Add your Authorized Javascript origins:
- For development: `http://localhost:5173` and `http://localhost`
- For production: `https://cfmn.metakgp.org` (frontend URL)
8. Click **Create** and copy the **Client ID**. Client Secret is not needed for this project.

#### Step 2: Configure Environment Variables

You need to set the Google Client ID in the following environment files:

**Frontend Environment Files:**
- `frontend/.env.local` (for development)
- `frontend/.env.production` (for production builds)

```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

**Root Environment Files:**
- `root/.env` (for development)
- `root/.production.env` (for production)

```env
GOOGLE_CLIENT_ID=your_google_client_id_here
```

#### Step 3: Verify Configuration

Make sure all four files contain the correct Google Client ID:
- Frontend uses `VITE_GOOGLE_CLIENT_ID` (Vite environment variable)
- Backend/root uses `GOOGLE_CLIENT_ID` (standard environment variable)

### Database Setup

This project uses a PostgreSQL database. The database schema and initial data are defined in `root/database/init.sql`.

#### Development Environment

For development, the database is automatically set up using Docker Compose:

1. **Configure database parameters in `docker-compose.dev.yml`:**
   ```yaml
   services:
     postgres:
       image: postgres:16-alpine
       container_name: cfmn-dev-db
       environment:
         POSTGRES_DB: cfmn_dev
         POSTGRES_USER: cfmn_user
         POSTGRES_PASSWORD: cfmn_password
       volumes:
         - ./database/init.sql:/docker-entrypoint-initdb.d/init.sql
         - postgres-data-dev:/var/lib/postgresql/data
       ports:
         - "5432:5432"
   
   volumes:
     postgres-data-dev:
       name: postgres-data-dev
   ```

2. **The database will be automatically initialized when you run:**
   ```bash
   docker-compose -f docker-compose.dev.yml up
   ```

3. **Database initialization includes:**
- Creating tables and schemas defined in `root/database/init.sql`
- Setting up initial data
- Configuring database constraints and indexes
- All queries in `init.sql` are executed automatically on first startup

#### Production Environment

For production deployment, you need to manually set up the database:

1. **Create a PostgreSQL database** (probably [Database of Babel](https://github.com/metakgp/dob))

2. **Execute the initialization queries from `root/database/init.sql`:**
   ```bash
   psql -h your_host -U your_user -d your_database -f root/database/init.sql
   ```

3. **Configure your production environment variables** with the database connection details:
   ```env
   DATABASE_URL=postgresql://username:password@host:port/database
   # or individual parameters
   DB_HOST=your_database_host
   DB_PORT=5432
   DB_NAME=your_database_name
   DB_USER=your_database_user
   DB_PASSWORD=your_database_password
   ```

#### Database Schema

The `root/database/init.sql` file contains:
- Table definitions for users, notes and votes
- Foreign key constraints and relationships

Make sure to review and customize the database configuration based on your specific requirements.

### Installation

[WIP]


<!-- USAGE EXAMPLES -->
## Usage
[WIP]

## Contact

<p>
📫 Metakgp -
<a href="https://slack.metakgp.org">
  <img align="center" alt="Metakgp's slack invite" width="22px" src="https://raw.githubusercontent.com/edent/SuperTinyIcons/master/images/svg/slack.svg" />
</a>
<a href="mailto:metakgp@gmail.com">
  <img align="center" alt="Metakgp's email " width="22px" src="https://raw.githubusercontent.com/edent/SuperTinyIcons/master/images/svg/gmail.svg" />
</a>
<a href="https://www.facebook.com/metakgp">
  <img align="center" alt="metakgp's Facebook" width="22px" src="https://raw.githubusercontent.com/edent/SuperTinyIcons/master/images/svg/facebook.svg" />
</a>
<a href="https://www.linkedin.com/company/metakgp-org/">
  <img align="center" alt="metakgp's LinkedIn" width="22px" src="https://raw.githubusercontent.com/edent/SuperTinyIcons/master/images/svg/linkedin.svg" />
</a>
<a href="https://twitter.com/metakgp">
  <img align="center" alt="metakgp's Twitter " width="22px" src="https://raw.githubusercontent.com/edent/SuperTinyIcons/master/images/svg/twitter.svg" />
</a>
<a href="https://www.instagram.com/metakgp_/">
  <img align="center" alt="metakgp's Instagram" width="22px" src="https://raw.githubusercontent.com/edent/SuperTinyIcons/master/images/svg/instagram.svg" />
</a>
</p>

### Maintainer(s)

The currently active maintainer(s) of this project.

<!-- UPDATE -->
- [Devansh Gupta](https://github.com/Devansh-bit)

### Creator(s)

Honoring the original creator(s) and ideator(s) of this project.

<!-- UPDATE -->
- [Devansh Gupta](https://github.com/Devansh-bit)

<p align="right">(<a href="#top">back to top</a>)</p>

## Additional documentation

- [License](/LICENSE)
- [Code of Conduct](/.github/CODE_OF_CONDUCT.md)
- [Security Policy](/.github/SECURITY.md)
- [Contribution Guidelines](/.github/CONTRIBUTING.md)

<p align="right">(<a href="#top">back to top</a>)</p>

<!-- MARKDOWN LINKS & IMAGES -->

[contributors-shield]: https://img.shields.io/github/contributors/metakgp/cfmn.svg?style=for-the-badge
[contributors-url]: https://github.com/metakgp/cfmn/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/metakgp/cfmn.svg?style=for-the-badge
[forks-url]: https://github.com/metakgp/cfmn/network/members
[stars-shield]: https://img.shields.io/github/stars/metakgp/cfmn.svg?style=for-the-badge
[stars-url]: https://github.com/metakgp/cfmn/stargazers
[issues-shield]: https://img.shields.io/github/issues/metakgp/cfmn.svg?style=for-the-badge
[issues-url]: https://github.com/metakgp/cfmn/issues
[license-shield]: https://img.shields.io/github/license/metakgp/cfmn.svg?style=for-the-badge
[license-url]: https://github.com/metakgp/cfmn/blob/master/LICENSE
[wiki-shield]: https://custom-icon-badges.demolab.com/badge/metakgp_wiki-grey?logo=metakgp_logo&style=for-the-badge
[wiki-url]: https://wiki.metakgp.org