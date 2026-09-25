import { z } from "zod";

import { requestAuthenticatedBackend } from "@/app/api/_lib/session";
import { BackendClientError, requestBackend } from "@/modules/backend-client/client";

import { lookupSchema, mateProfileSchema, mateResultSchema } from "./schemas";
import {
  englishActivityName,
  englishInterestName,
  englishLookupName,
} from "@/lib/i18n/english-labels";

const lookupResultSchema = z.object({ items: z.array(lookupSchema) });

export async function getMateEditorData() {
  const [mateResult, activities, interests, provinces] = await Promise.all([
    requestAuthenticatedBackend({ path: "/mates/me", responseSchema: mateResultSchema }).catch(
      (error: unknown) => {
        if (error instanceof BackendClientError && error.details.status === 404)
          return { mate: null, loadError: false };
        return { mate: null, loadError: true };
      },
    ),
    requestBackend({ path: "/activities", responseSchema: lookupResultSchema })
      .then((data) => ({ ...data, failed: false }))
      .catch(() => ({ items: [], failed: true })),
    requestBackend({ path: "/interests", responseSchema: lookupResultSchema })
      .then((data) => ({ ...data, failed: false }))
      .catch(() => ({ items: [], failed: true })),
    requestBackend({ path: "/provinces", responseSchema: lookupResultSchema })
      .then((data) => ({ ...data, failed: false }))
      .catch(() => ({ items: [], failed: true })),
  ]);
  const mate =
    mateResult && "mate" in mateResult && mateResult.mate
      ? mateProfileSchema.parse(mateResult.mate)
      : null;
  if (mate) {
    mate.province.name = englishLookupName(mate.province.name);
    mate.district.name = englishLookupName(mate.district.name);
    mate.activities = mate.activities.map((item) => ({
      ...item,
      name: englishActivityName(item.name),
    }));
    mate.interests = mate.interests.map((item) => ({
      ...item,
      name: englishInterestName(item.name),
    }));
  }
  let districts: { id: number; name: string }[] = [];
  let districtLookupError = false;
  if (mate) {
    const result = await requestBackend({
      path: `/provinces/${mate.province.id}/districts`,
      responseSchema: lookupResultSchema,
    })
      .then((data) => ({ ...data, failed: false }))
      .catch(() => ({ items: [], failed: true }));
    districts = result.items.map((item) => ({ ...item, name: englishLookupName(item.name) }));
    districtLookupError = result.failed;
  }
  return {
    mate,
    loadError: mateResult && "loadError" in mateResult ? mateResult.loadError : false,
    lookupError: activities.failed || interests.failed || provinces.failed || districtLookupError,
    activities: activities.items.map((item) => ({ ...item, name: englishActivityName(item.name) })),
    interests: interests.items.map((item) => ({ ...item, name: englishInterestName(item.name) })),
    provinces: provinces.items.map((item) => ({ ...item, name: englishLookupName(item.name) })),
    districts,
  };
}
