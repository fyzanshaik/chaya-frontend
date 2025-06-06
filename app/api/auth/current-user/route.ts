import { NextResponse, type NextRequest } from "next/server";

const BACKEND_API_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5000/";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("token")?.value;

  if (!token) {
    return NextResponse.json(
      { message: "Not authenticated (no token)" },
      { status: 401 }
    );
  }

  try {
    const backendResponse = await fetch(`${BACKEND_API_URL}api/auth/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const backendData = await backendResponse.json();

    if (!backendResponse.ok) {
      return NextResponse.json(
        {
          message:
            backendData.message ??
            backendData.error ??
            "Failed to fetch user from backend",
        },
        { status: backendResponse.status }
      );
    }

    return NextResponse.json(backendData, { status: 200 });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Current user API route error:", errorMessage);
    return NextResponse.json(
      { message: "An internal server error occurred." },
      { status: 500 }
    );
  }
}
