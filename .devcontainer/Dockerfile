FROM mcr.microsoft.com/devcontainers/javascript-node:1-22-bookworm

# [Optional] Uncomment this section to install additional OS packages.
# RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
#     && apt-get -y install --no-install-recommends <your-package-list-here>

# [Optional] Uncomment if you want to install an additional version of node using nvm
# ARG EXTRA_NODE_VERSION=10
# RUN su node -c "source /usr/local/share/nvm/nvm.sh && nvm install ${EXTRA_NODE_VERSION}"

# [Optional] Uncomment if you want to install more global node modules
# RUN su node -c "npm install -g <your-package-list-here>"

# # Utilizamos la ultima versión estable de node al momento de crear este archivo
# FROM node:22.11
# # Instalamos pm2 de manera global
# RUN npm install pm2 -g
# # Instalamos el modulo pm2-logrotate
# RUN pm2 install pm2-logrotate
# # Creamos un directorio para nuestra aplicación
# RUN mkdir -p /opt/app
# # Establecemos el directorio de trabajo
# WORKDIR /opt/app
# # Copiamos los archivos package.json y package-lock.json a nuestro directorio de trabajo
# COPY package.json package-lock.json .
# # Instalamos las dependencias de nuestra aplicación
# RUN npm ci
# # Copiamos el resto de los archivos a nuestro directorio de trabajo
# COPY . .
# # Utilizaremos el comando pm2-runtime para iniciar nuestra aplicación en lugar de npm start 
# CMD ["pm2-runtime", "start", "ecosystem.config.js"]