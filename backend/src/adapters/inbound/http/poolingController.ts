import { Request, Response } from "express";
import prisma from "../../../infra/db/client";

export const createPool = async (req: Request, res: Response) => {
  try {
    const { year, members } = req.body;

    if (!year || !members || !Array.isArray(members)) {
      return res.status(400).json({ message: "Missing or invalid parameters" });
    }

    // Fetch CBs for all members
    const shipCBs = await prisma.shipCompliance.findMany({
      where: {
        shipId: { in: members.map((m: any) => m.shipId) },
        year: Number(year),
      },
    });

    if (shipCBs.length !== members.length) {
      return res
        .status(400)
        .json({ message: "Some members have no compliance data" });
    }

    const totalCB = shipCBs.reduce((sum, s) => sum + s.cbGco2eq, 0);

    if (totalCB < 0) {
      return res
        .status(400)
        .json({ message: "Total CB must be >= 0 for pooling" });
    }

    // Sort: Surplus (positive) first, then Deficits
    const sorted = [...shipCBs].sort((a, b) => b.cbGco2eq - a.cbGco2eq);

    let pool = await prisma.pool.create({
      data: {
        year: Number(year),
        createdAt: new Date(),
      },
    });

    let allocations: any[] = [];

    let surplus = sorted.filter((s) => s.cbGco2eq > 0);
    let deficit = sorted.filter((s) => s.cbGco2eq < 0);

    // Greedy allocation: surplus → deficit
    for (let d of deficit) {
      let remainingDeficit = Math.abs(d.cbGco2eq);
      for (let s of surplus) {
        if (s.cbGco2eq <= 0) continue;

        const transfer = Math.min(s.cbGco2eq, remainingDeficit);
        s.cbGco2eq -= transfer;
        d.cbGco2eq += transfer;
        remainingDeficit -= transfer;

        if (remainingDeficit <= 0) break;
      }
    }

    // Save final results
    for (let s of sorted) {
      const cb_after = s.cbGco2eq;
      allocations.push({
        poolId: pool.id,
        shipId: s.shipId,
        cbBefore: shipCBs.find((x) => x.shipId === s.shipId)?.cbGco2eq || 0,
        cbAfter: cb_after,
      });
    }

    await prisma.poolMember.createMany({
      data: allocations,
    });

    return res.status(201).json({
      message: "Pool created successfully",
      poolId: pool.id,
      totalCB,
      members: allocations,
    });
  } catch (error) {
    console.error("Error creating pool:", error);
    res.status(500).json({ message: "Failed to create pool" });
  }
};
