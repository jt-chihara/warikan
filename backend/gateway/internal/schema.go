package internal

import (
	"context"
	"log"
	"time"

	"github.com/graphql-go/graphql"
	"github.com/jt-chihara/warikan/backend/proto/group/v1"
	"google.golang.org/protobuf/types/known/timestamppb"
)

// GraphQL types  
var dateTimeType = graphql.NewScalar(graphql.ScalarConfig{
	Name:         "DateTime",
	Description:  "DateTime scalar type",
	Serialize: func(value interface{}) interface{} {
		switch v := value.(type) {
		case *timestamppb.Timestamp:
			return v.AsTime().Format(time.RFC3339)
		case time.Time:
			return v.Format(time.RFC3339)
		}
		return nil
	},
	ParseValue: func(value interface{}) interface{} {
		switch v := value.(type) {
		case string:
			t, err := time.Parse(time.RFC3339, v)
			if err != nil {
				return nil
			}
			return t
		}
		return nil
	},
})

var expenseType = graphql.NewObject(graphql.ObjectConfig{
	Name: "Expense",
	Fields: graphql.Fields{
		"id": &graphql.Field{
			Type: graphql.NewNonNull(graphql.ID),
		},
		"payerId": &graphql.Field{
			Type: graphql.NewNonNull(graphql.ID),
		},
		"amount": &graphql.Field{
			Type: graphql.NewNonNull(graphql.Int),
		},
		"description": &graphql.Field{
			Type: graphql.String,
		},
		"splitBetween": &graphql.Field{
			Type: graphql.NewList(graphql.NewNonNull(graphql.ID)),
		},
		"createdAt": &graphql.Field{
			Type: dateTimeType,
		},
	},
})

var settlementType = graphql.NewObject(graphql.ObjectConfig{
	Name: "Settlement",
	Fields: graphql.Fields{
		"fromMemberId": &graphql.Field{
			Type: graphql.NewNonNull(graphql.ID),
		},
		"toMemberId": &graphql.Field{
			Type: graphql.NewNonNull(graphql.ID),
		},
		"amount": &graphql.Field{
			Type: graphql.NewNonNull(graphql.Int),
		},
		"fromName": &graphql.Field{
			Type: graphql.NewNonNull(graphql.String),
		},
		"toName": &graphql.Field{
			Type: graphql.NewNonNull(graphql.String),
		},
	},
})

var memberBalanceType = graphql.NewObject(graphql.ObjectConfig{
	Name: "MemberBalance",
	Fields: graphql.Fields{
		"memberId": &graphql.Field{
			Type: graphql.NewNonNull(graphql.ID),
		},
		"memberName": &graphql.Field{
			Type: graphql.NewNonNull(graphql.String),
		},
		"balance": &graphql.Field{
			Type: graphql.NewNonNull(graphql.Int),
		},
	},
})

var settlementResultType = graphql.NewObject(graphql.ObjectConfig{
	Name: "SettlementResult",
	Fields: graphql.Fields{
		"settlements": &graphql.Field{
			Type: graphql.NewList(graphql.NewNonNull(settlementType)),
		},
		"balances": &graphql.Field{
			Type: graphql.NewList(graphql.NewNonNull(memberBalanceType)),
		},
	},
})

var splitMemberType = graphql.NewObject(graphql.ObjectConfig{
	Name: "SplitMember",
	Fields: graphql.Fields{
		"memberId": &graphql.Field{
			Type: graphql.NewNonNull(graphql.ID),
		},
		"memberName": &graphql.Field{
			Type: graphql.NewNonNull(graphql.String),
		},
		"amount": &graphql.Field{
			Type: graphql.NewNonNull(graphql.Int),
		},
	},
})

var expenseWithDetailsType = graphql.NewObject(graphql.ObjectConfig{
	Name: "ExpenseWithDetails",
	Fields: graphql.Fields{
		"id": &graphql.Field{
			Type: graphql.NewNonNull(graphql.ID),
		},
		"groupId": &graphql.Field{
			Type: graphql.NewNonNull(graphql.ID),
		},
		"amount": &graphql.Field{
			Type: graphql.NewNonNull(graphql.Int),
		},
		"description": &graphql.Field{
			Type: graphql.NewNonNull(graphql.String),
		},
		"paidById": &graphql.Field{
			Type: graphql.NewNonNull(graphql.ID),
		},
		"paidByName": &graphql.Field{
			Type: graphql.NewNonNull(graphql.String),
		},
		"splitMembers": &graphql.Field{
			Type: graphql.NewList(graphql.NewNonNull(splitMemberType)),
		},
		"createdAt": &graphql.Field{
			Type: graphql.NewNonNull(dateTimeType),
		},
	},
})

