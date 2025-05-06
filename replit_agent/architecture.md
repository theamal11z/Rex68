# Architecture Overview

## Overview

Rex is a web application that simulates an emotionally intelligent terminal representing Mohsin Raja's inner voice. The application features a terminal-like interface where users can interact with "Rex", which uses the Gemini AI API to generate emotionally resonant responses.

The project is built with a modern full-stack JavaScript/TypeScript architecture:
- React frontend with a terminal-inspired UI
- Express backend serving both API endpoints and the static frontend
- PostgreSQL database with Drizzle ORM for data persistence
- Integration with Google's Gemini AI for generating responses

## System Architecture

The system follows a client-server architecture with clear separation of concerns:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  React Frontend │────▶│ Express Backend │────▶│    PostgreSQL   │
│                 │     │                 │     │    Database     │
│                 │◀────│                 │◀────│                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               │
                               ▼
                        ┌─────────────────┐
                        │                 │
                        │   Gemini AI     │
                        │      API        │
                        │                 │
                        └─────────────────┘
```

### Key Design Patterns

1. **Single-Page Application (SPA)**: The frontend is built as a React SPA, providing a smooth user experience without page reloads.

2. **RESTful API**: The backend exposes RESTful endpoints for data operations.

3. **Repository Pattern**: The application uses a storage interface to abstract database operations, making it easier to switch between different storage implementations.

4. **Environment-based Configuration**: Different configurations for development and production environments.

## Key Components

### Frontend

- **Tech Stack**: React, TypeScript, TailwindCSS, Framer Motion
- **UI Library**: Custom UI components built with Radix UI primitives and styled with TailwindCSS
- **State Management**: React Query for server state management
- **Routing**: Wouter for lightweight client-side routing

#### Key Frontend Components:

1. **Terminal Interface**: The main UI component that simulates a command-line interface.
2. **Message Component**: Displays messages with typing animations for responses.
3. **Admin Panel**: Protected interface for configuration and content management.

### Backend

- **Tech Stack**: Express.js, TypeScript
- **API Layer**: RESTful endpoints for messages, settings, and other data
- **Database Access**: Storage interface with implementations for PostgreSQL

#### Key Backend Components:

1. **Express Server**: Handles HTTP requests and serves the frontend in production.
2. **Routes**: API endpoints for interacting with the application data.
3. **Storage Interface**: Abstraction for database operations, currently implemented for PostgreSQL.
4. **Vite Integration**: Development server setup with HMR support.

### Database

- **Tech Stack**: PostgreSQL with Drizzle ORM
- **Schema**: Defined in `shared/schema.ts`
- **Migrations**: Managed through Drizzle Kit

#### Database Schemas:

1. **Users**: Authentication and user management
2. **Messages**: Stores conversation history
3. **Settings**: Application configuration and Rex's behavioral guidelines
4. **Contents**: Stores microblog posts and other content types
5. **Memories**: Stores conversational context and user-specific memory

### External Integrations

- **Gemini AI**: Integration with Google's Gemini API for generating conversational responses
- **Authentication**: Simple username/password authentication

## Data Flow

### Conversation Flow

1. User sends a message through the Terminal UI
2. Frontend sends the message to the backend API
3. Backend stores the message in the database
4. If necessary, the backend retrieves context from the memory table
5. The message and context are sent to the Gemini AI API
6. Gemini AI generates a response
7. Backend stores the response in the database
8. Response is returned to the frontend
9. Frontend displays the response with a typing animation

### Admin Flow

1. Admin accesses the protected `/admin` route
2. Admin authenticates
3. Admin can view and modify application settings, contents, and behavioral guidelines
4. Changes are persisted to the database

## External Dependencies

### Frontend Dependencies

- **@radix-ui/**: UI primitives for accessible components
- **@tanstack/react-query**: Data fetching and state management
- **framer-motion**: Animation library
- **tailwindcss**: Utility-first CSS framework
- **wouter**: Client-side routing

### Backend Dependencies

- **express**: Web framework
- **drizzle-orm**: TypeScript ORM
- **@neondatabase/serverless**: Database connector for PostgreSQL
- **zod**: Schema validation

### Infrastructure Dependencies

- **vite**: Build tool and development server
- **esbuild**: JavaScript bundler
- **typescript**: Type-checking and compilation

## Deployment Strategy

The application is configured for deployment on Replit, with:

1. **Build Process**:
   - Frontend: Bundled with Vite
   - Backend: Bundled with esbuild
   - Output: Single distributable with server and static assets

2. **Runtime Configuration**:
   - Environment variables for database connection and API keys
   - Production mode optimizations

3. **Database Deployment**:
   - Utilizing Neon PostgreSQL through `@neondatabase/serverless`
   - Schema migrations with Drizzle Kit

The deployment configuration in `.replit` indicates the application is set up for autoscale deployment with proper ports exposed.

## Development Workflow

1. **Local Development**:
   - `npm run dev`: Starts the development server with HMR
   - Backend server runs on port 5000
   - Vite dev server proxies API requests to the backend

2. **Type Checking**:
   - `npm run check`: Runs TypeScript compiler for type checking

3. **Database Operations**:
   - `npm run db:push`: Pushes schema changes to the database

4. **Production Build**:
   - `npm run build`: Creates optimized production build
   - `npm run start`: Starts the production server