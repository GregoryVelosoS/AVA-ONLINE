import { prisma } from "@/server/db/prisma";
import { unstable_cache } from "next/cache";

export const getCachedDisciplines = unstable_cache(
  async () => {
    return prisma.discipline.findMany({ orderBy: { name: "asc" } });
  },
  ["disciplines-lookup"],
  { revalidate: 3600, tags: ["disciplines"] } // 1 hour cache
);

export const getCachedThemes = unstable_cache(
  async () => {
    return prisma.theme.findMany({ orderBy: { name: "asc" } });
  },
  ["themes-lookup"],
  { revalidate: 3600, tags: ["themes"] } // 1 hour cache
);

export const getCachedClassGroups = unstable_cache(
  async () => {
    return prisma.classGroup.findMany({ orderBy: { name: "asc" } });
  },
  ["class-groups-lookup"],
  { revalidate: 3600, tags: ["class-groups"] } // 1 hour cache
);