var expenseInputType = graphql.NewInputObject(graphql.InputObjectConfig{
	Name: "ExpenseInput",
	Fields: graphql.InputObjectConfigFieldMap{
		"id": &graphql.InputObjectFieldConfig{
			Type: graphql.NewNonNull(graphql.ID),
		},
		"payerId": &graphql.InputObjectFieldConfig{
			Type: graphql.NewNonNull(graphql.ID),
		},
		"amount": &graphql.InputObjectFieldConfig{
			Type: graphql.NewNonNull(graphql.Int),
		},
		"description": &graphql.InputObjectFieldConfig{
			Type: graphql.String,
		},
		"splitBetween": &graphql.InputObjectFieldConfig{
			Type: graphql.NewNonNull(graphql.NewList(graphql.NewNonNull(graphql.ID))),
		},
	},
})

var memberType = graphql.NewObject(graphql.ObjectConfig{
	Name: "Member",
	Fields: graphql.Fields{
		"id": &graphql.Field{
			Type: graphql.NewNonNull(graphql.ID),
		},
		"name": &graphql.Field{
			Type: graphql.NewNonNull(graphql.String),
		},
		"email": &graphql.Field{
			Type: graphql.String,
		},
		"joinedAt": &graphql.Field{
			Type: graphql.NewNonNull(dateTimeType),
		},
	},
})

var groupType = graphql.NewObject(graphql.ObjectConfig{
	Name: "Group",
	Fields: graphql.Fields{
		"id": &graphql.Field{
			Type: graphql.NewNonNull(graphql.ID),
		},
		"name": &graphql.Field{
			Type: graphql.NewNonNull(graphql.String),
		},
		"description": &graphql.Field{
			Type: graphql.String,
		},
		"currency": &graphql.Field{
			Type: graphql.NewNonNull(graphql.String),
		},
		"createdAt": &graphql.Field{
			Type: graphql.NewNonNull(dateTimeType),
		},
		"updatedAt": &graphql.Field{
			Type: graphql.NewNonNull(dateTimeType),
		},
		"members": &graphql.Field{
			Type: graphql.NewList(graphql.NewNonNull(memberType)),
		},
	},
})

// Input types
var createGroupInput = graphql.NewInputObject(graphql.InputObjectConfig{
	Name: "CreateGroupInput",
	Fields: graphql.InputObjectConfigFieldMap{
		"name": &graphql.InputObjectFieldConfig{
			Type: graphql.NewNonNull(graphql.String),
		},
		"description": &graphql.InputObjectFieldConfig{
			Type: graphql.String,
		},
		"currency": &graphql.InputObjectFieldConfig{
			Type: graphql.String,
		},
		"memberNames": &graphql.InputObjectFieldConfig{
			Type: graphql.NewList(graphql.NewNonNull(graphql.String)),
		},
	},
})

var updateGroupInput = graphql.NewInputObject(graphql.InputObjectConfig{
	Name: "UpdateGroupInput",
	Fields: graphql.InputObjectConfigFieldMap{
		"id": &graphql.InputObjectFieldConfig{
			Type: graphql.NewNonNull(graphql.ID),
		},
		"name": &graphql.InputObjectFieldConfig{
			Type: graphql.NewNonNull(graphql.String),
		},
		"description": &graphql.InputObjectFieldConfig{
			Type: graphql.String,
		},
		"currency": &graphql.InputObjectFieldConfig{
			Type: graphql.NewNonNull(graphql.String),
		},
	},
})

var addMemberInput = graphql.NewInputObject(graphql.InputObjectConfig{
	Name: "AddMemberInput",
	Fields: graphql.InputObjectConfigFieldMap{
		"groupId": &graphql.InputObjectFieldConfig{
			Type: graphql.NewNonNull(graphql.ID),
		},
		"memberName": &graphql.InputObjectFieldConfig{
			Type: graphql.NewNonNull(graphql.String),
		},
		"memberEmail": &graphql.InputObjectFieldConfig{
			Type: graphql.String,
		},
	},
})

