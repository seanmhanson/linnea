function get200Response(body: object) {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve(body),
  } as Response);
}

function get400Response(error: string) {
  return Promise.resolve({
    ok: false,
    status: 400,
    json: () => Promise.resolve({ error }),
  } as Response);
}

type PromiseOrValue<T> = Promise<T> | T;

export { get200Response, get400Response };
export type { PromiseOrValue };
