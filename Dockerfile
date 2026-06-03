FROM --platform=linux/amd64 node:24-slim

RUN mkdir -p /home/node/mcp-server && chown -R node:node /home/node/mcp-server

USER node:node
WORKDIR /home/node/mcp-server

COPY --chown=node:node ./*.json ./

RUN npm ci --ignore-scripts --silent

# BIND_ADDRESS defaults to 127.0.0.1 (safe). Set it to 0.0.0.0 explicitly
# (e.g. via docker-compose) only when the container is reached through your own
# authenticated proxy. This server holds a wallet key: never expose it publicly
# or unauthenticated. The wallet key must be supplied at runtime as the
# BOSON_XMTP_PRIVATE_KEY secret (not baked into the image).
ENV PORT=3000

COPY --chown=node:node ./src ./src

RUN npm run build

EXPOSE 3000


CMD ["npm", "run", "start:mcp-server:http"]