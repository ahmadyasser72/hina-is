export const toArray = <T>(it: T | T[]) => (Array.isArray(it) ? it : [it]);
export const unwrap = <T>({ jp, en }: { jp: T; en: T | null }) => (en ?? jp)!;
