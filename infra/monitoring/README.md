# Monitoring

myManager exposes Prometheus-compatible metrics at `GET /metrics` (auth-gated by `METRICS_TOKEN`).

## Quick start (Docker Compose)

Add to your `docker-compose.yml`:

```yaml
prometheus:
  image: prom/prometheus:latest
  volumes:
    - ./infra/monitoring/prometheus.scrape.yml:/etc/prometheus/prometheus.yml:ro
  ports: ['9090:9090']

grafana:
  image: grafana/grafana:latest
  ports: ['3030:3000']
  environment:
    GF_SECURITY_ADMIN_PASSWORD: changeme
  volumes:
    - grafana-data:/var/lib/grafana
```

Then in Grafana:
1. Add Prometheus data source pointing at `http://prometheus:9090`
2. Import `prometheus.yml` (the dashboard JSON in this folder — file is named for legacy reasons)

## Available metrics

| Metric | Type | Description |
|---|---|---|
| `mymanager_http_requests_total{method,status}` | counter | All HTTP requests |
| `mymanager_active_users` | gauge | Non-deleted users |
| `mymanager_posts_total{status}` | counter | Posts grouped by status |
| `mymanager_publishing_queue_depth{queue}` | gauge | Queued/publishing posts per queue |
| `mymanager_subscriptions_active` | gauge | Subscriptions in ACTIVE status |
| `mymanager_api_uptime_seconds` | gauge | Process uptime |
| `mymanager_nodejs_heap_used_bytes` | gauge | V8 heap usage |

## Securing the endpoint

`METRICS_TOKEN` is required. Generate one with:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Set it in `.env` and pass via `x-metrics-token` header on the scrape (Prometheus
needs an HTTP proxy to translate `Authorization: Bearer` → `x-metrics-token`).
