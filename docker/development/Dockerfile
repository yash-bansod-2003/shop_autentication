# Use the official Node.js image as our base
FROM node:24

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json first to leverage Docker cache
COPY package.json ./

# Install app dependencies [it runs while building the image]
RUN npm install --ignore-scripts

# Copy the rest of our app's source code into the container
COPY . .

# Expose the port the app will run on
EXPOSE 80

# The command to run our app [it runs when we run the container]
CMD ["npm","run", "dev"]