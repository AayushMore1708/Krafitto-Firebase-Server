import express, { Request, Response } from "express";
import cors from "cors";
import { config } from "dotenv";
import { initializeApp, cert } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { createClient } from "@supabase/supabase-js";
import serviceAccount from "./firebase-adminsdk.json";

// Load env variables
config();

const app = express();
const PORT = 4000;

// Firebase Admin
initializeApp({
  credential: cert(serviceAccount as any),
});

// Supabase Admin Client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Middlewares
app.use(cors());
app.use(express.json());

// Route

app.post("/send-notice-push", async (req: Request, res: Response) => {
  const { title, body } = req.body;

  try {
    // 1. Get all students
    const { data: students, error: studentError } = await supabase
      .from("users")
      .select("id")
      .eq("role", "student")
      .eq("school_id", "ab93f001-528e-44ec-bb4d-98284c464ce0"); // For testing
    if (studentError) throw studentError;

    const studentIds = students.map((s) => s.id);
    console.log("studentIds", studentIds)
    // 2. Get FCM tokens for those students
    const { data: tokens, error: tokenError } = await supabase
      .from("fcm_tokens")
      .select("token")
      .in("user_id", studentIds);

    if (tokenError) throw tokenError;
    console.log("see", tokens)
    // 3. Send notification to each token
    const messages = tokens.map(({ token }) => ({
      token,
      notification: { title, body },
    }));

    const results = await Promise.allSettled(messages.map((msg) => getMessaging().send(msg)));

    const sentCount = results.filter((r) => r.status === "fulfilled").length;

    res.status(200).json({
      success: true,
      sent: sentCount,
      total: tokens.length,
    });
  } catch (err: any) {
    console.error("Error sending push:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});




// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