var removeMemberInput = graphql.NewInputObject(graphql.InputObjectConfig{
	Name: "RemoveMemberInput",
	Fields: graphql.InputObjectConfigFieldMap{
		"groupId": &graphql.InputObjectFieldConfig{
			Type: graphql.NewNonNull(graphql.ID),
		},
		"memberId": &graphql.InputObjectFieldConfig{
			Type: graphql.NewNonNull(graphql.ID),
		},
	},
})

var addExpenseInput = graphql.NewInputObject(graphql.InputObjectConfig{
	Name: "AddExpenseInput",
	Fields: graphql.InputObjectConfigFieldMap{
		"groupId": &graphql.InputObjectFieldConfig{
			Type: graphql.NewNonNull(graphql.ID),
		},
		"amount": &graphql.InputObjectFieldConfig{
			Type: graphql.NewNonNull(graphql.Int),
		},
		"description": &graphql.InputObjectFieldConfig{
			Type: graphql.NewNonNull(graphql.String),
		},
		"paidById": &graphql.InputObjectFieldConfig{
			Type: graphql.NewNonNull(graphql.ID),
		},
		"splitMemberIds": &graphql.InputObjectFieldConfig{
			Type: graphql.NewNonNull(graphql.NewList(graphql.NewNonNull(graphql.ID))),
		},
	},
})

