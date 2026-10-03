// Bot → API ichki so'rovlari (X-Internal-Secret bilan)

export type ConfirmResult =
  | { result: "OK"; isNew: boolean }
  | { result: "NEED_PHONE" | "EXPIRED" | "INVALID_PHONE" | "PHONE_TAKEN" | "BLOCKED" };

export type JoinResult =
  | { result: "OK"; familyName: string }
  | { result: "NEED_PHONE" | "INVALID_PHONE" | "PHONE_TAKEN" | "BLOCKED" | "EXPIRED" | "ALREADY_REGISTERED" };

export type Identity = { telegramId: string; phone?: string; firstName?: string; lastName?: string };

export function createApi(baseUrl: string, secret: string) {
  async function post<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${baseUrl}/v1/internal/telegram/${path}`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-internal-secret": secret },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
    return (await res.json()) as T;
  }
  return {
    confirmLogin: (body: Identity & { code: string }) => post<ConfirmResult>("login-confirm", body),
    joinFamily: (body: Identity & { code: string }) => post<JoinResult>("family-join", body),
  };
}
