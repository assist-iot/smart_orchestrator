FROM golang:alpine AS builder

# Set destination for COPY
WORKDIR /app

COPY .. ./
# Download Go modules
COPY go.mod go.sum ./
RUN go mod download

# Copy the source code. Note the slash at the end, as explained in
# https://docs.docker.com/engine/reference/builder/#copy

RUN mkdir -p /root/.config/helm/ && \
    mkdir -p /root/.cache/helm/repository && \
    mkdir -p /root/.kube/

RUN touch /root/.kube/config

# Run
CMD [ "go", "run", "main.go" ]
