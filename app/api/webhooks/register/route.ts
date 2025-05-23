import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { connect } from "@/lib/db";
import { createUser } from "@/lib/actions/user.action";
import { NextRequest, NextResponse } from "next/server";
import { verifyWebhook } from "@clerk/nextjs/webhooks";

export async function POST(req: NextRequest) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SIGNING_SECRET;
  // console.log("WEBHOOK_SECRET", WEBHOOK_SECRET);

  if (!WEBHOOK_SECRET) {
    throw new Error(
      "Please add WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local"
    );
  }

  // const headersPayload = headers();
  // const svix_id = headersPayload.get("svix-id");
  // const svix_timestamp = headersPayload.get("svix-timestamp");
  // const svix_signature = headersPayload.get("svix-signature");

  // if (!svix_id || !svix_timestamp || !svix_signature) {
  //   return new Response("Error occured -- no svix headers", {
  //     status: 400,
  //   });
  // }

  // const payload = await req.json();
  // const body = JSON.stringify(payload);
  // const wh = new Webhook(WEBHOOK_SECRET);

  // let evt: WebhookEvent;
  // try {
  //   evt = wh.verify(body, {
  //     "svix-id": svix_id,
  //     "svix-timestamp": svix_timestamp,
  //     "svix-signature": svix_signature,
  //   }) as WebhookEvent;
  // } catch (error) {
  //   console.error("Error verifying webhook:", error);
  //   return new Response("Error occured", {
  //     status: 400,
  //   });
  // }

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

  return new Response("Webhook received successfully", { status: 200 });
}
