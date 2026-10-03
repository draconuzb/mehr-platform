// Bot → API ichki so'rovlari (X-Internal-Secret bilan)

export type ConfirmResult =
  | { result: "OK"; isNew: boolean }
  | { result: "NEED_PHONE" | "EXPIRED" | "INVALID_PHONE" | "PHONE_TAKEN" | "BLOCKED" };

export function createApi(baseUrl: string, secret: string) {
  return {
    async confirmLogin(body: { code: string; telegramId: string; phone?: string }): Promise<ConfirmResult> {
      const res = await fetch(`${baseUrl}/v1/internal/telegram/login-confirm`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-internal-secret": secret },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
      return (await res.json()) as ConfirmResult;
    },
  };
}
