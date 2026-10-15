# Build context: the skill's scripts/ directory. Engines and licenses are BYO.
FROM eclipse-temurin:21-jdk-jammy AS java
FROM node:24.18.0-bookworm-slim
COPY --from=java /opt/java/openjdk /opt/java/openjdk
ENV JAVA_HOME=/opt/java/openjdk
ENV PATH="/opt/java/openjdk/bin:${PATH}"
RUN apt-get update && apt-get install -y --no-install-recommends procps util-linux ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /opt/rea-skill
COPY package.json package-lock.json ./
# Default omits platform/instrumentation add-ons. Opt in explicitly when needed.
ARG INCLUDE_OPTIONAL=false
RUN if [ "$INCLUDE_OPTIONAL" = "true" ]; then npm ci --no-audit --no-fund; else npm ci --omit=optional --no-audit --no-fund; fi
COPY runtime.mjs rea.mjs ./
USER node
ENV GHIDRA_HEADLESS_MAXMEM=2G
ENTRYPOINT ["node", "/opt/rea-skill/rea.mjs"]
CMD ["mcp"]
