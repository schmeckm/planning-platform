# OPP Frontend — embedded build (Cockpit + Portal from HAE monorepo).
# Build context MUST be the HAE root (parent of open-planning-platform/).
#   docker compose -f open-planning-platform/docker-compose.yml --profile embedded build frontend
FROM node:20-alpine AS build
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

COPY open-planning-platform/package.json open-planning-platform/pnpm-lock.yaml open-planning-platform/pnpm-workspace.yaml open-planning-platform/tsconfig.base.json ./open-planning-platform/
COPY open-planning-platform/packages ./open-planning-platform/packages
COPY open-planning-platform/apps/frontend ./open-planning-platform/apps/frontend

COPY cockpit ./cockpit
COPY portal/frontend ./portal/frontend
COPY styles ./styles
COPY config ./config
COPY process-definitions ./process-definitions

WORKDIR /app/open-planning-platform
RUN pnpm install --frozen-lockfile --filter @PCP/frontend...
ARG VITE_OPP_API_URL=http://127.0.0.1:3100
ENV VITE_OPP_API_URL=$VITE_OPP_API_URL
RUN pnpm --filter @PCP/frontend build

FROM nginx:1.27-alpine AS runner
COPY open-planning-platform/apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/open-planning-platform/apps/frontend/dist /usr/share/nginx/html

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
