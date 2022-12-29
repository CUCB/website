/// <reference types="@sveltejs/kit" />

declare namespace App {
  interface Locals {
    session: {} | { userId: string; role: string; firstName: string; lastName: string; theme: Record<string, string> };
  }

  interface PageData {}

  interface Platform {}
}
