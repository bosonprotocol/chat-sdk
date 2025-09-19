FROM --platform=linux/amd64 node:24-slim

RUN mkdir -p /home/node/mcp-server && chown -R node:node /home/node/mcp-server

USER node:node
WORKDIR /home/node/mcp-server

COPY --chown=node:node ./*.json ./

RUN npm ci --ignore-scripts --silent

ENV BIND_ADDRESS=0.0.0.0
ENV PORT=3000

COPY --chown=node:node ./src ./src

RUN npm run build

EXPOSE 3000
CMD ["npm", "run", "start:mcp-server:http"]


