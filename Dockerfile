FROM node:24-bookworm-slim

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=10000 \
    CAFFERO_DATABASE=/var/data/caffero.sqlite \
    CAFFERO_UPLOADS_DIRECTORY=/var/data/uploads

WORKDIR /app
COPY --chown=node:node package.json server.mjs content.mjs ./
COPY --chown=node:node public ./public
RUN mkdir -p /var/data && chown node:node /var/data

USER node
EXPOSE 10000
CMD ["node", "server.mjs"]
