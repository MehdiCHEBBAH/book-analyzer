# Book Analyzer

A full-stack Next.js application that analyzes classic books from Project Gutenberg using AI-powered LLM services to visualize character relationships, extract themes, and provide interactive literary analysis.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm, yarn, pnpm, or bun
- Groq API key ([Get one here](https://console.groq.com/))
- Upstash Redis account ([Get one here](https://upstash.com/))

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd book-analyzer
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   # Create .env file
   cp .env.example .env

   # Edit .env with your credentials
   nano .env
   ```

4. **Start the development server**

   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📋 Environment Variables

Create a `.env` file in the root directory with the following variables:

### Required Variables

```bash
# Groq API Configuration
GROQ_API_KEY=your_groq_api_key_here

# Upstash Redis Configuration
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_redis_token_here
```

### Optional Variables

```bash
# LLM Model Configuration
GROQ_MODEL=openai/gpt-oss-120b  # Default: openai/gpt-oss-120b
GROQ_TEMPERATURE=0.7            # Default: 0.7 (0.0-1.0)

# Application Configuration
NODE_ENV=development            # Default: development
```

## 🎯 Features

### 📚 Book Analysis

- **AI-Powered Character Analysis**: Extract and analyze character relationships using advanced LLM processing
- **Interactive Character Network**: D3.js force-directed graph visualization of character interactions
- **Theme Detection**: Automated identification of key themes and motifs
- **Plot Summary**: AI-generated concise plot summaries
- **Key Events Timeline**: Chronological analysis of significant story events
- **Word Count Statistics**: Comprehensive text analysis metrics

### 🗣️ Chat Interface

- **Context-Aware AI Assistant**: Chat with an AI that has full knowledge of the analyzed book
- **Character Discussions**: Ask questions about specific characters and their relationships
- **Theme Exploration**: Discuss literary themes and their significance
- **Plot Analysis**: Get insights into story structure and narrative elements
- **Real-time Responses**: Instant AI-powered literary analysis

### 🚀 Performance & Caching

- **Redis-Based Caching**: Intelligent caching of book text and analysis results
- **7-Day TTL**: Automatic cache expiration for optimal performance
- **Cache Management API**: Check status and clear cache entries
- **Error Resilience**: Graceful handling of cache and API failures

### 🎨 Interactive Visualizations

- **D3.js Character Network**: Force-directed graph with drag-and-drop interaction
- **Dynamic Node Sizing**: Character importance reflected in node size
- **Relationship Strength Visualization**: Link thickness indicates relationship intensity
- **Responsive Design**: Optimized for desktop and mobile devices
- **Smooth Animations**: Fluid transitions and hover effects

## 🏗️ Architecture

### Agent-Based Design

The application uses a sophisticated agent-based architecture that separates different AI behaviors into specialized, purpose-built agents:

#### **BookAnalysisAgent**

- **Purpose**: Performs structured analysis of book content
- **Responsibilities**:
  - Character relationship extraction and mapping
  - Plot summary generation
  - Theme identification and categorization
  - Key event analysis and timeline creation
  - Character importance ranking
- **Output**: Structured JSON data optimized for visualization
- **System Prompt**: Focused on returning machine-readable analysis results

#### **BookChatAgent**

- **Purpose**: Provides conversational interface for book discussions
- **Responsibilities**:
  - Answering questions about characters, themes, and plot
  - Providing literary analysis and insights
  - Engaging in meaningful book discussions
  - Context-aware responses based on book content
- **Output**: Natural language responses
- **System Prompt**: Focused on conversational, educational responses

### Service Layer Architecture

#### **LLM Service Layer**

- **AbstractLLMService**: Abstract base class defining the contract for LLM interactions
- **GroqLLMService**: Concrete implementation using the Groq API for fast text generation
- **Message Interface**: Type-safe message structure for LLM communication
- **Error Handling**: Comprehensive error handling and retry logic

#### **Data Services**

- **GutenbergService**: Handles fetching and processing book content from Project Gutenberg
- **CacheService**: Redis-based caching layer with automatic TTL management
- **Agent Factory**: Creates and configures specialized agents with appropriate system prompts

### Design Principles

The architecture follows several key principles:

- **Single Responsibility**: Each agent has a specific, well-defined purpose
- **Open/Closed Principle**: New agents can be added without modifying existing code
- **Dependency Inversion**: High-level modules depend on abstractions, not concrete implementations
- **Separation of Concerns**: Analysis, chat, and data fetching are clearly separated
- **Extensibility**: New LLM providers or agent types can be easily added
- **Type Safety**: Full TypeScript support with comprehensive type definitions

## 🔌 API Endpoints

### Core Analysis

- `GET /api/analyze?bookId={id}` - Analyzes a book from Project Gutenberg by ID
- `POST /api/chat` - Chat endpoint for book discussions (requires messages array and bookId)

### Cache Management

- `GET /api/cache?action=status&bookId={id}` - Check cache status for a book
- `GET /api/cache?action=clear&bookId={id}` - Clear cache for a specific book
- `DELETE /api/cache?bookId={id}` - Clear cache for a specific book (alternative method)

### System Health

- `GET /api/hello` - Returns a hello world message with timestamp
- `GET /api/health` - Health check endpoint with system information
- `GET /api/status` - Detailed status information including memory usage

### API Usage Examples

#### Analyze a Book

```bash
curl "http://localhost:3000/api/analyze?bookId=1342"
```

#### Chat with Book Assistant

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "bookId": "1342",
    "messages": [
      {"role": "user", "content": "Tell me about Elizabeth Bennet"}
    ]
  }'
```

#### Check Cache Status

```bash
curl "http://localhost:3000/api/cache?action=status&bookId=1342"
```

## 🧪 Testing

The project includes comprehensive testing with Jest and React Testing Library:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- CharacterNetwork.test.tsx
```

### Test Coverage

- **Unit Tests**: Service layer, API endpoints, and utility functions
- **Integration Tests**: End-to-end API functionality
- **Component Tests**: React component behavior and user interactions
- **Mocked Dependencies**: External services (Groq API, Redis) are mocked for reliable testing

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server with Turbopack
npm run build        # Build for production with Turbopack
npm run start        # Start production server

# Code Quality
npm run lint         # Check for linting issues
npm run lint:fix     # Fix linting issues automatically
npm run format       # Format code with Prettier
npm run format:check # Check formatting without making changes
npm run type-check   # Run TypeScript type checking

# Testing
npm test             # Run all tests
npm run test:watch   # Run tests in watch mode
```

### Code Quality Tools

- **ESLint**: Code linting with Next.js and TypeScript rules
- **Prettier**: Code formatting with consistent style
- **Husky**: Git hooks for pre-commit quality checks
- **lint-staged**: Run linters only on staged files
- **TypeScript**: Full type safety throughout the application

### Pre-commit Hooks

The project uses Husky and lint-staged to automatically:

- Run ESLint on staged files
- Format code with Prettier
- Prevent commits with linting errors

## 🚀 Deployment

### Vercel Deployment (Recommended)

1. **Connect Repository**
   - Push your code to GitHub/GitLab
   - Connect repository to Vercel

2. **Configure Environment Variables**
   - Add all required environment variables in Vercel dashboard
   - Ensure `GROQ_API_KEY` and Redis credentials are set

3. **Deploy**
   - Vercel will automatically detect Next.js and deploy
   - Your app will be available at `https://your-project.vercel.app`

### Manual Deployment

```bash
# Build the application
npm run build

# Start production server
npm start
```

## 📊 Performance

### Caching Strategy

- **Book Text Caching**: Raw book text cached for 7 days
- **Analysis Result Caching**: Completed analysis cached indefinitely
- **Automatic Cache Management**: Handles cache misses and updates
- **Cache Status API**: Monitor and manage cache entries

### Optimization Features

- **Turbopack**: Fast bundling and development
- **Next.js 15**: Latest performance optimizations
- **React 19**: Concurrent features and improved rendering
- **D3.js Optimization**: Efficient graph rendering and updates

## 🔒 Security

### Input Validation

- **Book ID Sanitization**: Comprehensive validation and sanitization
- **SQL Injection Prevention**: Parameterized queries and input filtering
- **XSS Protection**: Content Security Policy and input sanitization
- **Rate Limiting**: Basic rate limiting implementation

### Environment Security

- **Environment Variables**: Sensitive data stored in environment variables
- **API Key Protection**: Secure handling of external API credentials
- **Error Handling**: Graceful error handling without information leakage

## 🛠️ Technologies Used

### Frontend

- **Next.js 15**: React framework with App Router
- **React 19**: Latest React with concurrent features
- **TypeScript**: Full type safety
- **Tailwind CSS**: Utility-first CSS framework
- **D3.js**: Data visualization library

### Backend & AI

- **Groq API**: Fast LLM inference
- **AI SDK**: Modern AI development toolkit
- **Upstash Redis**: Serverless Redis for caching
- **Axios**: HTTP client for external APIs

### Development Tools

- **Jest**: Testing framework
- **React Testing Library**: Component testing
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Husky**: Git hooks

### Data Sources

- **Project Gutenberg**: Public domain books
- **Custom AI Agents**: Specialized analysis and chat agents

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Guidelines

- Follow TypeScript best practices
- Write comprehensive tests for new features
- Update documentation for API changes
- Use conventional commit messages
- Ensure all tests pass before submitting PR

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Project Gutenberg**: For providing access to public domain literature
- **Groq**: For fast and reliable LLM inference
- **Upstash**: For serverless Redis caching
- **D3.js**: For powerful data visualization capabilities
- **Next.js Team**: For the excellent React framework

## 📞 Support

For support and questions:

- Create an issue in the GitHub repository
- Check the [documentation](https://nextjs.org/docs)
- Review the [API documentation](#api-endpoints)

---

**Happy Book Analyzing! 📚✨**
