#!/usr/bin/env bash
# Bring the copilot up on a local kind cluster. Re-run to redeploy: the init
# Job seeds the database only if it does not exist yet, so the audit log and
# events survive a redeploy. Set RESET=1 to wipe and reseed.
# Needs: docker, kind, kubectl, and Ollama on the host listening on all
# interfaces (OLLAMA_HOST=0.0.0.0 ollama serve).
set -euo pipefail
cd "$(dirname "$0")/.."

CLUSTER=${CLUSTER:-copilot}
TAG=${TAG:-$(git rev-parse --short HEAD 2>/dev/null || date +%Y%m%d%H%M)}

echo "== build image opscopilot:$TAG"
docker build -t "opscopilot:$TAG" -t opscopilot:local --build-arg "APP_VERSION=$TAG" -f deploy/Dockerfile .

if ! kind get clusters | grep -qx "$CLUSTER"; then
  echo "== create cluster $CLUSTER with NodePorts 30080/30090 mapped to localhost"
  cat <<KIND | kind create cluster --name "$CLUSTER" --config=-
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
  - role: control-plane
    extraPortMappings:
      - { containerPort: 30080, hostPort: 30080 }
      - { containerPort: 30090, hostPort: 30090 }
KIND
fi
kind load docker-image "opscopilot:$TAG" --name "$CLUSTER"
kind load docker-image opscopilot:local --name "$CLUSTER"

# Where is the host from inside the kind node? The docker bridge gateway.
HOST_IP=$(docker network inspect kind -f '{{(index .IPAM.Config 0).Gateway}}' 2>/dev/null || echo 172.17.0.1)
echo "== host (Ollama) reachable at $HOST_IP"
curl -fsS "http://$HOST_IP:11434/api/version" >/dev/null || {
  echo "Ollama is not reachable on $HOST_IP:11434. Start it with: OLLAMA_HOST=0.0.0.0 ollama serve"; exit 1; }

echo "== apply"
kubectl apply -f deploy/k8s/00-namespace-config.yaml
kubectl -n opscopilot create configmap copilot-config --from-env-file=<(
  sed -n '/^data:/,/^---/p' deploy/k8s/00-namespace-config.yaml | grep -E '^  [A-Z_]+:' | sed -E 's/^  ([A-Z_]+): "(.*)"/\1=\2/' \
  | sed "s#OLLAMA_BASE_URL=.*#OLLAMA_BASE_URL=http://$HOST_IP:11434#"
) --dry-run=client -o yaml | kubectl apply -f -
# The only secret: generated here, never committed.
if ! kubectl -n opscopilot get secret copilot-secrets >/dev/null 2>&1; then
  kubectl -n opscopilot create secret generic copilot-secrets --from-literal="BUSINESS_API_TOKEN=$(openssl rand -hex 24)"
fi
# Network policy egress to the host must match the discovered address.
kubectl -n opscopilot patch networkpolicy allow-dns-and-host --type=json \
  -p="[{\"op\":\"replace\",\"path\":\"/spec/egress/1/to/0/ipBlock/cidr\",\"value\":\"$HOST_IP/32\"}]" >/dev/null

kubectl -n opscopilot delete job copilot-init --ignore-not-found
if [ "${RESET:-0}" = "1" ]; then
  sed 's#\[ -f /data/ops.db \] || ##' deploy/k8s/10-init-job.yaml | kubectl apply -f -
else
  kubectl apply -f deploy/k8s/10-init-job.yaml
fi
kubectl -n opscopilot wait --for=condition=complete job/copilot-init --timeout=600s
kubectl apply -f deploy/k8s/20-business-api.yaml -f deploy/k8s/30-copilot-api.yaml -f deploy/k8s/40-worker.yaml -f deploy/k8s/60-observability.yaml
kubectl -n opscopilot set image deployment/copilot-api api="opscopilot:$TAG"
kubectl -n opscopilot set image deployment/business-api business-api="opscopilot:$TAG"
kubectl -n opscopilot set image deployment/copilot-worker worker="opscopilot:$TAG"
# Queue-depth scaling only where the KEDA CRDs exist.
if kubectl get crd scaledobjects.keda.sh >/dev/null 2>&1; then kubectl apply -f deploy/k8s/50-keda-scaledobject.yaml; fi
kubectl -n opscopilot rollout status deployment/copilot-api --timeout=300s
kubectl -n opscopilot get pods
echo "== ready: curl localhost:30080/readyz ; prometheus at localhost:30090"
echo "== rollback: kubectl -n opscopilot rollout undo deployment/copilot-api"
