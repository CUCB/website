import type { SvelteComponentTyped } from "svelte";

declare module "svelte-easy-crop" {
  interface Area {
    x: number;
    y: number;
    width: number;
    height: number;
  }

  export interface CropperProps {
    image: string;
    crop: { x: number; y: number };
    zoom?: number;
    aspect?: number;
    minZoom?: number;
    maxZoom?: number;
    cropShape?: "rect" | "round";
    cropSize?: { width: number; height: number };
    showGrid?: boolean;
    zoomSpeed?: number;
    crossOrigin?: string;
    restrictPosition?: boolean;
    oncropComplete?: (e: CustomEvent<{ percent: Area; pixels: Area }>) => void;
  }

  export class Cropper extends SvelteComponentTyped<CropperProps> {}
}
