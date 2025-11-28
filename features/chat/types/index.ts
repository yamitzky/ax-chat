export type Message = {
  role: 'user' | 'assistant';
  content: string;
  thinking?: string;  // AIの思考プロセス（オプショナル）
};
