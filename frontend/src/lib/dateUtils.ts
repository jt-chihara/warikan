/**
 * GraphQLから返されるtimestamp objectやstring値を
 * 日本語の日付文字列に変換するユーティリティ関数
 */
export function formatDateFromGraphQL(dateValue: any): string {
  // Handle object format (from GraphQL timestamppb)
  if (typeof dateValue === 'object' && dateValue !== null) {
    // Try common timestamp object properties
    if (dateValue.seconds) {
      // Unix timestamp in seconds
      dateValue = new Date(dateValue.seconds * 1000);
    } else if (dateValue.value) {
      // Value property
      dateValue = dateValue.value;
    } else {
      // Fallback to string conversion
      dateValue = dateValue.toString();
    }
  }
  
  const date = new Date(dateValue);
  return date.toString() === 'Invalid Date' ? 
    '日付不明' : 
    date.toLocaleDateString('ja-JP');
}