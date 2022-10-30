import type { PageLoad } from "./$types";
import { Number } from "runtypes";
import { redirect } from "@sveltejs/kit";

type PreloadProps =
  | { valid: true; token: string }
  | { valid: false; token: undefined }
  | { valid: null; token: undefined };

const isSuccessful = (status: number) => status >= 200 && status < 300;
export const load: PageLoad<PreloadProps> = async ({ url, fetch, parent }) => {
  const { session } = await parent();
  if (session.userId !== undefined) {
    throw redirect(302, "/members");
  }

  const token = url.searchParams.get("token");

  if (token && typeof token === "string") {
    const res = await fetch(`/auth/reset-password/verify/${token}`);
    if (isSuccessful(res.status)) {
      const body = await res.json();
      if (Number.guard(body.id)) {
        return { valid: true, token };
      } else {
        return { valid: false, token: undefined };
      }
    } else {
      return { valid: false, token: undefined };
    }
  } else {
    return { valid: null, token: undefined };
  }
};
