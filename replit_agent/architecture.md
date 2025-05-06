# Architecture Overview

## Overview

This application is a full-stack web application called "Rex" that serves as an emotionally intelligent terminal representing a user's inner voice. It's built with a modern TypeScript stack featuring React for the frontend and Express.js for the backend, with data persistence in a PostgreSQL database.

The application follows a client-server architecture with clear separation between the frontend and backend components. The system includes integration with Google's Gemini AI API for generating conversational responses.

## System Architecture

The application follows a modern web application architecture:

```
┌─────────────┐     ┌─────────────┐     ┌───────────────┐
│             │     │             │     │               │
│  React      │────▶│  Express.js │────▶│  PostgreSQL   │
│  Frontend   │◀────│  Backend    │◀────│  Database     │
│             │     │             │     │               │
└─────────────┘     └─────────────┘     └───────────────┘
       ▲                   ▲
       │                   │
       ▼                   ▼
┌─────────────┐     ┌─────────────┐
│             │     │             │
│  Gemini     │     │  Vite       │
│  AI API     │     │  Dev Server │
│             │     │             │
└─────────────┘     └─────────────┘
```

### Key Architectural Decisions

1. **Monorepo Structure**: The project uses a monorepo approach with client, server, and shared code, enabling tight integration between frontend and backend while maintaining proper separation of concerns.

2. **API-First Design**: The backend exposes a RESTful API that the frontend consumes, allowing for potential future extensions (mobile apps, third-party integrations).

3. **TypeScript Throughout**: TypeScript is used across both frontend and backend, providing type safety and better developer experience.

4. **Schema Sharing**: Database schemas are defined in a shared directory, ensuring consistency between backend and frontend data structures.

5. **Modern Frontend Tooling**: Vite is used for fast development and optimized production builds.

6. **Component-Driven UI**: The frontend uses shadcn/ui components based on Radix UI primitives for accessibility and customizability.

## Key Components

### Frontend Architecture

The frontend is a React application organized as follows:

- **Pages**: Main application views (`Home.tsx`, `AdminPanel.tsx`)
- **Components**: Reusable UI components, with a terminal-themed design system
- **Hooks**: Custom React hooks for state management and side effects
- **Lib**: Utility functions and services for interacting with the backend and external APIs
- **Types**: TypeScript interfaces for type safety

Notable frontend features:
- Terminal-like user interface with a cyberpunk/hacker aesthetic
- React Query for data fetching and caching
- Framer Motion for animations
- React Hook Form for form handling
- Responsive design for mobile and desktop experiences

### Backend Architecture

The backend is an Express.js server with the following structure:

- **Routes**: API endpoints for handling client requests
- **Storage**: Data access layer for CRUD operations on the database
- **Middleware**: Request processing middleware for logging, error handling, etc.

The backend follows a layered architecture pattern:
- **Routes Layer**: Handles HTTP requests and responses
- **Storage Layer**: Abstracts database access
- **Schema Layer**: Defines data structures and validation rules

### Database Schema

The database schema includes the following main entities:

1. **Users**: Authentication and identity
   ```
   id: serial (primary key)
   username: text (unique)
   password: text
   ```

2. **Messages**: Storing conversation history
   ```
   id: serial (primary key)
   userId: text
   content: text
   isFromUser: integer (1 for user, 0 for Rex)
   timestamp: timestamp
   ```

3. **Settings**: System configuration and behavioral guidelines
   ```
   id: serial (primary key)
   key: text (unique)
   value: text
   ```

4. **Contents**: Microblog posts and other content
   ```
   id: serial (primary key)
   type: text
   content: text
   timestamp: timestamp
   ```

5. **Memories**: User context for AI personalization
   ```
   id: serial (primary key)
   userId: text
   context: jsonb
   lastUpdated: timestamp
   ```

### API Structure

The backend exposes the following main API endpoints:

1. **Authentication**
   - `POST /api/auth/admin`: Admin login endpoint

2. **Conversation Management**
   - `GET /api/messages/:userId`: Retrieve conversation history
   - `POST /api/messages`: Save a new message

3. **Settings Management**
   - `GET /api/settings`: Get all settings
   - `GET /api/settings/:key`: Get a specific setting
   - `PATCH /api/settings/:key`: Update a setting

4. **Content Management**
   - `GET /api/contents`: Get all contents
   - `GET /api/contents/:type`: Get content by type
   - `POST /api/contents`: Create new content

5. **AI Integration**
   - `GET /api/gemini-key`: Retrieve Gemini API key

## Data Flow

The application's primary data flow is for the conversational interface:

1. User enters a message in the terminal interface
2. Frontend sends the message to the backend API
3. Backend stores the user message in the database
4. Backend prepares context for AI request (emotional tone, memory, settings)
5. Backend makes a request to the Gemini API with this context
6. Gemini API returns a response
7. Backend stores the AI response in the database
8. Backend returns both messages to the frontend
9. Frontend displays the conversation with typing animation

Other key data flows include:
- Admin authentication for accessing the admin panel
- CRUD operations for managing settings and content
- Persistence of user context/memory for personalized interactions

## External Dependencies

The application integrates with the following external services:

1. **Google Gemini API**: Used for generating AI responses in the conversation
   - Integration is managed through `client/src/lib/gemini.ts`
   - API key is stored as a setting in the database and retrieved via `/api/gemini-key`

2. **Neon Database**: Serverless PostgreSQL database
   - The application uses `@neondatabase/serverless` for database connections
   - Connection URL is stored in environment variables

## Deployment Strategy

The application is configured for deployment with specific optimizations:

1. **Build Process**:
   - Frontend: Vite bundles the React application into static assets
   - Backend: esbuild compiles the TypeScript server code to JavaScript
   - Combined: Both parts are bundled into a single distributable package

2. **Environment Configuration**:
   - Development: Separate Vite dev server with HMR and an Express API server
   - Production: Express serves both the API and the static frontend assets

3. **Platform Configuration**:
   - The project includes Replit-specific configurations for development and deployment
   - Setup for autoscaling and zero-downtime deployments

4. **Runtime Management**:
   - The server runs in Node.js environment
   - Database connections are managed for optimal resource usage

5. **Static Assets**:
   - Frontend assets are compiled and served from `/dist/public`
   - Server code is compiled to `/dist/index.js`

6. **Security Considerations**:
   - API keys are not exposed to the client (fetched via backend)
   - Authentication for admin panel access
   - Request logging for monitoring and debugging