func NewSchema(groupClient groupv1.GroupServiceClient) (graphql.Schema, error) {
	// Query type
	queryType := graphql.NewObject(graphql.ObjectConfig{
		Name: "Query",
		Fields: graphql.Fields{
			"group": &graphql.Field{
				Type: groupType,
				Args: graphql.FieldConfigArgument{
					"id": &graphql.ArgumentConfig{
						Type: graphql.NewNonNull(graphql.ID),
					},
				},
				Resolve: func(p graphql.ResolveParams) (interface{}, error) {
					id, ok := p.Args["id"].(string)
					if !ok {
						return nil, nil
					}

					req := &groupv1.GetGroupRequest{Id: id}
					resp, err := groupClient.GetGroup(context.Background(), req)
					if err != nil {
						log.Printf("Error getting group: %v", err)
						return nil, err
					}

					return resp.Group, nil
				},
			},
			"calculateSettlements": &graphql.Field{
				Type: settlementResultType,
				Args: graphql.FieldConfigArgument{
					"groupId": &graphql.ArgumentConfig{
						Type: graphql.NewNonNull(graphql.ID),
					},
					"expenses": &graphql.ArgumentConfig{
						Type: graphql.NewNonNull(graphql.NewList(graphql.NewNonNull(expenseInputType))),
					},
				},
				Resolve: func(p graphql.ResolveParams) (interface{}, error) {
					groupId, ok := p.Args["groupId"].(string)
					if !ok {
						return nil, nil
					}

					expensesArg, ok := p.Args["expenses"].([]interface{})
					if !ok {
						return nil, nil
					}

					// Convert GraphQL expenses to proto format
					expenses := make([]*groupv1.Expense, len(expensesArg))
					for i, expenseArg := range expensesArg {
						expenseMap, ok := expenseArg.(map[string]interface{})
						if !ok {
							continue
						}

						expense := &groupv1.Expense{}
						if id, ok := expenseMap["id"].(string); ok {
							expense.Id = id
						}
						if payerId, ok := expenseMap["payerId"].(string); ok {
							expense.PayerId = payerId
						}
						if amount, ok := expenseMap["amount"].(int); ok {
							expense.Amount = int64(amount)
						}
						if description, ok := expenseMap["description"].(string); ok {
							expense.Description = description
						}
						if splitBetween, ok := expenseMap["splitBetween"].([]interface{}); ok {
							memberIds := make([]string, len(splitBetween))
							for j, memberId := range splitBetween {
								if id, ok := memberId.(string); ok {
									memberIds[j] = id
								}
							}
							expense.SplitBetween = memberIds
						}

						expenses[i] = expense
					}

					req := &groupv1.CalculateSettlementsRequest{
						GroupId:  groupId,
						Expenses: expenses,
					}

					resp, err := groupClient.CalculateSettlements(context.Background(), req)
					if err != nil {
						log.Printf("Error calculating settlements: %v", err)
						return nil, err
					}

					return map[string]interface{}{
						"settlements": resp.Settlements,
						"balances":    resp.Balances,
					}, nil
				},
			},
			"groupExpenses": &graphql.Field{
				Type: graphql.NewList(graphql.NewNonNull(expenseWithDetailsType)),
				Args: graphql.FieldConfigArgument{
					"groupId": &graphql.ArgumentConfig{
						Type: graphql.NewNonNull(graphql.ID),
					},
				},
				Resolve: func(p graphql.ResolveParams) (interface{}, error) {
					groupId, ok := p.Args["groupId"].(string)
					if !ok {
						return nil, nil
					}

					req := &groupv1.GetGroupExpensesRequest{
						GroupId: groupId,
					}

					resp, err := groupClient.GetGroupExpenses(context.Background(), req)
					if err != nil {
						log.Printf("Error getting group expenses: %v", err)
						return nil, err
					}

					return resp.Expenses, nil
				},
			},
		},
	})

	// Mutation type
	mutationType := graphql.NewObject(graphql.ObjectConfig{
		Name: "Mutation",
		Fields: graphql.Fields{
			"createGroup": &graphql.Field{
				Type: graphql.NewNonNull(groupType),
				Args: graphql.FieldConfigArgument{
					"input": &graphql.ArgumentConfig{
						Type: graphql.NewNonNull(createGroupInput),
					},
				},
				Resolve: func(p graphql.ResolveParams) (interface{}, error) {
					input, ok := p.Args["input"].(map[string]interface{})
					if !ok {
						return nil, nil
					}

					req := &groupv1.CreateGroupRequest{
						Name:        input["name"].(string),
						Currency:    "JPY", // default
						MemberNames: []string{},
					}

					if desc, exists := input["description"]; exists && desc != nil {
						req.Description = desc.(string)
					}

					if currency, exists := input["currency"]; exists && currency != nil {
						req.Currency = currency.(string)
					}

					if memberNames, exists := input["memberNames"]; exists && memberNames != nil {
						names := memberNames.([]interface{})
						for _, name := range names {
							if nameStr, ok := name.(string); ok {
								req.MemberNames = append(req.MemberNames, nameStr)
							}
						}
					}

					resp, err := groupClient.CreateGroup(context.Background(), req)
					if err != nil {
						log.Printf("Error creating group: %v", err)
						return nil, err
					}

					return resp.Group, nil
				},
			},
			"updateGroup": &graphql.Field{
				Type: graphql.NewNonNull(groupType),
				Args: graphql.FieldConfigArgument{
					"input": &graphql.ArgumentConfig{
						Type: graphql.NewNonNull(updateGroupInput),
					},
				},
				Resolve: func(p graphql.ResolveParams) (interface{}, error) {
					input, ok := p.Args["input"].(map[string]interface{})
					if !ok {
						return nil, nil
					}

					req := &groupv1.UpdateGroupRequest{
						Id:       input["id"].(string),
						Name:     input["name"].(string),
						Currency: input["currency"].(string),
					}

					if desc, exists := input["description"]; exists && desc != nil {
						req.Description = desc.(string)
					}

					resp, err := groupClient.UpdateGroup(context.Background(), req)
					if err != nil {
						log.Printf("Error updating group: %v", err)
						return nil, err
					}

					return resp.Group, nil
				},
			},
			"deleteGroup": &graphql.Field{
				Type: graphql.NewNonNull(graphql.Boolean),
				Args: graphql.FieldConfigArgument{
					"id": &graphql.ArgumentConfig{
						Type: graphql.NewNonNull(graphql.ID),
					},
				},
				Resolve: func(p graphql.ResolveParams) (interface{}, error) {
					id, ok := p.Args["id"].(string)
					if !ok {
						return false, nil
					}

					req := &groupv1.DeleteGroupRequest{Id: id}
					resp, err := groupClient.DeleteGroup(context.Background(), req)
					if err != nil {
						log.Printf("Error deleting group: %v", err)
						return false, err
					}

					return resp.Success, nil
				},
			},
			"addMember": &graphql.Field{
				Type: graphql.NewNonNull(memberType),
				Args: graphql.FieldConfigArgument{
					"input": &graphql.ArgumentConfig{
						Type: graphql.NewNonNull(addMemberInput),
					},
				},
				Resolve: func(p graphql.ResolveParams) (interface{}, error) {
					input, ok := p.Args["input"].(map[string]interface{})
					if !ok {
						return nil, nil
					}

					req := &groupv1.AddMemberRequest{
						GroupId:    input["groupId"].(string),
						MemberName: input["memberName"].(string),
					}

					if email, exists := input["memberEmail"]; exists && email != nil {
						req.MemberEmail = email.(string)
					}

					resp, err := groupClient.AddMember(context.Background(), req)
					if err != nil {
						log.Printf("Error adding member: %v", err)
						return nil, err
					}

					return resp.Member, nil
				},
			},
			"removeMember": &graphql.Field{
				Type: graphql.NewNonNull(graphql.Boolean),
				Args: graphql.FieldConfigArgument{
					"input": &graphql.ArgumentConfig{
						Type: graphql.NewNonNull(removeMemberInput),
					},
				},
				Resolve: func(p graphql.ResolveParams) (interface{}, error) {
					input, ok := p.Args["input"].(map[string]interface{})
					if !ok {
						return false, nil
					}

					req := &groupv1.RemoveMemberRequest{
						GroupId:  input["groupId"].(string),
						MemberId: input["memberId"].(string),
					}

					resp, err := groupClient.RemoveMember(context.Background(), req)
					if err != nil {
						log.Printf("Error removing member: %v", err)
						return false, err
					}

					return resp.Success, nil
				},
			},
			"addExpense": &graphql.Field{
				Type: expenseWithDetailsType,
				Args: graphql.FieldConfigArgument{
					"input": &graphql.ArgumentConfig{
						Type: graphql.NewNonNull(addExpenseInput),
					},
				},
				Resolve: func(p graphql.ResolveParams) (interface{}, error) {
					input, ok := p.Args["input"].(map[string]interface{})
					if !ok {
						return nil, nil
					}

					// Convert amount from float64 to int64 (amount in cents)
					amount := int64(0)
					if amountFloat, ok := input["amount"].(float64); ok {
						amount = int64(amountFloat)
					} else if amountInt, ok := input["amount"].(int); ok {
						amount = int64(amountInt)
					}

					// Extract splitMemberIds
					var splitMemberIds []string
					if splitMemberIdsInterface, ok := input["splitMemberIds"].([]interface{}); ok {
						splitMemberIds = make([]string, len(splitMemberIdsInterface))
						for i, id := range splitMemberIdsInterface {
							if idStr, ok := id.(string); ok {
								splitMemberIds[i] = idStr
							}
						}
					}

					req := &groupv1.AddExpenseRequest{
						GroupId:         input["groupId"].(string),
						Amount:          amount,
						Description:     input["description"].(string),
						PaidById:        input["paidById"].(string),
						SplitMemberIds:  splitMemberIds,
					}

					resp, err := groupClient.AddExpense(context.Background(), req)
					if err != nil {
						log.Printf("Error adding expense: %v", err)
						return nil, err
					}

					return resp.Expense, nil
				},
			},
			"deleteExpense": &graphql.Field{
				Type: graphql.NewNonNull(graphql.Boolean),
				Args: graphql.FieldConfigArgument{
					"expenseId": &graphql.ArgumentConfig{
						Type: graphql.NewNonNull(graphql.ID),
					},
				},
				Resolve: func(p graphql.ResolveParams) (interface{}, error) {
					expenseId, ok := p.Args["expenseId"].(string)
					if !ok {
						return false, nil
					}

					req := &groupv1.DeleteExpenseRequest{
						ExpenseId: expenseId,
					}

					resp, err := groupClient.DeleteExpense(context.Background(), req)
					if err != nil {
						log.Printf("Error deleting expense: %v", err)
						return false, err
					}

					return resp.Success, nil
				},
			},
		},
	})

	return graphql.NewSchema(graphql.SchemaConfig{
		Query:    queryType,
		Mutation: mutationType,
	})
}