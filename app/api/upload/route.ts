import { auth } from "@/auth";
import { processUpload } from "@/src/controller/UploadController";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const extractedDateValue = formData.get("extractedDate");
  const extractedDate =
    typeof extractedDateValue === "string" && extractedDateValue.length > 0
      ? extractedDateValue
      : null;

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await processUpload(buffer, extractedDate);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
