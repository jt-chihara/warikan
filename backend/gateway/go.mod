module github.com/jt-chihara/warikan/backend/gateway

go 1.24.0

toolchain go1.24.5

replace github.com/jt-chihara/warikan/backend => ../

require (
	github.com/gorilla/mux v1.8.1
	github.com/graphql-go/graphql v0.8.1
	github.com/graphql-go/handler v0.2.4
	github.com/jt-chihara/warikan/backend v0.0.0-00010101000000-000000000000
	github.com/rs/cors v1.11.1
	google.golang.org/grpc v1.79.3
	google.golang.org/protobuf v1.36.10
)

require (
	golang.org/x/net v0.48.0 // indirect
	golang.org/x/sys v0.39.0 // indirect
	golang.org/x/text v0.32.0 // indirect
	google.golang.org/genproto/googleapis/rpc v0.0.0-20251202230838-ff82c1b0f217 // indirect
)
