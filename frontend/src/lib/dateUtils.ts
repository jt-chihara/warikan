/**
 * タイムスタンプ（Date/string/number/一部オブジェクト）を
 * 日本語の日付文字列に変換するユーティリティ関数
 */
export function formatTimestamp(
  dateValue: string | number | Date | { seconds?: number; value?: string } | null | undefined,
): string {
  // Handle object format (from GraphQL timestamppb)
  if (typeof dateValue === 'object' && dateValue !== null) {
    // Try common timestamp object properties
    if ('seconds' in dateValue && dateValue.seconds) {
      // Unix timestamp in seconds
      dateValue = new Date(dateValue.seconds * 1000);
    } else if ('value' in dateValue && dateValue.value) {
      // Value property
      dateValue = dateValue.value;
    } else {
      // Fallback to string conversion
      dateValue = dateValue.toString();
    }
  }

  const date = new Date(dateValue as string | number | Date);
  return date.toString() === 'Invalid Date' ? '日付不明' : date.toLocaleDateString('ja-JP');
}
