export type GatewayRequestFrame = {
  type: 'req';
  id: string;
  method: string;
  params?: unknown;
};

export type GatewayResponseFrame = {
  type: 'res';
  id: string;
  ok: boolean;
  payload?: unknown;
  error?: { code: string; message: string; details?: unknown; retryable?: boolean };
};

export type GatewayEventFrame = {
  type: 'event';
  event: string;
  payload?: unknown;
  seq?: number;
  stateVersion?: { presence: number; health: number };
};

export type GatewayFrame = GatewayRequestFrame | GatewayResponseFrame | GatewayEventFrame;

export type HelloOkPayload = {
  type: 'hello-ok';
  protocol: number;
  server: { version: string; host?: string; connId: string };
  features: { methods: string[]; events: string[] };
  auth?: { deviceToken?: string; role?: string; scopes?: string[] };
  policy: { maxPayload: number; maxBufferedBytes: number; tickIntervalMs: number };
  snapshot?: unknown;
};

// sessions.list
export type Session = {
  key: string;
  label?: string;
  title?: string;
  lastMessage?: string;
  createdAt?: number;
  updatedAt?: number;
  agentId?: string;
  agentName?: string;
};

export type SessionsListResult = {
  sessions: Session[];
};

// chat.history
export type ChatHistoryMessage = {
  role: 'user' | 'assistant';
  content: string | ContentBlock[];
  ts?: number;
};

export type ContentBlock = {
  type: 'text' | 'tool_use' | 'tool_result' | string;
  text?: string;
  id?: string;
  name?: string;
  input?: unknown;
  content?: unknown;
};

export type ChatHistoryResult = {
  messages: ChatHistoryMessage[];
  sessionKey?: string;
};

// chat event (streaming)
export type ChatEventPayload = {
  runId: string;
  sessionKey: string;
  seq: number;
  state: 'delta' | 'final' | 'aborted' | 'error';
  message?: ChatHistoryMessage;
  errorMessage?: string;
  stopReason?: string;
};

// agent event (tool streaming)
export type AgentEventPayload = {
  runId: string;
  seq: number;
  stream: string;
  ts: number;
  data: Record<string, unknown>;
};

export type ConnectParams = {
  minProtocol: number;
  maxProtocol: number;
  client: {
    id: string;
    version: string;
    platform: string;
    mode: string;
    displayName?: string;
  };
  role?: string;
  scopes?: string[];
  caps?: string[];
  auth?: { token?: string; password?: string };
  locale?: string;
  userAgent?: string;
};