use std::{collections::HashMap, sync::Arc};

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use tokio::sync::RwLock;

#[derive(Clone, Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Member {
    pub id: uuid::Uuid,
    pub name: String,
    pub email: Option<String>,
    pub joined_at: DateTime<Utc>,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct SplitMember {
    pub member_id: uuid::Uuid,
    pub member_name: String,
    pub amount: i64,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Expense {
    pub id: uuid::Uuid,
    pub group_id: uuid::Uuid,
    pub amount: i64,
    pub description: String,
    pub paid_by_id: uuid::Uuid,
    pub paid_by_name: String,
    pub split_members: Vec<SplitMember>,
    pub created_at: DateTime<Utc>,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Group {
    pub id: uuid::Uuid,
    pub name: String,
    pub description: Option<String>,
    pub currency: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub members: Vec<Member>,
}

#[derive(Default)]
pub struct Store {
    pub groups: HashMap<uuid::Uuid, Group>,
    pub expenses: HashMap<uuid::Uuid, Vec<Expense>>, // keyed by group_id
}

#[derive(Clone, Default)]
pub struct AppState(pub Arc<RwLock<Store>>);

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateGroupInput {
    pub name: String,
    pub description: Option<String>,
    pub currency: Option<String>,
    pub member_names: Vec<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateGroupInput {
    pub name: String,
    pub description: Option<String>,
    pub currency: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AddMemberInput {
    pub member_name: String,
    pub member_email: Option<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AddExpenseInput {
    pub amount: i64,
    pub description: String,
    pub paid_by_id: uuid::Uuid,
    pub split_member_ids: Vec<uuid::Uuid>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateExpenseInput {
    pub amount: i64,
    pub description: String,
    pub paid_by_id: uuid::Uuid,
    pub split_member_ids: Vec<uuid::Uuid>,
}

#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ExpenseInputForCalc {
    pub id: uuid::Uuid,
    pub payer_id: uuid::Uuid,
    pub amount: i64,
    pub description: Option<String>,
    pub split_between: Vec<uuid::Uuid>,
    pub created_at: Option<DateTime<Utc>>,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CalculateSettlementsRequest {
    pub expenses: Vec<ExpenseInputForCalc>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Settlement {
    pub from_member_id: uuid::Uuid,
    pub to_member_id: uuid::Uuid,
    pub amount: i64,
    pub from_name: String,
    pub to_name: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MemberBalance {
    pub member_id: uuid::Uuid,
    pub member_name: String,
    pub balance: i64,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CalculateSettlementsResult {
    pub settlements: Vec<Settlement>,
    pub balances: Vec<MemberBalance>,
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::{json, Value};

    #[test]
    fn test_store_default() {
        let s = Store::default();
        assert!(s.groups.is_empty());
        assert!(s.expenses.is_empty());
    }

    #[test]
    fn test_member_serde_camel_case() {
        let m = Member {
            id: uuid::Uuid::new_v4(),
            name: "Alice".into(),
            email: Some("alice@example.com".into()),
            joined_at: Utc::now(),
        };
        let v = serde_json::to_value(&m).unwrap();
        assert!(v.get("id").is_some());
        assert!(v.get("name").is_some());
        assert!(v.get("email").is_some());
        assert!(v.get("joinedAt").is_some());
        assert!(v.get("joined_at").is_none());

        // round-trip
        let m2: Member = serde_json::from_value(v).unwrap();
        assert_eq!(m2.name, "Alice");
        assert_eq!(m2.email.as_deref(), Some("alice@example.com"));
    }

    #[test]
    fn test_group_serde_camel_case() {
        let m = Member {
            id: uuid::Uuid::new_v4(),
            name: "Bob".into(),
            email: None,
            joined_at: Utc::now(),
        };
        let g = Group {
            id: uuid::Uuid::new_v4(),
            name: "Trip".into(),
            description: Some("Kyoto".into()),
            currency: "JPY".into(),
            created_at: Utc::now(),
            updated_at: Utc::now(),
            members: vec![m],
        };
        let v = serde_json::to_value(&g).unwrap();
        assert!(v.get("id").is_some());
        assert!(v.get("name").is_some());
        assert!(v.get("description").is_some());
        assert!(v.get("currency").is_some());
        assert!(v.get("createdAt").is_some());
        assert!(v.get("updatedAt").is_some());
        assert!(v.get("members").is_some());
        assert!(v.get("created_at").is_none());
        assert!(v.get("updated_at").is_none());
    }

    #[test]
    fn test_split_member_and_expense_serde() {
        let sm = SplitMember {
            member_id: uuid::Uuid::new_v4(),
            member_name: "Carol".into(),
            amount: 500,
        };
        let e = Expense {
            id: uuid::Uuid::new_v4(),
            group_id: uuid::Uuid::new_v4(),
            amount: 1000,
            description: "Dinner".into(),
            paid_by_id: uuid::Uuid::new_v4(),
            paid_by_name: "Dave".into(),
            split_members: vec![sm],
            created_at: Utc::now(),
        };
        let v = serde_json::to_value(&e).unwrap();
        assert!(v.get("groupId").is_some());
        assert!(v.get("paidById").is_some());
        assert!(v.get("paidByName").is_some());
        assert!(v.get("splitMembers").is_some());
        assert!(v.get("createdAt").is_some());

        let split0 = &v["splitMembers"][0];
        assert!(split0.get("memberId").is_some());
        assert!(split0.get("memberName").is_some());
        assert!(split0.get("amount").is_some());
    }

    #[test]
    fn test_create_group_input_serde() {
        let input = CreateGroupInput {
            name: "Trip".into(),
            description: None,
            currency: Some("JPY".into()),
            member_names: vec!["A".into(), "B".into()],
        };
        let v = serde_json::to_value(&input).unwrap();
        assert!(v.get("memberNames").is_some());
        assert!(v.get("currency").is_some());
        assert!(v.get("name").is_some());

        // deserialize
        let raw = json!({
            "name": "Trip",
            "description": "desc",
            "currency": "JPY",
            "memberNames": ["A", "B"]
        });
        let d: CreateGroupInput = serde_json::from_value(raw).unwrap();
        assert_eq!(d.name, "Trip");
        assert_eq!(d.member_names.len(), 2);
        assert_eq!(d.currency.as_deref(), Some("JPY"));
    }

    #[test]
    fn test_update_group_input_serde() {
        let raw = json!({
            "name": "NewName",
            "description": null,
            "currency": "USD"
        });
        let d: UpdateGroupInput = serde_json::from_value(raw).unwrap();
        assert_eq!(d.name, "NewName");
        assert_eq!(d.currency, "USD");
    }

    #[test]
    fn test_add_member_input_serde() {
        let raw = json!({
            "memberName": "Zed",
            "memberEmail": "z@example.com"
        });
        let d: AddMemberInput = serde_json::from_value(raw).unwrap();
        assert_eq!(d.member_name, "Zed");
        assert_eq!(d.member_email.as_deref(), Some("z@example.com"));
    }

    #[test]
    fn test_add_update_expense_input_serde() {
        let id1 = uuid::Uuid::new_v4();
        let id2 = uuid::Uuid::new_v4();
        let raw_add = json!({
            "amount": 1500,
            "description": "Taxi",
            "paidById": id1,
            "splitMemberIds": [id1, id2]
        });
        let a: AddExpenseInput = serde_json::from_value(raw_add).unwrap();
        assert_eq!(a.amount, 1500);
        assert_eq!(a.paid_by_id, id1);
        assert_eq!(a.split_member_ids, vec![id1, id2]);

        let raw_upd = json!({
            "amount": 2000,
            "description": "Taxi",
            "paidById": id2,
            "splitMemberIds": [id1]
        });
        let u: UpdateExpenseInput = serde_json::from_value(raw_upd).unwrap();
        assert_eq!(u.amount, 2000);
        assert_eq!(u.paid_by_id, id2);
        assert_eq!(u.split_member_ids, vec![id1]);
    }

    #[test]
    fn test_calc_settlements_request_serde() {
        let e = ExpenseInputForCalc {
            id: uuid::Uuid::new_v4(),
            payer_id: uuid::Uuid::new_v4(),
            amount: 3000,
            description: Some("Lunch".into()),
            split_between: vec![uuid::Uuid::new_v4()],
            created_at: Some(Utc::now()),
        };
        let req = CalculateSettlementsRequest { expenses: vec![e] };
        let v = serde_json::to_value(&req).unwrap();
        assert!(v.get("expenses").is_some());
        let first = &v["expenses"][0];
        assert!(first.get("payerId").is_some());
        assert!(first.get("splitBetween").is_some());
        assert!(first.get("createdAt").is_some());
    }

    #[test]
    fn test_calc_settlements_result_serde() {
        let s = Settlement {
            from_member_id: uuid::Uuid::new_v4(),
            to_member_id: uuid::Uuid::new_v4(),
            amount: 1000,
            from_name: "A".into(),
            to_name: "B".into(),
        };
        let b = MemberBalance { member_id: uuid::Uuid::new_v4(), member_name: "A".into(), balance: -1000 };
        let res = CalculateSettlementsResult { settlements: vec![s], balances: vec![b] };
        let v: Value = serde_json::to_value(&res).unwrap();
        assert!(v.get("settlements").is_some());
        assert!(v.get("balances").is_some());
        let s0 = &v["settlements"][0];
        assert!(s0.get("fromMemberId").is_some());
        assert!(s0.get("toMemberId").is_some());
        assert!(s0.get("fromName").is_some());
        assert!(s0.get("toName").is_some());
        let b0 = &v["balances"][0];
        assert!(b0.get("memberId").is_some());
        assert!(b0.get("memberName").is_some());
        assert!(b0.get("balance").is_some());
    }
}
