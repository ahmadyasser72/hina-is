export const unwrap = <T>({ jp, en }: { jp: T; en: T | null }) => (en ?? jp)!;
