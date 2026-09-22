import { NextResponse } from "next/server";
import { BackendClientError } from "@/modules/backend-client";
import { requestBackendHealth } from "@/modules/backend-client/health";

export async function GET() {
  try {
    const data = await requestBackendHealth();
    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof BackendClientError) {
      return NextResponse.json(
        { code: error.details.code, message: error.details.message },
        { status: error.details.status || 502 },
      );
    }
    return NextResponse.json(
      { code: "PROXY_ERROR", message: "Request forwarding failed." },
      { status: 502 },
    );
  }
}
