/**
 * 汎用セッション型定義
 * 型パラメータで任意のデータ型に対応
 */
export interface Session<TData = unknown> {
  id: string;
  title: string;
  data: TData;
  metadata: {
    createdAt: number;
    updatedAt: number;
  };
}
