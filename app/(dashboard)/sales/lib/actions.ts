"use server";

import { cookies } from "next/headers";

const BACKEND_URL = process.env.PROD_BACKEND_URL || "http://localhost:5000";

interface SaleData {
  id: number;
}

export async function getSalesList(
  searchParams?: URLSearchParams
): Promise<SaleData[]> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) {
      throw new Error("Authentication required");
    }

    const queryString = searchParams ? `?${searchParams.toString()}` : "";

    const response = await fetch(`${BACKEND_URL}/api/sales${queryString}`, {
      method: "GET",
      headers: { Cookie: `token=${token}` },
      cache: "no-store",
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch sales list");
    }
    return data.sales || data || [];
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Internal server error fetching sales list.";
    console.error("[Server Action Error] getSalesList:", errorMessage);
    throw new Error(errorMessage);
  }
}
