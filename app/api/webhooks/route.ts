import { createUser } from "@/lib/actions/user.action";
import { NextRequest, NextResponse } from "next/server";
import { verifyWebhook } from "@clerk/nextjs/webhooks";

export async function POST(req: NextRequest) {
  try {
    const evt = await verifyWebhook(req);

    const { id } = evt.data;
    const eventType = evt.type;
    if (eventType === "user.created") {
      try {
        const {
          id,
          email_addresses,
          image_url,
          first_name,
          last_name,
          username,
        } = evt.data;
        const user = {
          clerkId: id,
          email: email_addresses[0].email_address,
          userName: username!,
          firstName: first_name,
          lastName: last_name,
          photo: image_url,
        };

        const newUser = await createUser(user);
        console.log("New user created:", newUser);
        return NextResponse.json({ message: "OK", user: newUser });
      } catch (error) {
        console.error("Error creating user:", error);
        return new Response("Error occured", {
          status: 400,
        });
      }
    }
  } catch (error) {
    console.error("Error verifying webhook:", error);
    return new Response("Error verifying webhook", { status: 400 });
  }
}
