FROM --platform=linux/amd64 node:24-slim

RUN mkdir -p /home/node/mcp-server && chown -R node:node /home/node/mcp-server

USER node:node
WORKDIR /home/node/mcp-server

COPY --chown=node:node ./*.json ./

RUN npm ci --ignore-scripts --silent
# ENV NODE_ENV=production
# ENV SIGNER_ADDRESS=0x70997970C51812dc3A010C7d01b50e0d17dc79C8
# ENV CONFIG_IDS=local-31337-0
# ENV CONFIG_ID=local-31337-0
ENV BIND_ADDRESS=0.0.0.0
# ENV INFURA_IPFS_PROJECT_ID=dummy
# ENV INFURA_IPFS_PROJECT_SECRET=dummy
# ENV IPFS_GATEWAY=http://127.0.0.1:5001
ENV PORT=3000

COPY --chown=node:node ./src ./src
RUN npm run build

EXPOSE 3000
CMD ["npm", "run", "start:mcp-server:http"]


