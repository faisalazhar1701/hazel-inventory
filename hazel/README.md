# Hazel

A headless, API-first inventory & product lifecycle system.

## Architecture

This monorepo follows enterprise modular design principles and is organized as follows:

- **Frontend**: React + TypeScript (paid UI)
- **Backend**: NestJS
- **Packages**: Shared types and API client utilities

## Project Structure

```
hazel/
├── apps/
│   ├── frontend/      # React + TypeScript frontend application
│   └── backend/       # NestJS backend application
├── packages/
│   ├── shared-types/  # Shared TypeScript types and interfaces
│   └── api-client/    # API client utilities and SDK
├── docs/              # Documentation
└── docker/            # Docker configuration files
```

