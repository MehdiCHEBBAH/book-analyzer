# Book Analyzer

A full-stack application that analyzes books from Project Gutenberg to visualize character relationships using AI-powered LLM services.

## Getting Started

1. Copy the environment variables example file:

   ```bash
   cp .env.example .env
   ```

2. Set up your environment variables:

   ```bash
   # Copy the example environment file
   cp .env.example .env

   # Edit .env and add your Groq API key
   # Get your API key from https://console.groq.com/
   ```

3. Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `src/app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Environment Variables

The application requires the following environment variables:

- `GROQ_API_KEY` - Your Groq API key (required for LLM functionality)
- `GROQ_MODEL` - Optional: Customize the LLM model (default: `openai/gpt-oss-20b`)
- `GROQ_TEMPERATURE` - Optional: Control response randomness (default: `0.7`)
- `GROQ_MAX_TOKENS` - Optional: Maximum tokens in response (default: `1024`)
- `UPSTASH_REDIS_REST_URL` - Your Upstash Redis REST URL (required for caching)
- `UPSTASH_REDIS_REST_TOKEN` - Your Upstash Redis REST token (required for caching)

## Features

### Book Analysis

- **Character Relationship Analysis**: AI-powered extraction of character interactions and relationships
- **Plot Summary**: Automated generation of concise plot summaries
- **Theme Identification**: Detection of key themes and motifs
- **Word Count Analysis**: Statistical analysis of book content
- **Caching System**: Redis-based caching for improved performance and reduced API calls

### Interactive Visualizations

- **D3.js Character Network**: Force-directed graph showing character relationships
- **Dynamic Node Sizing**: Node size proportional to character interaction frequency
- **Relationship Strength Visualization**: Link thickness indicates relationship strength
- **Interactive Exploration**: Drag nodes to explore the network

### Chat Interface

- **AI-Powered Book Assistant**: Conversational interface for book discussions
- **Context-Aware Responses**: Chat assistant has access to book analysis context
- **Real-time Interaction**: Instant responses to questions about characters, themes, and plot
- **Persistent Chat History**: Maintains conversation context throughout the session

## API Endpoints

The application provides several API endpoints:

- `GET /api/analyze?bookId={id}` - Analyzes a book from Project Gutenberg by ID
- `POST /api/chat` - Chat endpoint for book discussions (requires messages array)
- `GET /api/cache?action=status&bookId={id}` - Check cache status for a book
- `GET /api/cache?action=clear&bookId={id}` - Clear cache for a specific book
- `DELETE /api/cache?bookId={id}` - Clear cache for a specific book (alternative method)
- `GET /api/hello` - Returns a hello world message with timestamp
- `GET /api/health` - Health check endpoint with system information
- `GET /api/status` - Detailed status information including memory usage

## Architecture

The application uses a modern, agent-based architecture that separates different LLM behaviors into distinct, specialized agents. This design provides flexibility, maintainability, and clear separation of concerns.

### Agent-Based Architecture

The system implements a flexible agent pattern where different AI behaviors are encapsulated in specialized agents:

#### **BookAnalysisAgent**

- **Purpose**: Performs structured analysis of book content
- **Responsibilities**:
  - Character relationship extraction
  - Plot summary generation
  - Theme identification
  - Key event analysis
- **Output**: Structured JSON data for visualization
- **System Prompt**: Focused on returning machine-readable analysis results

#### **BookChatAgent**

- **Purpose**: Provides conversational interface for book discussions
- **Responsibilities**:
  - Answering questions about characters, themes, and plot
  - Providing literary analysis and insights
  - Engaging in meaningful book discussions
- **Output**: Natural language responses
- **System Prompt**: Focused on conversational, educational responses

### Service Layer

#### **LLM Service Layer**

- **AbstractLLMService**: Abstract base class defining the contract for LLM interactions
- **GroqLLMService**: Concrete implementation using the Groq API for text generation
- **Message Interface**: Type-safe message structure for LLM communication

#### **Data Services**

- **GutenbergService**: Handles fetching and processing book content from Project Gutenberg with caching
- **CacheService**: Redis-based caching layer for book text and analysis results
- **Agent Factory**: Creates and configures specialized agents with appropriate system prompts

### Design Principles

The architecture follows several key principles:

- **Single Responsibility**: Each agent has a specific, well-defined purpose
- **Open/Closed Principle**: New agents can be added without modifying existing code
- **Dependency Inversion**: High-level modules depend on abstractions, not concrete implementations
- **Separation of Concerns**: Analysis, chat, and data fetching are clearly separated
- **Extensibility**: New LLM providers or agent types can be easily added

### Caching System

The application implements a comprehensive caching system using Upstash Redis to improve performance and reduce external API calls:

#### **Cache Features**

- **Book Text Caching**: Caches raw book text from Project Gutenberg with 7-day TTL
- **Analysis Result Caching**: Caches completed book analysis results
- **Automatic Cache Management**: Handles cache misses and updates automatically
- **Cache Status API**: Check cache status and manage cache entries
- **Error Resilience**: Graceful handling of cache failures

#### **Cache Keys**

- `book:{bookId}:text` - Raw book text content
- `book:{bookId}:analysis` - Complete analysis results

#### **Cache Operations**

- **GET**: Retrieve cached data with automatic fallback to source
- **SET**: Store data with configurable TTL (default: 7 days)
- **DELETE**: Remove specific cache entries
- **EXISTS**: Check if data is cached

### Testing

Comprehensive unit tests are included for the LLM service and caching system:

- Mocked Groq SDK to prevent actual API calls during testing
- Mocked Upstash Redis client for cache testing
- Happy path and error path testing
- Edge case handling (empty responses, API failures, cache failures)

## Technologies Used

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Visualization**: D3.js for interactive character network graphs
- **AI/LLM**: Groq API with custom agent architecture
- **Data Source**: Project Gutenberg for public domain books
- **Caching**: Upstash Redis for high-performance caching
- **Testing**: Jest, React Testing Library
- **Styling**: Tailwind CSS with custom animations and gradients

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
- [D3.js Documentation](https://d3js.org/) - powerful data visualization library.
- [Groq API Documentation](https://console.groq.com/docs) - fast LLM inference.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
