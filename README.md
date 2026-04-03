# N8N Warehouse Assessment

A warehouse operations demo that combines a React frontend, n8n workflows, and Supabase-backed inventory logic.

The app provides a control panel for:

- running low-stock health checks
- receiving inbound stock
- processing outbound stock withdrawals
- chatting with a warehouse assistant through an n8n workflow

This README is based on the complete repo structure shared here:

`https://github.com/Codinplus31/N8n-warehouse-assessment`

## Overview

The project is split into three main parts:

- `src/`: the Vite + React frontend
- `workflows/`: exported n8n workflows
- `SQL/schema.sql`: SQL used for product manual vector matching

At runtime, the frontend sends `POST` requests to the n8n webhook endpoint, and the workflow routes each request by `action`.

Current frontend webhook target:

`https://codinplus30.app.n8n.cloud/webhook/warehouse`

## Features

- Health check dashboard for low-stock items
- Inbound inventory form for adding or updating stock
- Outbound inventory form for withdrawals and low-stock handling
- Chat panel for querying inventory and product-manual knowledge
- Organized inbound and outbound response cards instead of raw JSON
- Tailwind-powered UI with Vite + React

## Tech Stack

- React 19
- Vite 8
- Tailwind CSS 4
- n8n
- Supabase
- PostgreSQL with vector search support

## Repo Structure

```text
.
|-- SQL/
|   `-- schema.sql
|-- workflows/
|   |-- warehouse.json
|   |-- Product Manuals Vector ingestion.json
|   `-- error_handler.json
|-- src/
|   |-- App.jsx
|   |-- main.jsx
|   `-- styles.css
|-- index.html
|-- package.json
|-- postcss.config.js
|-- tailwind.config.js
`-- vite.config.js
```

## How It Works

The main workflow in `workflows/warehouse.json` exposes a `POST /warehouse` webhook and routes incoming requests using the `action` field.

Supported actions:

- `health_check`
- `inbound`
- `outbound`
- `chat`

Typical request flow:

1. The React app sends a JSON payload to the webhook.
2. n8n routes the payload to the matching branch.
3. Supabase nodes read or update inventory data.
4. n8n returns a structured JSON response.
5. The frontend renders the result in organized cards.

## Database Notes

`SQL/schema.sql` contains a `match_documents(...)` function used for semantic retrieval from product manual content.

It accepts:

- a `VECTOR(3072)` query embedding
- a `match_count`
- an optional JSON filter

It returns:

- `id`
- `content`
- `metadata`
- `similarity`

This is intended to support the manual-search or AI assistant portion of the solution.

## Frontend

The frontend lives in `src/App.jsx` and includes:

- a health check view
- inbound stock form
- outbound stock form
- chat assistant panel
- toast notifications
- response formatting for inbound and outbound actions

If you want to change the live n8n endpoint, update the `N8N_URL` constant in `src/App.jsx`.

## Local Development

Install dependencies:

```bash
npm install
```

Start the dev server:

```bash
npm run dev
```

Create a production build:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Example Payloads

Health check:

```json
{ "action": "health_check" }
```

Inbound:

```json
{
  "action": "inbound",
  "item_name": "X-1000 Power Processor",
  "quantity": 10,
  "category": "Electronics",
  "price": 199.99,
  "reorder_point": 5,
  "supplier_email": "supplier@example.com"
}
```

Outbound:

```json
{
  "action": "outbound",
  "item_name": "X-1000 Power Processor",
  "quantity": 2
}
```

Chat:

```json
{
  "action": "chat",
  "message": "What items are low on stock?",
  "session_id": "user-123"
}
```

## n8n Workflows

- `workflows/warehouse.json`: main warehouse orchestration workflow
- `workflows/Product Manuals Vector ingestion.json`: product manual ingestion flow
- `workflows/error_handler.json`: error-handling support workflow

## Notes

- The frontend is a client app only; the main business logic lives in n8n and Supabase.
- The webhook URL is currently hardcoded in the frontend.
- For production use, webhook URLs and credentials should be moved to environment-based configuration.

## License

No license file is currently included in the shared repo.
