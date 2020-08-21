FROM node:10-stretch-slim as base
RUN groupadd -r appuser && \
	useradd --create-home --gid appuser --home-dir /app --no-log-init --system appuser
RUN apt-get update && apt-get install -y imagemagick librsvg2-bin && rm -rf /var/lib/apt/lists/*

ARG COMMIT="(not set)"
ARG LASTMOD="(not set)"
ENV COMMIT=$COMMIT
ENV LASTMOD=$LASTMOD
WORKDIR /app
USER appuser
COPY --chown=appuser:appuser . .
RUN yarn install
EXPOSE 4000
ENV PORT 4000
CMD ["yarn", "start"]

