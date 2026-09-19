import { Router } from "express";
import { db } from "../db/index";
import { homepageSections, banners } from "../db/schema";
import { eq, asc } from "drizzle-orm";

export const cmsRouter = Router();

cmsRouter.get("/homepage", async (req, res) => {
  try {
    const sections = await db
      .select()
      .from(homepageSections)
      .where(eq(homepageSections.isActive, 1))
      .orderBy(asc(homepageSections.order));

    const activeBanners = await db
      .select()
      .from(banners)
      .where(eq(banners.isActive, 1))
      .orderBy(asc(banners.order));

    res.json({
      sections: sections.map((s) => ({
        id: s.id,
        sectionKey: s.sectionKey,
        titlePt: s.titlePt,
        titleEn: s.titleEn,
        subtitlePt: s.subtitlePt,
        subtitleEn: s.subtitleEn,
        content: JSON.parse(s.content || "{}"),
        order: s.order,
      })),
      banners: activeBanners,
    });
  } catch (error) {
    console.error("Error fetching homepage CMS:", error);
    res.status(500).json({ error: "Failed to load homepage CMS content" });
  }
});
