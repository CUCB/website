/// <reference types="@sveltejs/kit" />

declare namespace App {
  interface Locals {
    session: {} | { userId: string; hasuraRole: string; firstName: string; lastName: string };
  }

  interface PageData {}

  interface Platform {}
}
