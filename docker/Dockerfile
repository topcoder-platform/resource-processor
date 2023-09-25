# Use the base image with Node.js
FROM node:18.16.1

# Copy the current directory into the Docker image
COPY . /resource-processor

# Set working directory for future use
WORKDIR /resource-processor

# Install the dependencies from package.json
RUN yarn install
RUN yarn lint
RUN yarn lint:fix
#RUN npm run build
#RUN npm run test

CMD node src/app.js