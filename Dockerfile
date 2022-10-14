# syntax = docker/dockerfile:experimental
FROM golang:1.18-alpine AS builder
RUN apk --no-cache add bash git gcc make musl-dev

WORKDIR /go/src

RUN go install github.com/DarthSim/overmind/v2@latest
RUN go install github.com/caddyserver/xcaddy/cmd/xcaddy@latest
RUN xcaddy build v2.6.1 --output /go/bin/caddy --with github.com/abiosoft/caddy-exec --with github.com/aksdb/caddy-cgi/v2

FROM alpine:3.16 AS execution
RUN apk --no-cache add bash jq curl tmux rsync
RUN echo 
COPY --from=builder /go/bin/overmind /usr/local/bin
COPY --from=builder /go/bin/caddy /usr/local/bin

RUN mkdir /app /app/cgi-bin

WORKDIR /app

COPY Caddyfile Caddyfile
COPY Procfile Procfile
COPY web web
COPY cgi-bin/nodes.cgi cgi-bin/nodes.cgi
COPY cgi-bin/txc.cgi cgi-bin/txc.cgi

# Main http port
EXPOSE 8500

# Fix ulimit
RUN echo "ulimit -n 65534" > /etc/profile.d/fix_ulimit.sh
# MUST be single quotes to prevent expansion until later
RUN echo 'export HTTP_PASSWORD_HASH=$(caddy hash-password --plaintext ${ANR_AUTH_TOKEN:-gogogadget})' > /etc/profile.d/set_caddy_pw.sh
# make sure we run everything through bash instead of ash
ENTRYPOINT ["bash", "--login", "-c"]

CMD ["overmind start"]
