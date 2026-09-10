# System Architecture

## Overview

The Antarctic Digital Twin platform is a monorepo-based application for real-time monitoring, analysis, and simulation of India's Antarctic research stations (Maitri and Bharati).

## Architecture Diagram

Browser → Next.js Frontend → Express API → PostgreSQL (Supabase)
                                        → Supabase Auth
                                        → Supabase Storage
                                        → Supabase Realtime
                                        → ML Service (future)

## Key Principles

1. **Separation of Concerns**: Frontend and backend communicate via documented REST APIs
2. **Shared Contracts**: Zod schemas and TypeScript types are shared via workspace packages
3. **Domain-Driven Modules**: Each domain (telemetry, alerts, etc.) is self-contained
4. **RBAC**: Backend enforces all authorization — frontend only controls visibility
5. **Realtime**: WebSocket/Supabase Realtime for live telemetry and alerts
