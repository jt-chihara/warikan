// Protobuf Timestamp型の定義
export interface Timestamp {
  seconds: number;
  nanos: number;
}

// TimestampオブジェクトをDate型に変換
export const timestampToDate = (timestamp: Timestamp | string): Date => {
  if (typeof timestamp === 'string') {
    return new Date(timestamp);
  }

  // Protobuf Timestampの場合
  const milliseconds = timestamp.seconds * 1000 + Math.floor(timestamp.nanos / 1000000);
  return new Date(milliseconds);
};

// TimestampオブジェクトをISO文字列に変換
export const timestampToString = (timestamp: Timestamp | string): string => {
  return timestampToDate(timestamp).toISOString();
};
