import type { SvelteComponentTyped } from "svelte";

declare module "svelte-color-picker" {
  export interface HsvPickerProps {
    startColor?: string | null;
    oncolorChange?: (e: CustomEvent) => void;
  }
  export class HsvPicker extends SvelteComponentTyped<HsvPickerProps> {}
}
