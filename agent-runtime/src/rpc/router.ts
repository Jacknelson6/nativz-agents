import type { RpcHandler, JsonRpcRequest, JsonRpcResponse } from "./types.js";

export class RpcRouter {
  private handlers = new Map<string, RpcHandler>();

  register(method: string, handler: RpcHandler): void {
    this.handlers.set(method, handler);
  }

  async handle(request: JsonRpcRequest): Promise<JsonRpcResponse> {
    const handler = this.handlers.get(request.method);
    if (!handler) {
      return {
        jsonrpc: "2.0",
        id: request.id,
        error: { code: -32601, message: `Method not found: ${request.method}` },
      };
    }
    try {
      const result = await handler(request.params ?? {});
      return { jsonrpc: "2.0", id: request.id, result };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        jsonrpc: "2.0",
        id: request.id,
        error: { code: -32000, message },
      };
    }
  }
}
