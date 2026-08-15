import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(
  process.env.RESEND_API_KEY
);

export async function POST(
  request: Request
) {
  try {
    const body =
      await request.json();

    const message =
      typeof body.message === "string"
        ? body.message.trim()
        : "";

    const email =
      typeof body.email === "string"
        ? body.email.trim()
        : "";

    if (!message) {
      return NextResponse.json(
        {
          error:
            "Feedback message is required.",
        },
        { status: 400 }
      );
    }

    const to =
      process.env.FEEDBACK_TO_EMAIL;

    if (!to) {
      console.error(
        "FEEDBACK_TO_EMAIL is not configured."
      );

      return NextResponse.json(
        {
          error:
            "Feedback email is not configured.",
        },
        { status: 500 }
      );
    }

    const sender =
      email || "PARTIO user";

    const { error } =
      await resend.emails.send({
        from:
          "PARTIO Feedback <onboarding@resend.dev>",
        to,
        subject:
          "New PARTIO Feedback",
        text: [
          "New feedback received from PARTIO.",
          "",
          `From: ${sender}`,
          "",
          "Feedback:",
          message,
        ].join("\n"),
      });

    if (error) {
      console.error(
        "Resend Error",
        error
      );

      return NextResponse.json(
        {
          error:
            "Unable to send feedback.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "Feedback API Error",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to send feedback.",
      },
      { status: 500 }
    );
  }
}