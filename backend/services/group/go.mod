module github.com/jt-chihara/warikan/services/group

go 1.23.0

toolchain go1.24.5

require (
	github.com/DATA-DOG/go-sqlmock v1.5.2
	github.com/google/uuid v1.6.0
	github.com/joho/godotenv v1.5.1
	github.com/jt-chihara/warikan/backend v0.0.0-00010101000000-000000000000
	github.com/lib/pq v1.10.9
	github.com/stretchr/testify v1.10.0
	google.golang.org/grpc v1.73.0
	google.golang.org/protobuf v1.36.6
)

require (
	github.com/davecgh/go-spew v1.1.1 // indirect
	github.com/kr/pretty v0.3.1 // indirect
	github.com/pmezard/go-difflib v1.0.0 // indirect
	github.com/rogpeppe/go-internal v1.13.1 // indirect
	github.com/stretchr/objx v0.5.2 // indirect
	golang.org/x/net v0.38.0 // indirect
	golang.org/x/sys v0.31.0 // indirect
	golang.org/x/text v0.23.0 // indirect
	google.golang.org/genproto/googleapis/rpc v0.0.0-20250324211829-b45e905df463 // indirect
	gopkg.in/check.v1 v1.0.0-20201130134442-10cb98267c6c // indirect
	gopkg.in/yaml.v3 v3.0.1 // indirect
)

replace github.com/jt-chihara/warikan/backend => ../../
