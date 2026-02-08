FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./
# Força uma instalação limpa das dependências de build (Tailwind/PostCSS)
RUN npm install

# Argumento de build para a URL da API
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Copia o código do frontend (isso vai ignorar o que estiver no .dockerignore)
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
