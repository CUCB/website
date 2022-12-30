/// <reference types="@sveltejs/kit" />

declare namespace App {
  interface Locals {
    session:
      | {}
      | {
          userId: string;
          role: string;
          firstName: string;
          lastName: string;
          theme: Record<string, string>;
          save(): Promise<[string, string, import("cookie").CookieSerializeOptions] | null>;
          destroy(): Promise<[string, import("cookie").CookieSerializeOptions] | null>;
        };
  }

  interface PageData {}

  interface Platform {}
}
