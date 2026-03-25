import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWorkspaceMember } from "@/lib/auth-helpers";
import { z } from "zod";

const updateSectionSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  position: z.number().int().min(0).optional(),
});

async function resolveParams(params: { sectionId: string } | Promise<{ sectionId: string }>) {
  if (typeof (params as Promise<unknown>)?.then === "function") return await (params as Promise<{ sectionId: string }>);
  return params as { sectionId: string };
}

export async function PATCH(
  request: Request,
  context: { params: { sectionId: string } | Promise<{ sectionId: string }> }
) {
  try {
    const { sectionId } = await resolveParams(context.params);
    const { userId, error } = await requireAuth();
    if (error) return error;

    const section = await prisma.section.findUnique({ where: { id: sectionId }, include: { project: true } });
    if (!section) return NextResponse.json({ error: "Section not found" }, { status: 404 });

    const { error: memberError } = await requireWorkspaceMember(userId!, section.project.workspaceId);
    if (memberError) return memberError;

    const body = await request.json().catch(() => ({}));
    const parsed = updateSectionSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 422 });

    const updated = await prisma.section.update({
      where: { id: sectionId },
      data: parsed.data,
    });

    return NextResponse.json({ section: updated });
  } catch (err) {
    console.error("[section PATCH]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  context: { params: { sectionId: string } | Promise<{ sectionId: string }> }
) {
  try {
    const { sectionId } = await resolveParams(context.params);
    const { userId, error } = await requireAuth();
    if (error) return error;

    const section = await prisma.section.findUnique({ where: { id: sectionId }, include: { project: true } });
    if (!section) return NextResponse.json({ error: "Section not found" }, { status: 404 });

    const { error: memberError } = await requireWorkspaceMember(userId!, section.project.workspaceId);
    if (memberError) return memberError;

    await prisma.section.delete({ where: { id: sectionId } });

    return NextResponse.json({ message: "Section deleted" });
  } catch (err) {
    console.error("[section DELETE]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
