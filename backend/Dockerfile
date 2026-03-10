FROM node:18-alpine

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar todas as dependências (incluindo devDependencies para o build TypeScript)
RUN npm install --include=dev

# Copiar código fonte
COPY . .

# Compilar TypeScript
RUN npm run build

# Remover devDependencies após o build para imagem menor
RUN npm prune --omit=dev

# Porta do servidor
EXPOSE 3000

# Iniciar servidor
CMD ["npm", "start"]
