<a id="readme-top"></a>

[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![MIT License][license-shield]][license-url]

<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="https://github.com/lucialv/ryo.cat">
    <img src="https://raw.githubusercontent.com/lucialv/ryo.cat/refs/heads/main/assets/banner.png" alt="Logo" />
  </a>

  <h3 align="center">Ryo.cat</h3>

  <p align="center">
    A modern social media platform built with Go and React
    <br />
    <!-- <a href="https://github.com/lucialv/ryo.cat"><strong>Explore the docs »</strong></a> -->
    <br />
    <br />
    <a href="https://ryo.cat">View Demo</a>
    ·
    <a href="https://github.com/lucialv/ryo.cat/issues/new?labels=bug&template=bug-report---.md">Report Bug</a>
    ·
    <a href="https://github.com/lucialv/ryo.cat/issues/new?labels=enhancement&template=feature-request---.md">Request Feature</a>
  </p>
</div>

<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#features">Features</a></li>
    <li><a href="#api-endpoints">API Endpoints</a></li>
    <li><a href="#project-structure">Project Structure</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
  </ol>
</details>

<!-- ABOUT THE PROJECT -->

## About The Project

[![Product Name Screen Shot](https://raw.githubusercontent.com/lucialv/ryo.cat/refs/heads/main/assets/preview.png)][product-screenshot]

Ryo.cat is a modern, full-stack social media platform that combines the power of Go's performance with React's dynamic user interface. The platform features a robust authentication system, media sharing capabilities, and a clean, responsive design with dark/light theme support.

**Key Highlights:**

- **Secure Authentication**: Google OAuth integration with JWT token management
- **Media Sharing**: Support for image and video uploads with cloud storage
- **Admin Features**: Administrative controls for content management
- **Responsive Design**: Mobile-first approach with TailwindCSS
- **Real-time Updates**: Modern React Query for efficient data fetching
- **Dark/Light Theme**: Seamless theme switching for better user experience

The platform is designed to be scalable, maintainable, and provides a solid foundation for building modern social applications.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Built With

This project leverages modern technologies and frameworks to deliver a robust and scalable social media platform:

**Backend:**

- [![Go][Go.dev]][Go-url]
- [![Chi][Chi.router]][Chi-url]
- [![JWT][JWT.io]][JWT-url]

**Frontend:**

- [![React][React.js]][React-url]
- [![TypeScript][TypeScript.js]][TypeScript-url]
- [![Vite][Vite.js]][Vite-url]
- [![TailwindCSS][TailwindCSS.com]][TailwindCSS-url]
- [![React Query][TanStack.query]][TanStack-url]

**Database & Storage:**

- [![Turso][Turso.tech]][Turso-url]
- [![Cloudflare R2][Cloudflare.R2]][Cloudflare-url]

**Authentication:**

- [![Google OAuth][Google.OAuth]][Google-url]

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- GETTING STARTED -->

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

Make sure you have the following installed on your system:

**Backend Requirements:**

- Go 1.24 or later
  ```sh
  go version
  ```

**Frontend Requirements:**

- Node.js 18+ and bun (or pnpm)
  ```sh
  node --version
  bun --version
  ```

### Installation

1. **Clone the repository**

   ```sh
   git clone https://github.com/lucialv/ryo.cat.git
   cd ryo.cat
   ```

2. **Backend Setup**

   ```sh
   cd api

   # Install Go dependencies
   go mod download

   # Copy environment variables
   cp .env.example .env

   # Edit .env with your configuration
   nano .env
   ```

3. **Frontend Setup**

   ```sh
   cd ../web

   # Install dependencies
   bun install

   # Copy environment variables
   cp .env.example .env

   # Edit .env with your API URL
   nano .env
   ```

4. **Environment Configuration**

   **API (.env):**

   ```env
   ADDR=:8080
   FRONTEND_URL=http://localhost:5173
   EXTERNAL_URL=http://localhost:8080
   ENV=development
   JWT_SECRET=your-jwt-secret
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_AUD=your-google-client-id
   GOOGLE_ISS=https://accounts.google.com
   DB_URL=your-database-url
   DB_TOKEN=your-database-token
   BUCKET_NAME=your-bucket-name
   ACCOUNT_ID=your-cloudflare-account-id
   ACCESS_KEY_ID=your-access-key
   ACCESS_KEY_SECRET=your-secret-key
   ```

   **Web (.env):**

   ```env
   VITE_API_URL=http://localhost:8080
   ```

5. **Database Setup**

   ```sh
   cd api
   # Run database migrations (if needed)
   # The app will auto-migrate on startup
   ```

6. **Start the Development Servers**

   **Backend (Terminal 1):**

   ```sh
   cd api
   go run cmd/main.go
   ```

   **Frontend (Terminal 2):**

   ```sh
   cd web
   bun dev
   ```

7. **Access the Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8080

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- USAGE EXAMPLES -->

## Usage

### User Authentication

- Sign in with your Google account
- Secure JWT-based session management
- Automatic token refresh and validation

### Creating Posts

- Admin users can create posts with rich media content
- Support for images and videos
- Drag-and-drop file upload interface

### Profile Management

- Upload and manage profile pictures
- Update personal information
- View post history

### Social Features

- Browse posts from all users
- Infinite scroll for seamless browsing
- Responsive design for mobile and desktop

_For more examples and detailed API documentation, please refer to the [API Documentation](#api-endpoints)_

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- FEATURES -->

## Features

### 🔐 **Authentication & Security**

- Google OAuth 2.0 integration
- JWT token-based authentication
- Secure cookie management
- Role-based access control (Admin/User)

### 📱 **User Interface**

- Modern, responsive design
- Dark/Light theme toggle
- Mobile-first approach
- Smooth animations and transitions
- Infinite scroll for posts

### 📸 **Media Management**

- Image and video upload support
- Cloud storage integration (Cloudflare R2)
- Automatic media optimization
- Media viewer with navigation controls

### 👤 **User Profiles**

- Profile picture management
- User information display
- Post history and management
- Admin badges and permissions

### 🚀 **Performance**

- Efficient data fetching with React Query
- Optimized bundle size with Vite
- Lazy loading and code splitting
- Server-side rendering ready

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- API ENDPOINTS -->

## API Endpoints

### Authentication

- `GET /v1/login` - Google OAuth login
- `POST /v1/logout` - User logout

### User Profile

- `GET /v1/profile` - Get user profile
- `PUT /v1/profile/picture` - Update profile picture
- `POST /v1/profile/picture/upload` - Upload profile picture
- `DELETE /v1/profile/picture` - Delete profile picture

### Posts

- `GET /v1/posts` - Get all posts (paginated)
- `POST /v1/posts` - Create new post (Admin only)
- `GET /v1/posts/:id` - Get specific post
- `DELETE /v1/posts/:id` - Delete post (Admin only)
- `GET /v1/posts/user/:userId` - Get posts by user
- `POST /v1/posts/media/upload` - Upload media for posts (Admin only)

### Storage

- `POST /v1/storage/upload` - Upload file to storage
- `DELETE /v1/storage/:key` - Delete file from storage

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- PROJECT STRUCTURE -->

## Project Structure

```
ryo.cat/
├── api/                    # Backend Go application
│   ├── cmd/
│   │   ├── main.go        # Application entry point
│   │   └── api/           # API handlers and middleware
│   ├── internal/
│   │   └── auth/          # Authentication logic
│   ├── pkg/
│   │   ├── env/           # Environment configuration
│   │   ├── storage/       # Cloud storage integration
│   │   ├── store/         # Database operations
│   │   └── utils/         # Utility functions
│   ├── go.mod             # Go module dependencies
│   └── .env.example       # Environment variables template
│
├── web/                   # Frontend React application
│   ├── src/
│   │   ├── api/           # API client functions
│   │   ├── components/    # Reusable React components
│   │   ├── context/       # React context providers
│   │   ├── hooks/         # Custom React hooks
│   │   ├── pages/         # Page components
│   │   └── assets/        # Static assets
│   ├── public/            # Public assets
│   ├── package.json       # Node.js dependencies
│   └── .env.example       # Environment variables template
│
├── LICENSE                # MIT License
└── README.md             # Project documentation
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- CONTRIBUTING -->

## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".
Don't forget to give the project a star! Thanks again!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines

- Follow Go best practices for backend development
- Use TypeScript strictly for frontend development
- Maintain consistent code formatting
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

### Top contributors:

<a href="https://github.com/lucialv/ryo.cat/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=lucialv/ryo.cat" alt="contrib.rocks image" />
</a>

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- LICENSE -->

## License

Distributed under the MIT License. See `LICENSE` for more information.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- CONTACT -->

## Contact

Lucía Álvarez - [@lucialv](https://github.com/lucialv)

Project Link: [https://github.com/lucialv/ryo.cat](https://github.com/lucialv/ryo.cat)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- ACKNOWLEDGMENTS -->

## Acknowledgments

Special thanks to the amazing tools and resources that made this project possible:

- [Best README Template](https://github.com/othneildrew/Best-README-Template)
- [Go Chi Router](https://github.com/go-chi/chi)
- [React Query/TanStack Query](https://tanstack.com/query)
- [TailwindCSS](https://tailwindcss.com)
- [Vite](https://vitejs.dev)
- [Lucide React Icons](https://lucide.dev)
- [Google OAuth](https://developers.google.com/identity/protocols/oauth2)
- [Cloudflare R2](https://developers.cloudflare.com/r2/)
- [Turso Database](https://turso.tech)
- [Img Shields](https://shields.io)
- [Contrib.rocks](https://contrib.rocks)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

[contributors-shield]: https://img.shields.io/github/contributors/lucialv/ryo.cat.svg?style=for-the-badge
[contributors-url]: https://github.com/lucialv/ryo.cat/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/lucialv/ryo.cat.svg?style=for-the-badge
[forks-url]: https://github.com/lucialv/ryo.cat/network/members
[stars-shield]: https://img.shields.io/github/stars/lucialv/ryo.cat.svg?style=for-the-badge
[stars-url]: https://github.com/lucialv/ryo.cat/stargazers
[issues-shield]: https://img.shields.io/github/issues/lucialv/ryo.cat.svg?style=for-the-badge
[issues-url]: https://github.com/lucialv/ryo.cat/issues
[license-shield]: https://img.shields.io/github/license/lucialv/ryo.cat.svg?style=for-the-badge
[license-url]: https://github.com/lucialv/ryo.cat/blob/main/LICENSE
[product-screenshot]: images/screenshot.png
[React.js]: https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB
[React-url]: https://reactjs.org/
[Go.dev]: https://img.shields.io/badge/Go-00ADD8?style=for-the-badge&logo=go&logoColor=white
[Go-url]: https://golang.org/
[TypeScript.js]: https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white
[TypeScript-url]: https://www.typescriptlang.org/
[TailwindCSS.com]: https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white
[TailwindCSS-url]: https://tailwindcss.com/
[Vite.js]: https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E
[Vite-url]: https://vitejs.dev/
[Chi.router]: https://img.shields.io/badge/Chi-Router-00ADD8?style=for-the-badge&logo=go&logoColor=white
[Chi-url]: https://github.com/go-chi/chi
[JWT.io]: https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=JSON%20web%20tokens&logoColor=white
[JWT-url]: https://jwt.io/
[TanStack.query]: https://img.shields.io/badge/React_Query-FF4154?style=for-the-badge&logo=react-query&logoColor=white
[TanStack-url]: https://tanstack.com/query
[Turso.tech]: https://img.shields.io/badge/Turso-4F46E5?style=for-the-badge&logo=sqlite&logoColor=white
[Turso-url]: https://turso.tech
[Cloudflare.R2]: https://img.shields.io/badge/Cloudflare%20R2-F38020?style=for-the-badge&logo=cloudflare&logoColor=white
[Cloudflare-url]: https://developers.cloudflare.com/r2/
[Google.OAuth]: https://img.shields.io/badge/Google%20OAuth-4285F4?style=for-the-badge&logo=google&logoColor=white
[Google-url]: https://developers.google.com/identity/protocols/oauth2
