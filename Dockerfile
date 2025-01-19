# ----------------------
# Stage 1: Build
# ----------------------
    FROM node:18-alpine AS build

    # Set working directory
    WORKDIR /usr/src/app
    
    # Copy package files
    COPY package*.json ./
    
    # Install all dependencies (including dev dependencies)
    RUN npm install
    
    # Copy the rest of the source code
    COPY . .
    
    # Generate the Prisma client (make sure your prisma schema exists in the image)
    RUN npx prisma generate
    
    # Build the TypeScript app (e.g., output to /dist)
    RUN npm run build
    
    
    # ----------------------
    # Stage 2: Production
    # ----------------------
    FROM node:18-alpine
    
    WORKDIR /usr/src/app
    
    # Copy package files for production installation
    COPY package*.json ./
    
    # Install only production dependencies
    RUN npm install --omit=dev
    
    # Copy the compiled output from the build stage
    COPY --from=build /usr/src/app/dist ./dist
    
    # Copy the generated Prisma client files from the build stage
    COPY --from=build /usr/src/app/node_modules/.prisma ./node_modules/.prisma
    COPY --from=build /usr/src/app/node_modules/@prisma ./node_modules/@prisma
    
    # Expose the app’s port (adjust to your app’s config, e.g., 3000)
    EXPOSE 3000
    
    # Start the application (make sure your "start" script points to the correct file, e.g., node dist/index.js)
    CMD ["npm", "run", "start"]
    