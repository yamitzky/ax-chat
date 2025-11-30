# axchat

> Demo of an AI chat application leveraging @ax-llm/ax

This is an AI chat application using [@ax-llm/ax](https://axllm.dev/). It supports multiple LLM providers (Gemini, Claude) via Google Vertex AI and features streaming responses and client-side persistence using IndexedDB (via Dexie.js).

## Features

-   **Unified LLM Interface** - Consistent API across multiple providers via [@ax-llm/ax](https://axllm.dev/)
-   **Multi-LLM Support** - Supports Gemini (2.5 Pro, Flash, 3.0 Pro) and Claude (Sonnet, Opus, Haiku) via Vertex AI
-   **Streaming Responses** - Real-time message streaming including display of thought processes
-   **Web Search Integration** - Enhanced responses with web search functionality
-   **Client-Side Persistence** - Full offline support via IndexedDB (Dexie.js)
-   **UI** - Built with shadcn/ui, Radix UI, and Tailwind CSS

## Tech Stack

### Frontend

-   **Next.js 16** (App Router) - React framework with server/client components
-   **React 19** - Latest React with enhanced concurrency features
-   **TypeScript** - Type-safe development
-   **shadcn/ui** - High-quality UI components built on Radix UI
-   **Tailwind CSS v4** - Utility-first CSS framework

### AI & Backend

-   **@ax-llm/ax** - Unified LLM SDK supporting multiple providers
-   **Google Vertex AI** - AI platform for Gemini and Claude
-   **google-auth-library** - Vertex AI authentication

### Data Persistence

-   **Dexie.js** - IndexedDB ORM with TypeScript support

## Getting Started

### Prerequisites

-   Node.js 22 or higher
-   pnpm package manager
-   Google Cloud project with Vertex AI enabled

### Installation

```bash
pnpm install
```

### Configuration

Create a `.env` file from the sample:

```bash
cp example.env .env
```

Edit `.env` with your Google Cloud credentials:

```env
GOOGLE_PROJECT_ID=your-project-id
GOOGLE_LOCATION=asia-northeast1
```

### Google Cloud Authentication

Set up Application Default Credentials (ADC):

```bash
# Option 1: Use gcloud CLI (recommended for local development)
gcloud auth application-default login
```

**Required IAM Permissions**:

-   Vertex AI User (for both Gemini and Claude access)

### Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Production Build

```bash
pnpm build
pnpm start
```

### Linting

```bash
# Run linter
pnpm lint

# Run typecheck
pnpm typecheck
```

## Project Structure

```
axchat/
├── app/                    # Next.js App Router
│   ├── api/chat/          # Streaming API endpoint
│   ├── page.tsx           # Main chat page
│   └── providers.tsx      # React Query & Repository DI
├── features/chat/          # Chat feature module
│   ├── components/        # UI Layer (View)
│   ├── hooks/             # Logic Layer
│   │   ├── facade/        # Facade Hooks (ViewModel)
│   │   ├── queries/       # Query Hooks (Read)
│   │   └── commands/      # Command Hooks (Write)
│   ├── infrastructure/    # DB Definition
│   └── types/             # Type Definition
├── lib/                   # Feature-independent utilities
│   ├── ai/                # AI client configuration
│   ├── stream/            # Streaming utilities
│   └── session/           # Session management
└── components/ui/          # Shared UI components
```

## License

MIT
