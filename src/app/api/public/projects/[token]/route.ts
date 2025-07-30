import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: any }
) {
  try {
    const param = await params;
    const token = param.token;

    // Make request to your backend
    const backendUrl = process.env.TASK_MANAGER_API_URL!;
    console.log("URL:", `${backendUrl}/api/public/projects/${token}`);
    const response = await fetch(`${backendUrl}/public/projects/${token}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: "Project not found or sharing disabled" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching public project:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
