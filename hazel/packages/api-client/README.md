# API Client

A typed API client package for the frontend application.

## Purpose

This package provides a typed, type-safe wrapper around the backend APIs. It abstracts HTTP communication and provides a clean interface for the frontend to interact with the Hazel backend.

## Implementation

The API client will use either `fetch` or `axios` for HTTP requests and will be fully typed using TypeScript to ensure type safety between the frontend and backend.

## Usage

```typescript
import { ApiClient } from '@hazel/api-client';

const client = new ApiClient({
  baseURL: 'http://localhost:3000',
});

// Typed API methods will be available here
```

