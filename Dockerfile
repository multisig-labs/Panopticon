ARG GO_VERSION=1
FROM golang:${GO_VERSION}-alpine AS builder

WORKDIR /usr/src/app
COPY go.mod go.sum ./
RUN go mod download && go mod verify
COPY . .
RUN go build -v -o /panopticon .


FROM alpine:latest

COPY --from=builder /panopticon /usr/local/bin/
CMD ["panopticon", "server"]
