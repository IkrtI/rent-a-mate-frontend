import { NextResponse } from "next/server";
import { z } from "zod";

import { requestBackend } from "@/modules/backend-client/client";
import {
  mateResultSchema,
  profileInputSchema,
  replaceAvailabilitySchema,
} from "@/modules/mate-profile/schemas";
import { assertSameOrigin, parseJson, RouteError, routeErrorResponse } from "../../_lib/route";
import { requestAuthenticatedBackend } from "../../_lib/session";

type Context = { params: Promise<{ path?: string[] }> };
const unknownResponse = z.unknown();

function apiPath(parts: string[]) {
  return `/${parts.map(encodeURIComponent).join("/")}`;
}

export async function GET(request: Request, { params }: Context) {
  try {
    const path = (await params).path ?? [];
    if (path.length === 1 && path[0] === "me") {
      return NextResponse.json(
        await requestAuthenticatedBackend({ path: "/mates/me", responseSchema: mateResultSchema }),
      );
    }
    if (path.length === 2 && path[0] === "me" && path[1] === "availability") {
      return NextResponse.json(
        await requestAuthenticatedBackend({
          path: "/mates/me/availability",
          responseSchema: unknownResponse,
        }),
      );
    }
    if (path.length === 2 && /^[1-9]\d*$/.test(path[0]) && path[1] === "availability") {
      const date = new URL(request.url).searchParams.get("date");
      if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date))
        throw new RouteError(400, "INVALID_DATE", "Choose a valid date.");
      return NextResponse.json(
        await requestBackend({
          path: `/mates/${path[0]}/availability?date=${encodeURIComponent(date)}`,
          responseSchema: unknownResponse,
        }),
      );
    }
    throw new RouteError(404, "NOT_FOUND", "The requested resource was not found.");
  } catch (error) {
    return routeErrorResponse(error);
  }
}

export async function POST(request: Request, { params }: Context) {
  try {
    assertSameOrigin(request);
    const path = (await params).path ?? [];
    if (path.length === 0) {
      const input = await parseJson(request, profileInputSchema);
      const result = await requestAuthenticatedBackend({
        path: "/mates",
        method: "POST",
        body: input,
        responseSchema: mateResultSchema,
      });
      return NextResponse.json(result, { status: 201 });
    }
    if (path.length === 2 && path[0] === "me" && path[1] === "photos") {
      const form = await request.formData();
      const upload = new FormData();
      const file = form.get("photo");
      const url = form.get("url");
      if (file instanceof File) {
        if (!["image/jpeg", "image/png", "image/gif", "image/webp"].includes(file.type))
          throw new RouteError(
            400,
            "INVALID_PHOTO_TYPE",
            "Choose a JPEG, PNG, GIF, or WebP image.",
          );
        if (file.size > 5 * 1024 * 1024)
          throw new RouteError(400, "PHOTO_TOO_LARGE", "Photo must be 5 MB or smaller.");
        upload.append("photo", file, file.name);
      } else if (typeof url === "string" && url.length > 0 && url.length <= 2048) {
        const validUrl =
          /^https?:\/\//i.test(url) ||
          (url.startsWith("/") && !url.startsWith("//")) ||
          /^data:image\//i.test(url);
        if (!validUrl)
          throw new RouteError(
            400,
            "INVALID_PHOTO_URL",
            "Use an http(s), root-relative, or data:image URL.",
          );
        upload.append("url", url);
      } else {
        throw new RouteError(
          400,
          "PHOTO_REQUIRED",
          "Choose an image file or provide an image URL.",
        );
      }
      return NextResponse.json(
        await requestAuthenticatedBackend({
          path: "/mates/me/photos",
          method: "POST",
          body: upload,
          responseSchema: unknownResponse,
        }),
        { status: 201 },
      );
    }
    throw new RouteError(404, "NOT_FOUND", "The requested resource was not found.");
  } catch (error) {
    return routeErrorResponse(error);
  }
}

export async function PATCH(request: Request, { params }: Context) {
  try {
    assertSameOrigin(request);
    const path = (await params).path ?? [];
    if (path.length !== 1 || path[0] !== "me")
      throw new RouteError(404, "NOT_FOUND", "The requested resource was not found.");
    const input = await parseJson(
      request,
      profileInputSchema.partial().refine((value) => Object.keys(value).length > 0),
    );
    return NextResponse.json(
      await requestAuthenticatedBackend({
        path: "/mates/me",
        method: "PATCH",
        body: input,
        responseSchema: mateResultSchema,
      }),
    );
  } catch (error) {
    return routeErrorResponse(error);
  }
}

export async function PUT(request: Request, { params }: Context) {
  try {
    assertSameOrigin(request);
    const path = (await params).path ?? [];
    if (path.length !== 2 || path[0] !== "me" || path[1] !== "availability")
      throw new RouteError(404, "NOT_FOUND", "The requested resource was not found.");
    const input = await parseJson(request, replaceAvailabilitySchema);
    return NextResponse.json(
      await requestAuthenticatedBackend({
        path: "/mates/me/availability",
        method: "PUT",
        body: input,
        responseSchema: unknownResponse,
      }),
    );
  } catch (error) {
    return routeErrorResponse(error);
  }
}

export async function DELETE(request: Request, { params }: Context) {
  try {
    assertSameOrigin(request);
    const path = (await params).path ?? [];
    if (path.length === 1 && path[0] === "me") {
      return NextResponse.json(
        await requestAuthenticatedBackend({
          path: "/mates/me",
          method: "DELETE",
          responseSchema: unknownResponse,
        }),
      );
    }
    if (
      path.length === 3 &&
      path[0] === "me" &&
      path[1] === "photos" &&
      /^[1-9]\d*$/.test(path[2])
    ) {
      return NextResponse.json(
        await requestAuthenticatedBackend({
          path: apiPath(path),
          method: "DELETE",
          responseSchema: unknownResponse,
        }),
      );
    }
    throw new RouteError(404, "NOT_FOUND", "The requested resource was not found.");
  } catch (error) {
    return routeErrorResponse(error);
  }
}
