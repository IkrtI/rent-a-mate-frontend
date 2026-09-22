export type SessionUser = {
  id: number;
  name: string;
  email?: string;
  role: "renter" | "mate" | "admin";
};

export type SessionTokens = {
  accessToken: string;
  refreshToken: string;
};
