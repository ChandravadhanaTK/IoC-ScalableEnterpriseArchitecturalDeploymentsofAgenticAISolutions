# Capstone Deliverables

**Five artifacts that demonstrate enterprise architecture completeness**

---

## 1. Architecture Diagram

**Focus:** Layers, components, trust boundaries and integrations

> 📄 **Diagrams of the *implemented* system** (with ASCII + Mermaid versions,
> component map, class diagram, state machine and request flows) live in
> [`ARCHITECTURE.md`](ARCHITECTURE.md). The diagram below is the
> forward-looking enterprise target architecture.

### System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER INTERFACE LAYER                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Web UI      │  │  CLI Tool    │  │  API Endpoints       │  │
│  │  (React/     │  │  (Python     │  │  (FastAPI/Flask)     │  │
│  │   Streamlit) │  │   Click)     │  │                      │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↕ HTTPS/API
┌─────────────────────────────────────────────────────────────────┐
│                    AGENT ORCHESTRATION LAYER                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  TripPlannerAgent (Core Controller)                       │  │
│  │  ┌────────────┐  ┌────────────┐  ┌──────────────────┐   │  │
│  │  │ Perception │→│ Reasoning  │→│ Action Executor  │   │  │
│  │  │ Module     │  │ Engine     │  │                  │   │  │
│  │  └────────────┘  └────────────┘  └──────────────────┘   │  │
│  │         ↕              ↕               ↕                 │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │  Memory & State Management                         │  │  │
│  │  │  - Session State                                   │  │  │
│  │  │  - User Preferences Cache                          │  │  │
│  │  │  - Itinerary History                               │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↕ Service Calls
┌─────────────────────────────────────────────────────────────────┐
│                      INTEGRATION LAYER                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  LLM Service │  │  Search API  │  │  Maps/Navigation     │  │
│  │  (OpenAI/    │  │  (SerpAPI/   │  │  (Google Maps/       │  │
│  │   Claude)    │  │   Google)    │  │   OSRM)              │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Places API  │  │  Weather API │  │  Cache/Queue         │  │
│  │  (Google     │  │  (OpenWeather│  │  (Redis/             │  │
│  │   Places)    │  │   Map)       │  │   RabbitMQ)          │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↕ Data Storage
┌─────────────────────────────────────────────────────────────────┐
│                      DATA LAYER                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  PostgreSQL  │  │  Redis       │  │  Object Storage      │  │
│  │  (User Data, │  │  (Sessions,  │  │  (S3/MinIO for       │  │
│  │   Itineraries│  │   Caching)   │  │   cached results)    │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Trust Boundaries

1. **Public Internet → API Gateway**: TLS 1.3 encryption, rate limiting, WAF
2. **API Gateway → Application Layer**: JWT authentication, input validation
3. **Application → External APIs**: API key management, request signing, circuit breakers
4. **Application → Data Layer**: Network isolation, encrypted connections, least-privilege access

### Key Components

| Component | Responsibility | Technology |
|-----------|---------------|------------|
| **TripPlannerAgent** | Core orchestration and decision making | Python, LangChain |
| **Perception Module** | Input parsing and validation | Pydantic |
| **Reasoning Engine** | LLM-based decision making | OpenAI/Claude API |
| **Action Executor** | Tool invocation and result processing | Python asyncio |
| **Memory Manager** | State persistence and retrieval | Redis/PostgreSQL |
| **Search Integrator** | Multi-source activity search | SerpAPI, Google Places |
| **Route Optimizer** | TSP/VRP optimization | OR-Tools, scipy |
| **Exporter** | Multi-format output generation | Jinja2, ReportLab |

---
---

## 2. Agent Workflow Design

**Focus:** Roles, states, tools, handoffs, approvals and failure paths

### Agent States

```python
class AgentState(Enum):
    IDLE = "idle"                          # Waiting for new request
    PARSING_INPUT = "parsing_input"        # Extracting user preferences
    SEARCHING_ACTIVITIES = "searching"     # Querying external APIs
    FILTERING_RESULTS = "filtering"        # Applying constraints
    OPTIMIZING_ROUTE = "optimizing"        # Solving route optimization
    GENERATING_ITINERARY = "generating"    # Creating output
    FORMATTING_OUTPUT = "formatting"       # Preparing export
    COMPLETED = "completed"                # Success state
    FAILED = "failed"                      # Error state
    RETRYING = "retrying"                  # Retry logic active
```

### Agent Roles

| Role | Responsibility | Component |
|------|---------------|-----------|
| **Input Parser** | Extracts structured data from user input | `InputParser` |
| **Activity Researcher** | Searches and collects activity options | `ActivitySearcher` |
| **Filter Agent** | Applies user constraints and preferences | `ActivityFilter` |
| **Optimization Agent** | Solves route and budget optimization | `RouteOptimizer` |
| **Itinerary Generator** | Creates detailed time-stamped schedule | `ItineraryBuilder` |
| **Quality Reviewer** | Validates output quality and completeness | `QualityChecker` |
| **Format Specialist** | Exports to requested formats | `OutputFormatter` |

### Workflow State Machine

```
┌─────────┐
│  IDLE   │
└────┬────┘
     │ User Request
     ↓
┌───────────────────┐
│ PARSING_INPUT     │ ← Validate inputs, extract preferences
---

## 3. Deployment Strategy

**Focus:** Runtime, scaling, resilience, environments and release

### Deployment Environments

```
Development → Staging → Production
[Local]      [Cloud]    [Cloud]
Docker       K8s(1)    K8s(3+)
```

### Environment Configuration

| Environment | Purpose | Infrastructure | Data |
|-------------|---------|---------------|------|
| **Development** | Local development | Docker Compose | SQLite |
| **Staging** | Integration testing | Kubernetes (1 replica) | PostgreSQL, Redis |
| **Production** | Live traffic | Kubernetes (3+ replicas) | PostgreSQL HA, Redis Cluster |

### Runtime Architecture

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: trip-planner-agent
spec:
  replicas: 3
  selector:
    matchLabels:
      app: trip-planner
  template:
    spec:
      containers:
      - name: agent
        image: tripplanner/agent:latest
        ports:
        - containerPort: 8000
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "2000m"
        env:
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: api-secrets
              key: openai-key
```

### Scaling Strategy

#### Horizontal Scaling Metrics

| Metric | Scale Up | Scale Down | Cooldown |
|--------|----------|------------|----------|
| CPU Usage | >70% (2 min) | <30% (5 min) | 5 min |
| Request Queue | >50 pending | 0 (10 min) | 3 min |
| Response Time | >5s p95 | <1s p95 | 5 min |

### Resilience Patterns
### Release Strategy

#### CI/CD Pipeline

```yaml
name: Deploy Pipeline
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
---

## 4. Security Model

**Focus:** Identity, authorization, secrets, privacy, guardrails and audit

### Authentication Architecture

```python
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext

# JWT Configuration
SECRET_KEY = "your-secret-key"  # Store in environment
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    """Validate JWT token and return authenticated user"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401)
    except JWTError:
        raise HTTPException(status_code=401)
    
    user = get_user(username)
    if user is None:
        raise HTTPException(status_code=401)
    return user
```

### Authorization Model

```python
class Role(Enum):
    USER = "user"
    PREMIUM = "premium"
    ADMIN = "admin"

# Role-Permission Mapping
ROLE_PERMISSIONS = {
    Role.USER: ["plan_trip", "view_own_itineraries"],
    Role.PREMIUM: ["plan_trip", "view_own_itineraries"],
    Role.ADMIN: ["plan_trip", "view_all_itineraries", "admin_access"]
}

def require_permission(permission: str):
### Secrets Management

```python
from google.cloud import secretmanager

class SecretsManager:
    """Centralized secrets management"""
    
    def get_secret(self, secret_id: str, version: str = "latest") -> str:
        """Retrieve secret from Secret Manager"""
        name = f"projects/{self.project_id}/secrets/{secret_id}/versions/{version}"
        response = self.client.access_secret_version(request={"name": name})
        return response.payload.data.decode("UTF-8")
    
    def get_api_key(self, service: str) -> str:
        """Get API key for external service"""
        return self.get_secret(f"{service}_api_key")

# Usage
secrets = SecretsManager()
openai_key = secrets.get_api_key("openai")
```

### Privacy Controls

---

## 5. Monitoring Dashboard Design

**Focus:** Health, trace, quality, safety, cost and business outcomes

### Monitoring Architecture

```
Application Metrics → Prometheus → Grafana Dashboard
Distributed Traces → Jaeger → Trace Analysis
Logs → ELK Stack → Log Analytics
Alerts → AlertManager → PagerDuty/Slack
```

### Key Performance Indicators

#### 1. Health Metrics

```python
class HealthMetrics:
    """Application health indicators"""
    
    def get_health_status(self) -> dict:
        """Return current health status"""
        return {
            "status": "healthy" if self.is_healthy() else "unhealthy",
            "checks": {
                "cpu": self.check_cpu(),
                "memory": self.check_memory(),
#### 3. Safety Metrics

```python
class SafetyMetrics:
    """Safety and compliance monitoring"""
    
    def __init__(self):
        self.metrics = {
            "blocked_requests": 0,
            "rate_limit_hits": 0,
            "invalid_input_attempts": 0,
            "suspicious_activity_score": 0.0
        }
    
    def record_security_event(self, event_type: str, severity: str):
        """Record security-related event"""
        if event_type == "rate_limit":
            self.metrics["rate_limit_hits"] += 1
        elif event_type == "invalid_input":
            self.metrics["invalid_input_attempts"] += 1
```

#### 4. Cost Metrics

```python
class CostMetrics:
    """Track operational costs"""
    
    def __init__(self):
        self.costs = {
            "llm_api_calls": 0.0,
            "search_api_calls": 0.0,
            "maps_api_calls": 0.0,
            "compute_cost": 0.0
        }
    
    def record_llm_cost(self, tokens_used: int, model: str):
### Grafana Dashboard Configuration

```json
{
  "dashboard": {
    "title": "Trip Planner Agent - Production",
    "panels": [
      {
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{method}} {{endpoint}}"
          }
        ]
      },
      {
        "title": "Response Time (P95)",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))"
          }
        ]
      },
      {
        "title": "Error Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total{status=~\"5..\"}[5m]) / rate(http_requests_total[5m]) * 100"
          }
        ]
      },
      {
        "title": "LLM API Costs",
        "type": "graph",
        "targets": [
          {
            "expr": "sum(rate(llm_cost_total[1h]))"
          }
        ]
      }
    ]
  }
}
```

### Alert Rules

```yaml
groups:
  - name: trip_planner_alerts
    rules:
      # High error rate
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 2m
        labels:
## Summary

This document presents five comprehensive enterprise architecture deliverables for the Trip Planner Agent:

1. **Architecture Diagram**: Complete system architecture with layers, components, trust boundaries, and integration points
2. **Agent Workflow Design**: State machine, roles, handoffs, approval gates, and failure path handling
3. **Deployment Strategy**: Multi-environment setup, scaling policies, resilience patterns, and CI/CD pipeline
4. **Security Model**: Authentication, authorization, secrets management, privacy controls, guardrails, and audit logging
5. **Monitoring Dashboard Design**: Health checks, distributed tracing, quality metrics, safety monitoring, cost tracking, and business outcomes

These artifacts demonstrate enterprise-grade architecture completeness with production-ready patterns for scalability, security, and observability.

---

**Document Version**: 1.0  
**Last Updated**: 2024  
**Status**: Complete
          severity: critical
        annotations:
          summary: "High error rate detected"
      
      # High latency
      - alert: HighLatency
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 5
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High P95 latency"
      
      # API cost spike
      - alert: HighAPICost
        expr: sum(rate(llm_cost_total[1h])) > 10
        for: 10m
        labels:
          severity: warning
```

### Metrics Summary Table

| Category | Metric | Target | Alert Threshold |
|----------|--------|--------|----------------|
| **Health** | Uptime | 99.9% | <99.5% |
| **Health** | CPU Usage | <70% | >80% |
| **Health** | Memory Usage | <80% | >85% |
| **Trace** | P95 Latency | <3s | >5s |
| **Trace** | P99 Latency | <5s | >8s |
| **Quality** | Success Rate | >95% | <90% |
| **Quality** | User Rating | >4.0/5.0 | <3.5/5.0 |
| **Safety** | Blocked Requests | 0 | >10/hour |
| **Cost** | Cost/Itinerary | <$0.50 | >$1.00 |
| **Business** | Daily Active Users | Growing | >-5% WoW |

### Compliance and Reporting

```python
class ComplianceReporter:
    """Generate compliance and business reports"""
    
    def generate_daily_report(self) -> dict:
        """Generate daily operations report"""
        return {
            "date": datetime.utcnow().date().isoformat(),
            "total_requests": self.get_total_requests(),
            "successful_plans": self.get_successful_plans(),
            "failed_plans": self.get_failed_plans(),
            "avg_response_time": self.get_avg_response_time(),
            "total_cost": self.calculate_total_cost(),
            "active_users": self.get_active_users(),
            "security_incidents": self.get_security_incidents()
        }
    
    def generate_monthly_report(self) -> dict:
        """Generate monthly business report"""
        return {
            "month": datetime.utcnow().strftime("%Y-%m"),
            "total_users": self.get_total_users(),
            "new_users": self.get_new_users(),
            "revenue": self.calculate_revenue(),
            "user_retention": self.calculate_retention(),
            "ltv": self.calculate_ltv(),
            "churn_rate": self.calculate_churn(),
            "nps": self.get_nps_score()
        }
```

---
        """Record LLM API cost"""
        cost_per_1k = {"gpt-4": 0.03, "gpt-3.5-turbo": 0.002, "claude-3": 0.015}
        cost = (tokens_used / 1000) * cost_per_1k.get(model, 0.01)
        self.costs["llm_api_calls"] += cost
    
    def get_cost_per_itinerary(self) -> float:
        """Calculate average cost per generated itinerary"""
        if self.metrics["total_itineraries"] == 0:
            return 0.0
        return sum(self.costs.values()) / self.metrics["total_itineraries"]
```

#### 5. Business Outcome Metrics

```python
class BusinessMetrics:
    """Track business success indicators"""
    
    def __init__(self):
        self.metrics = {
            "total_users": 0,
            "active_users_daily": 0,
            "active_users_monthly": 0,
            "avg_session_duration_minutes": 0,
            "user_retention_rate": 0.0,
            "net_promoter_score": 0,
            "revenue_monthly": 0.0
        }
    
    def calculate_ltv(self, avg_revenue_per_user: float, retention_rate: float) -> float:
        """Calculate Lifetime Value"""
        return avg_revenue_per_user / (1 - retention_rate)
```

---
                "disk": self.check_disk(),
                "database": self.check_database(),
                "external_apis": self.check_external_apis()
            }
        }
```

#### 2. Quality Metrics

```python
class QualityMetrics:
    """Output quality indicators"""
    
    def __init__(self):
        self.metrics = {
            "total_itineraries": 0,
            "avg_activities_per_trip": 0,
            "avg_user_rating": 0.0,
            "completion_rate": 0.0,
            "error_rate": 0.0
        }
    
    def record_itinerary(self, itinerary: Itinerary, user_rating: int):
        """Record itinerary quality metrics"""
        self.metrics["total_itineraries"] += 1
        # Update rolling averages...
```

---
```python
class PrivacyManager:
    """Ensure user data privacy and GDPR compliance"""
    
    def anonymize_user_data(self, user_data: dict) -> dict:
        """Remove or hash PII fields"""
        anonymized = user_data.copy()
        for field in ['email', 'phone', 'address', 'credit_card']:
            if field in anonymized:
                anonymized[field] = self.hash_pii(anonymized[field])
        return anonymized
    
    def delete_user_data(self, user_id: str):
        """Complete user data deletion (right to be forgotten)"""
        delete_itineraries(user_id)
        delete_user_preferences(user_id)
        log_audit_event("user_data_deleted", {"user_id": user_id})
    
    def hash_pii(self, value: str) -> str:
        """One-way hash for PII fields"""
        return hashlib.sha256(value.encode()).hexdigest()
```

### Security Guardrails

```python
class SecurityGuardrails:
    """Prevent misuse and ensure safe operation"""
    
    def __init__(self):
        self.rate_limiter = RateLimiter()
        self.input_validator = InputValidator()
    
    async def validate_request(self, user_id: str, request: dict) -> bool:
        """Multi-layer security validation"""
        # 1. Rate limiting
        if not self.rate_limiter.check(user_id, limit=100, window=3600):
            raise HTTPException(status_code=429, detail="Rate limit exceeded")
        
        # 2. Input validation
        if not self.input_validator.is_safe(request):
            raise HTTPException(status_code=400, detail="Invalid input")
        
        return True

class RateLimiter:
    """Token bucket rate limiter"""
    
    def check(self, user_id: str, limit: int, window: int) -> bool:
        """Check if user is within rate limit"""
        now = time.time()
        if user_id not in self.buckets:
            self.buckets[user_id] = {'tokens': limit, 'last_update': now}
        
        bucket = self.buckets[user_id]
        time_passed = now - bucket['last_update']
        bucket['tokens'] = min(limit, bucket['tokens'] + (time_passed * limit / window))
        
        if bucket['tokens'] >= 1:
            bucket['tokens'] -= 1
            return True
        return False
```

### Audit Logging

```python
class AuditEventType(Enum):
    USER_LOGIN = "user_login"
    TRIP_PLANNED = "trip_planned"
    API_CALL = "api_call"
    SECURITY_EVENT = "security_event"

class AuditLogger:
    """Comprehensive audit logging for compliance"""
    
    def log_event(self, event_type: AuditEventType, user_id: str, details: dict):
        """Log security-relevant event"""
        log_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "event_type": event_type.value,
            "user_id": user_id,
            "details": details
        }
        self.logger.info(json.dumps(log_entry))

# Global instance
audit_logger = AuditLogger()
```

---
    """Decorator to require specific permission"""
    def decorator(func):
        async def wrapper(*args, current_user: User = Depends(get_current_user), **kwargs):
            user_perms = ROLE_PERMISSIONS.get(current_user.role, [])
            if permission not in user_perms:
                raise HTTPException(status_code=403)
            return await func(*args, current_user=current_user, **kwargs)
        return wrapper
    return decorator
```

---
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run tests
        run: pytest --cov=src
      - name: Upload coverage
        uses: codecov/codecov-action@v2
  
  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Build Docker image
        run: docker build -t tripplanner/agent:${{ github.sha }} .
      - name: Push to registry
        run: docker push tripplanner/agent:${{ github.sha }}
  
  deploy-production:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to production
        run: kubectl apply -f k8s/production/
```

#### Deployment Methods

| Method | Use Case | Rollback |
|--------|----------|----------|
| **Blue-Green** | Major releases | Instant switch |
| **Canary** | Gradual rollout | Auto-rollback if >1% errors |
| **Rolling Update** | Standard updates | Automatic rollback on failure |

---

#### Circuit Breaker

```python
@circuit(failure_threshold=10, recovery_timeout=60)
async def call_external_api(endpoint: str, params: dict):
    """Circuit breaker for external API calls"""
    async with httpx.AsyncClient() as client:
        response = await client.get(endpoint, params=params, timeout=10)
        response.raise_for_status()
        return response.json()
```

#### Retry with Backoff

```python
@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    retry=retry_if_exception_type((TimeoutError, ConnectionError))
)
async def resilient_api_call(url: str):
    """Automatic retry with exponential backoff"""
    async with httpx.AsyncClient() as client:
        return await client.get(url, timeout=10)
```

#### Bulkhead Isolation

```python
class BulkheadManager:
    """Isolate critical resources with semaphores"""
    
    def __init__(self):
        self.llm_semaphore = Semaphore(10)      # Max 10 LLM calls
        self.search_semaphore = Semaphore(20)   # Max 20 searches
        self.db_semaphore = Semaphore(30)       # Max 30 DB ops
```

---
└─────────┬─────────┘
          │
          ↓
┌───────────────────┐
│ SEARCHING_ACTIVITIES │ ← Call search APIs, gather results
└─────────┬─────────┘
          │
          ↓
┌───────────────────┐
│ FILTERING_RESULTS │ ← Apply budget, rating, category filters
└─────────┬─────────┘
          │
          ↓
┌───────────────────┐
│ OPTIMIZING_ROUTE  │ ← Solve TSP/VRP, allocate budget
└─────────┬─────────┘
          │
          ↓
┌───────────────────┐
│ GENERATING_ITINERARY ← Create time slots, add details
└─────────┬─────────┘
          │
          ↓
┌───────────────────┐
│ FORMATTING_OUTPUT │ ← Generate JSON/Markdown/PDF
└─────────┬─────────┘
          │
          ↓
┌─────────┐
│COMPLETED│
└─────────┘
```

### Handoffs Between Roles

```python
class WorkflowOrchestrator:
    """Manages handoffs between agent roles"""
    
    def __init__(self):
        self.parser = InputParser()
        self.searcher = ActivitySearcher()
        self.filter = ActivityFilter()
        self.optimizer = RouteOptimizer()
        self.builder = ItineraryBuilder()
        self.reviewer = QualityChecker()
        self.formatter = OutputFormatter()
    
    async def execute_workflow(self, user_input: str) -> Itinerary:
        """Execute complete agent workflow with handoffs"""
        
        # Handoff 1: Parse → Search
        preferences = self.parser.parse(user_input)
        raw_activities = await self.searcher.search(preferences)
        
        # Handoff 2: Search → Filter
        filtered = self.filter.apply_constraints(raw_activities, preferences)
        
        # Handoff 3: Filter → Optimize
        optimized_route = self.optimizer.optimize(filtered, preferences)
        
        # Handoff 4: Optimize → Build
        itinerary = self.builder.build(optimized_route, preferences)
        
        # Handoff 5: Build → Review
        validation_result = self.reviewer.validate(itinerary)
        if not validation_result.is_valid:
            # Retry loop
            return await self._handle_retry(validation_result.issues)
        
        # Handoff 6: Review → Format
        return self.formatter.format(itinerary)
```

### Approval Gates

1. **Input Validation Gate**: User input must be parseable and valid
2. **Minimum Results Gate**: At least 3 activities must be found
3. **Budget Compliance Gate**: Total cost must be within 5% of budget
4. **Quality Gate**: Itinerary must pass review (>80% completeness score)
5. **Safety Gate**: All activities must be accessible and safe

### Failure Paths

| Failure Point | Detection Method | Recovery Action |
|--------------|-----------------|-----------------|
| API timeout | Request timeout exception | Retry with exponential backoff (3 attempts) |
| No activities found | Empty result set | Expand search radius or suggest alternatives |
| Budget exceeded | Cost calculation error | Reduce activity quality tier or quantity |
| Route optimization fails | Solver timeout | Use greedy nearest-neighbor heuristic |
| LLM rate limit | 429 response | Implement request queuing with delays |
| Invalid user input | Parser validation error | Request clarification from user |
| Network failure | Connection error | Use cached/fallback data sources |

### Retry Logic

```python
class RetryPolicy:
    MAX_RETRIES = 3
    BACKOFF_FACTOR = 2
    INITIAL_DELAY = 1  # seconds
    
    @retry(
        stop=stop_after_attempt(MAX_RETRIES),
        wait=wait_exponential(multiplier=INITIAL_DELAY, min=1, max=10),
        retry=retry_if_exception_type((TimeoutError, APIRateLimitError))
    )
    async def execute_with_retry(self, func, *args, **kwargs):
        """Execute function with automatic retry"""
        return await func(*args, **kwargs)
```