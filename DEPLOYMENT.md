# Deployment Guide

## Vercel Deployment

This project is configured for easy deployment on Vercel. Follow these steps to deploy:

### 1. Prerequisites

- A Vercel account
- Git repository connected to your project

### 2. Deploy to Vercel

#### Option A: Using Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow the prompts to connect your project
```

#### Option B: Using Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your Git repository
4. Vercel will automatically detect Next.js and use the correct settings
5. Click "Deploy"

### 3. Environment Variables

1. Copy the environment variables example file:

   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file and fill in any required values.

3. For Vercel deployment, add environment variables in the Vercel dashboard under Project Settings > Environment Variables.

Note: Currently, no environment variables are required for the basic functionality, but the `.env.example` file shows potential variables for future features.

### 4. Build Configuration

The project includes a `vercel.json` file with:

- Build command: `npm run build`
- Output directory: `.next`
- Framework: `nextjs`
- API function timeout: 30 seconds

### 5. Post-Deployment

After deployment:

- Your app will be available at `https://your-project.vercel.app`
- API routes will be available at `/api/hello`, `/api/health`, and `/api/status`
- The app will automatically handle CORS for API requests

## Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Code Quality Tools

The project includes several code quality tools:

### Linting

```bash
# Check for linting issues
npm run lint

# Fix linting issues automatically
npm run lint:fix
```

### Formatting

```bash
# Format code with Prettier
npm run format

# Check formatting without making changes
npm run format:check
```

### Type Checking

```bash
# Run TypeScript type checking
npm run type-check
```

### Pre-commit Hooks

The project uses Husky and lint-staged to automatically:

- Run ESLint on staged files
- Format code with Prettier
- Prevent commits with linting errors

## Project Structure

```
src/
├── app/                 # Next.js App Router
│   ├── api/            # API routes
│   │   ├── hello/      # Hello world endpoint
│   │   ├── health/     # Health check endpoint
│   │   └── status/     # Status endpoint
│   ├── globals.css     # Global styles
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Home page
```

## API Endpoints

- `GET /api/hello` - Hello world message with timestamp
- `GET /api/health` - Health check with system information
- `GET /api/status` - Detailed status including memory usage

## Features

- **Simple UI**: Clean hello world page
- **API Endpoints**: Three basic endpoints for testing
- **Responsive Design**: Modern, mobile-friendly interface
- **Type Safety**: Full TypeScript support
- **Code Quality**: ESLint, Prettier, and pre-commit hooks
- **Performance**: Optimized for production with Next.js
