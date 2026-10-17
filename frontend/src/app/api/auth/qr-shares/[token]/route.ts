import { NextResponse } from "next/server";

export async function DELETE(
  request: Request,
  { params }: { params: { token: string } }
) {
  const token = params.token;
  return NextResponse.json({
    status: "success",
    message: `QR Share token ${token} revoked successfully`,
  });
}
