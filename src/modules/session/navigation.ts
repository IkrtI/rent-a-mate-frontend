export function safeReturnTo(value: string | null | undefined): string {
  if (
    !value?.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    /[\u0000-\u001f\u007f]/.test(value)
  ) {
    return "/dashboard";
  }
  try {
    const url = new URL(value, "http://localhost");
    if (
      url.origin !== "http://localhost" ||
      url.pathname === "/login" ||
      url.pathname === "/admin/login"
    ) {
      return "/dashboard";
    }
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/dashboard";
  }
}
