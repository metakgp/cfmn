FROM rust:slim-bullseye AS builder

# Set the working directory
WORKDIR /app

# Install dependencies
RUN apt-get update
RUN apt-get install -y build-essential musl-dev musl-tools pkgconf

# Copy dependency files
COPY backend/Cargo.toml backend/Cargo.lock ./

# Copy source code
COPY backend/src ./src
COPY metaploy ./metaploy
COPY backend/.sqlx ./.sqlx
COPY backend/migrations ./migrations

# For static build
RUN rustup target add x86_64-unknown-linux-musl
RUN cargo build --target=x86_64-unknown-linux-musl --release

FROM alpine:latest AS app

# Install runtime dependencies correctly with apk
RUN apk add --no-cache \
  ca-certificates \
  tzdata \
  bash \
  poppler-utils \
  nginx

ENV TZ="Asia/Kolkata"

WORKDIR /app

# Copy metaploy files
COPY metaploy ./

# Make postinstall script executable
RUN chmod +x ./postinstall.sh

EXPOSE 8085

# Copy frontend build from the previous stage
COPY --from=builder /app/target/x86_64-unknown-linux-musl/release/backend .

CMD ["./postinstall.sh", "./backend"]
