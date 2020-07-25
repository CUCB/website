import { writable } from "svelte/store";

const NAME = `Cambridge University Ceilidh Band`;
export const makeTitle = pageTitle => `${pageTitle} | ${NAME}`;
