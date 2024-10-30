# File Management API

## Description
An API for securely managing files, allowing users to upload, encrypt, download, and delete files. The API also offers user management features, including registration, authentication, and data export in compliance with GDPR.

---

## Installation and Execution Instructions

1. **Clone the repository**:
   ```bash
   git clone <repository URL>
   cd file-management-api
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables: Create a .env file in the project root with the following variables**:
    ```bash
    PORT=5000
    MONGO_URI=mongodb://mongo:27017/file_management
    JWT_SECRET=<your_jwt_secret>
    DECRYPTED_DIR=./storage/decrypted
    TEMP_DECRYPTED_DIR=./storage/temp_decrypted
    ENCRYPTED_DIR=./storage/encrypted
    UPLOADS_DIR=./storage/uploads
    ```

4. **Run the application**:
   ```bash
   npm start
   ```
   **To run the server in development mode, use**:
   ```bash
   npm run dev
   ```

5. **Run tests**:
   ```bash
   npm test
   ```


## API Endpoints

### FileController

- **`POST /api/v1/files/upload`** - Upload and encrypt a file.
  - **Request**: FormData with the file.
  - **Response**: JSON with file ID and name.

- **`GET /api/v1/files/`** - Retrieve all files of the authenticated user.
  - **Response**: JSON with the list of files.

- **`GET /api/v1/files/download/:id`** - Download and decrypt a file.
  - **Response**: The file for download.

- **`DELETE /api/v1/files/:id`** - Delete a specific file.
  - **Response**: Status code 204 with no content.

### UserController

- **`POST /api/v1/users/register`** - Register a new user.
  - **Request**: JSON with `username`, `email`, and `password`.
  - **Response**: JSON with the registered user's data.

- **`POST /api/v1/users/login`** - Authenticate user and return a token.
  - **Request**: JSON with `email` and `password`.
  - **Response**: JSON with the JWT token.

- **`GET /api/v1/users/:id`** - Find a user by ID.
  - **Response**: JSON with user data.

- **`DELETE /api/v1/users/:id`** - Delete a specific user.
  - **Response**: JSON with confirmation message.

- **`DELETE /api/v1/users/delete-account`** - Delete the user and all associated files.
  - **Response**: JSON confirming the deletion of user data and files.

- **`GET /api/v1/users/export-data`** - Export user data as a zip file.
  - **Response**: Downloadable zip file.

## Technical Decisions Justification

- **DTOs (Data Transfer Objects)**: DTOs are used to structure and validate user data before it reaches the database. This approach improves code organization, maintainability, and consistency by ensuring that only valid data is saved.

- **Controller and Service Structure**: Separating business logic into services while using controllers to handle HTTP requests promotes modularity. This structure enables code reusability, making it easier to maintain and extend as the project grows.

- **Validation with express-validator**: Using `express-validator` to enforce data integrity ensures that data is validated before any processing occurs in the API. This validation reduces the potential for errors and enhances security by preventing invalid data from reaching the backend.

- **Use of Mongoose and MongoDB**: MongoDB's non-relational structure complements the flexibility required in this application, and Mongoose provides a clear data model for organizing schema definitions, validations, and query logic.

- **Repository Pattern**: Implementing the repository pattern provides an additional layer between the service and the data model. This pattern abstracts database queries, promotes cleaner code, and facilitates the addition of other data sources if needed.

- **Best Practices Applied**:
  - **SOLID Principles**: Code design follows SOLID principles to ensure scalability and readability.
  - **Environment-Based Configuration**: Configuration values are stored in environment variables, enabling flexibility across different deployment environments.
  - **Error Handling with Custom Errors**: Custom error handling improves debugging and provides clear error responses in the API, enhancing usability for consumers.

## Scalability with Docker and Kubernetes

### Scalability with Docker

To handle a higher volume of traffic, Docker allows us to create multiple replicas of the API container, thus distributing the load among several instances.

**Basic configuration for scalability with Docker Compose:**

1. Add a `docker-compose.yml` with replica specification:

```yaml
services:
    api:
    build:
        context: .
    ports:
        - "5000:5000"
    environment:
        MONGO_URI: mongodb://mongo:27017/file_management
    deploy:
        replicas: 5
        resources:
        limits:
            cpus: "0.5"
            memory: 512M
        restart_policy:
        condition: on-failure

    mongo:
    image: mongo:latest
    ports:
        - "27017:27017"
    volumes:
        - mongo_data:/data/db

volumes:
    mongo_data:
```

2. With this configuration, you can run multiple replicas of your application by executing:
   
```bash
docker-compose up --scale api=5
```

### Scalability with Kubernetes

1. Create a Deployment and a Service for the API: Kubernetes allows dynamic scaling of containers based on load.
**File: `deployment.yaml`**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: file-management-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: file-management-api
  template:
    metadata:
      labels:
        app: file-management-api
    spec:
      containers:
      - name: api
        image: file-management-api:latest
        ports:
        - containerPort: 5000
        resources:
          limits:
            memory: "512Mi"
            cpu: "0.5"
        env:
        - name: MONGO_URI
          value: "mongodb://mongo-service:27017/file_management"
```

2. To apply the deployment configuration:

```bash
kubectl apply -f deployment.yaml
```

3. **File: `service.yaml`**

  ```yaml
  apiVersion: v1
  kind: Service
  metadata:
  name: file-management-service
  spec:
  type: LoadBalancer
  selector:
      app: file-management-api
  ports:
      - protocol: TCP
      port: 80
      targetPort: 5000
  ```

4. Execute the service in Kubernetes:

```bash
kubectl apply -f service.yaml
```

5. Automatic scaling with Horizontal Pod Autoscaler (HPA): Use HPA to automatically scale based on CPU load.

```bash
kubectl autoscale deployment file-management-api --cpu-percent=50 --min=1 --max=10
```

---

## Scaling and Performance Optimization Strategies

### Horizontal Scalability

- **Docker**: Docker containers encapsulate the application for uniform deployment and facilitate horizontal scaling.
- **Kubernetes**: Kubernetes orchestrates multiple instances of the application, balancing load and providing automatic recovery upon failure.

### Performance Optimization

- **Caching**: Caching is implemented to reduce database load and improve response times, especially for frequently accessed user data or files.
- **Load Balancing**: A load balancer distributes traffic across multiple application instances, enhancing availability and response times.
- **Database Optimization**: MongoDB indexes are configured on key fields (e.g., user IDs) to accelerate query times.

---

## Security and GDPR Compliance Strategies

### Authentication

- The API uses JWT for user authentication, ensuring that only authorized users have access to their data.

### Encryption

- Files are encrypted before storage to protect against unauthorized access.
- Encryption and decryption keys are managed in a secure environment.

### Access Control

- The API restricts access, allowing only file owners to access, download, or delete their files, thus ensuring data security.

### GDPR Compliance

- **Data Export**: Users can request an export of all their data in a zip file.
- **Data Deletion**: Users can delete their account and all files, complying with GDPR's "right to be forgotten."