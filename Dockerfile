# Digi-Guard web sitesi: Node.js ile derlenir (görseller sharp ile kırpılır),
# nginx ile statik olarak sunulur.
FROM node:22-alpine AS build
WORKDIR /site
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY content content
COPY scripts scripts
COPY src src
COPY source source
# Kanonik bağlantılar, sitemap ve paylaşım görselleri için sitenin adresi.
ARG SITE_URL=https://www.digi-guard.com
ENV SITE_URL=$SITE_URL
RUN node -e "const f='content/site.json',c=JSON.parse(require('fs').readFileSync(f));c.site.url=process.env.SITE_URL.replace(/\/$/,'');require('fs').writeFileSync(f,JSON.stringify(c,null,2))" \
 && npm run build

FROM nginxinc/nginx-unprivileged:1.29-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /site/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1:8080/ || exit 1
