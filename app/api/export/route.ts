import { createClient } from "@/lib/supabase/server";
import { exportUserData, toExportCsv } from "@/lib/db/export";
import { NextResponse } from "next/server";

/** GET /api/export?format=json|csv (Section 12, 27). */
export async function GET(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const format = new URL(request.url).searchParams.get("format") === "csv" ? "csv" : "json";
  const data = await exportUserData(user.id);
  const date = new Date().toISOString().slice(0, 10);

  if (format === "csv") {
    return new NextResponse(toExportCsv(data), {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="recall-export-${date}.csv"`,
      },
    });
  }

  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="recall-export-${date}.json"`,
    },
  });
}
