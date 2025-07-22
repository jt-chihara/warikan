module github.com/jt-chihara/warikan/backend/gateway

go 1.23.0

toolchain go1.24.5

replace github.com/jt-chihara/warikan/backend => ../

require (
	github.com/gorilla/mux v1.8.1
	github.com/graphql-go/graphql v0.8.1
	github.com/graphql-go/handler v0.2.4
	github.com/rs/cors v1.11.1
	github.com/jt-chihara/warikan/backend v0.0.0-00010101000000-000000000000
	google.golang.org/grpc v1.73.0
	google.golang.org/protobuf v1.36.6
)

require (
	golang.org/x/net v0.38.0 // indirect
	golang.org/x/sys v0.31.0 // indirect
	golang.org/x/text v0.23.0 // indirect
	google.golang.org/genproto/googleapis/rpc v0.0.0-20250324211829-b45e905df463 // indirect
)
