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

## API Endpoints

The application provides several API endpoints:

- `GET /api/analyze?bookId={id}` - Analyzes a book from Project Gutenberg by ID
- `GET /api/hello` - Returns a hello world message with timestamp
- `GET /api/health` - Health check endpoint with system information
- `GET /api/status` - Detailed status information including memory usage

## Architecture

The application uses a modular architecture with the following key components:

### LLM Service Layer

- **AbstractLLMService**: Abstract base class defining the contract for LLM interactions
- **GroqLLMService**: Concrete implementation using the Groq API for text generation
- **Message Interface**: Type-safe message structure for LLM communication

The service layer follows SOLID principles:

- **Open/Closed Principle**: New LLM providers can be added without modifying existing code
- **Dependency Inversion**: High-level modules depend on abstractions, not concrete implementations

### Testing

Comprehensive unit tests are included for the LLM service:

- Mocked Groq SDK to prevent actual API calls during testing
- Happy path and error path testing
- Edge case handling (empty responses, API failures)

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
