import type {
  GatewayEventFrame,
  GatewayResponseFrame,
  HelloOkPayload,
  ConnectParams,
} from './types';

function uuid(): string {
  return crypto.randomUUID();
}

type PendingRequest = {
  resolve: (value: unknown) => void;
  reject: (err: Error) => void;
};

export type GatewayClientOptions = {
  ip: string;
  port?: number;
  token: string;
  onConnected?: (hello: HelloOkPayload) => void;
  onDisconnected?: (code: number, reason: string) => void;
  onEvent?: (evt: GatewayEventFrame) => void;
};

export class GatewayClient {
  private ws: WebSocket | null = null;
  private pending = new Map<string, PendingRequest>();
  private stopped = false;
  private connectSent = false;
  private connectTimer: ReturnType<typeof setTimeout> | null = null;
  private backoffMs = 800;
  readonly url: string;

  constructor(private opts: GatewayClientOptions) {
    const port = opts.port ?? 18889;
    this.url = `ws://${opts.ip}:${port}`;
  }

  start(): void {
    this.stopped = false;
    this.backoffMs = 800;
    this.openSocket();
  }

  stop(): void {
    this.stopped = true;
    if (this.connectTimer !== null) clearTimeout(this.connectTimer);
    this.connectTimer = null;
    this.ws?.close(1000, 'client stopped');
    this.ws = null;
    this.rejectAll(new Error('gateway client stopped'));
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  request<T = unknown>(method: string, params?: unknown): Promise<T> {
    const ws = this.ws;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      return Promise.reject(new Error('not connected'));
    }
    const id = uuid();
    const promise = new Promise<T>((resolve, reject) => {
      this.pending.set(id, {
        resolve: (v) => resolve(v as T),
        reject,
      });
    });
    ws.send(JSON.stringify({ type: 'req', id, method, params }));
    return promise;
  }

  private openSocket(): void {
    if (this.stopped) return;
    this.connectSent = false;
    const ws = new WebSocket(this.url);
    this.ws = ws;

    ws.addEventListener('open', () => {
      // Queue connect — server sends challenge first, but set a fallback timeout
      this.connectTimer = setTimeout(() => this.sendConnect(), 1000);
    });

    ws.addEventListener('message', (ev) => {
      this.handleFrame(String(ev.data ?? ''));
    });

    ws.addEventListener('close', (ev) => {
      this.ws = null;
      this.rejectAll(new Error(`gateway closed (${ev.code})`));
      this.opts.onDisconnected?.(ev.code, ev.reason ?? '');
      this.scheduleReconnect();
    });

    ws.addEventListener('error', () => {
      // close event will follow
    });
  }

  private scheduleReconnect(): void {
    if (this.stopped) return;
    const delay = this.backoffMs;
    this.backoffMs = Math.min(this.backoffMs * 1.8, 30_000);
    setTimeout(() => this.openSocket(), delay);
  }

  private handleFrame(raw: string): void {
    let frame: { type?: unknown };
    try {
      frame = JSON.parse(raw) as { type?: unknown };
    } catch {
      return;
    }

    if (frame.type === 'event') {
      const evt = frame as GatewayEventFrame;

      if (evt.event === 'connect.challenge') {
        // Server sent a challenge — respond immediately
        if (this.connectTimer !== null) {
          clearTimeout(this.connectTimer);
          this.connectTimer = null;
        }
        this.sendConnect();
        return;
      }

      try {
        this.opts.onEvent?.(evt);
      } catch (err) {
        console.error('[gateway] onEvent error:', err);
      }
      return;
    }

    if (frame.type === 'res') {
      const res = frame as GatewayResponseFrame;
      const p = this.pending.get(res.id);
      if (!p) return;
      this.pending.delete(res.id);
      if (res.ok) {
        p.resolve(res.payload);
      } else {
        p.reject(new Error(res.error?.message ?? 'request failed'));
      }
      return;
    }
  }

  private sendConnect(): void {
    if (this.connectSent) return;
    const ws = this.ws;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    this.connectSent = true;

    const params: ConnectParams = {
      minProtocol: 3,
      maxProtocol: 3,
      client: {
        id: 'dragonbot-web',
        version: '1.0.0',
        platform: 'web',
        mode: 'webchat',
        displayName: 'DragonBot Web',
      },
      role: 'operator',
      scopes: ['operator.admin'],
      caps: [],
      auth: { token: this.opts.token },
      locale: navigator.language,
      userAgent: navigator.userAgent,
    };

    this.request<HelloOkPayload>('connect', params)
      .then((hello) => {
        this.backoffMs = 800;
        this.opts.onConnected?.(hello);
      })
      .catch((err: Error) => {
        console.error('[gateway] connect failed:', err.message);
        ws.close(4008, 'connect failed');
      });
  }

  private rejectAll(err: Error): void {
    for (const p of this.pending.values()) p.reject(err);
    this.pending.clear();
  }
}