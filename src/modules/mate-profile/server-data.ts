import { z } from "zod";

import { BackendClientError } from "@/modules/backend-client/client";
import { requestAuthenticatedBackend } from "@/app/api/_lib/session";
import { requestBackend } from "@/modules/backend-client/client";

import { lookupSchema, mateProfileSchema, mateResultSchema } from "./schemas";

const lookupResultSchema = z.object({ items: z.array(lookupSchema) });

export async function getMateEditorData() {
  const [mateResult, activities, interests, provinces] = await Promise.all([
    requestAuthenticatedBackend({ path: "/mates/me", responseSchema: mateResultSchema }).catch(
      (error: unknown) => {
        if (error instanceof BackendClientError && error.details.status === 404) return null;
        return null;
      },
    ),
    requestBackend({ path: "/activities", responseSchema: lookupResultSchema }).catch(() => ({
      items: [],
    })),
    requestBackend({ path: "/interests", responseSchema: lookupResultSchema }).catch(() => ({
      items: [],
    })),
    requestBackend({ path: "/provinces", responseSchema: lookupResultSchema }).catch(() => ({
      items: [],
    })),
  ]);
  const mate = mateResult?.mate ? mateProfileSchema.parse(mateResult.mate) : null;
  let districts: { id: number; name: string }[] = [];
  if (mate)
    districts = (
      await requestBackend({
        path: `/provinces/${mate.province.id}/districts`,
        responseSchema: lookupResultSchema,
      }).catch(() => ({ items: [] }))
    ).items;
  return {
    mate,
    activities: activities.items,
    interests: interests.items,
    provinces: provinces.items,
    districts,
  };
}
