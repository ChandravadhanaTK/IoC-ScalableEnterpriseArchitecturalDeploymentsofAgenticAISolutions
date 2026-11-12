FROM oven/bun:1.2-debian

# Install git and ca-certificates for repository operations
RUN apt-get update && apt-get install -y git ca-certificates && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Configure non-root user with UID 1000 (standard for Hugging Face Spaces)
RUN useradd -m -u 1000 user && \
    mkdir -p /app && \
    chown -R user:user /app

# Copy dependency manifests
COPY --chown=user:user package.json bun.lock* bunfig.toml* tsconfig.json* ./

# Switch to user and install dependencies
USER user
RUN bun install

# Copy application source code and backlog tasks
COPY --chown=user:user . .

# Set environment variables for Hugging Face Spaces
ENV PORT=7860
ENV BACKLOG_HOST=0.0.0.0
ENV NODE_ENV=production

# Hugging Face Spaces exposes port 7860
EXPOSE 7860

# Start Backlog.md web browser interface
CMD ["bun", "run", "cli", "browser", "--port", "7860", "--no-open"]
