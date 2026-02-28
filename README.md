# RunMQ Dashboard

Web-based monitoring and management dashboard for [RunMQ](https://github.com/runmq) message queues.

## Features

- **Real-time queue monitoring** — Live message counts, consumer stats, and queue states with configurable auto-refresh
- **Queue detail view** — Per-queue metrics: total, ready, unacknowledged, retry, and DLQ message counts
- **Retry management** — Enable/disable automatic retries, configure retry delays per queue
- **Dead letter queue (DLQ)** — Toggle DLQ routing, inspect messages with full payload and headers, reprocess or clear
- **Message inspector** — Browse retry and DLQ messages with expandable JSON payloads, headers, and routing keys
- **Dark & light mode** — Clean, minimal UI with full theme support
- **JWT authentication** — Secure login with 24h token expiration

## Screenshots

_Coming soon_

## Getting Started

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/)
- A running [RabbitMQ](https://www.rabbitmq.com/) instance with the **Management Plugin** enabled

### Setup

1. Clone the repository:

```bash
git clone https://github.com/runmq/Dashboard.git
cd Dashboard
```

2. Update the environment variables in `docker-compose.yml` to point to your RabbitMQ instance:

```yaml
RABBITMQ_HOST: your-rabbitmq-host
RABBITMQ_PORT: 15672
RABBITMQ_MANAGEMENT_USER: your-user
RABBITMQ_MANAGEMENT_PASSWORD: your-password
JWT_SECRET: your-secret-key
```

3. Start the dashboard:

```bash
docker compose up --build
```

4. Create an admin user:

```bash
docker compose exec backend node scripts/create-user.js admin yourPassword admin
```

5. Open [http://localhost:3000](http://localhost:3000) to start managing your queues

## Development

To run without Docker:

```bash
# Backend
cd backend && npm install && npm run start:dev

# Frontend
cd frontend && npm install && npm run dev
```

## License

[MIT](LICENSE)
