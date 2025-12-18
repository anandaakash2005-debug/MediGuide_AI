const db = require("./js/db");
const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

console.log("⏰ Reminder cron started");

// Run every 60 seconds
setInterval(() => {
  const sql = `
    SELECT r.id, r.title, r.message, u.email
    FROM reminders r
    JOIN users u ON r.user_id = u.id
    WHERE r.remind_time <= NOW()
    AND r.sent = false
  `;

  db.query(sql, async (err, rows) => {
    if (err) {
      console.error("Cron DB error:", err);
      return;
    }

    for (const r of rows) {
      try {
        await resend.emails.send({
          from: "MediGuide <onboarding@resend.dev>",
          to: r.email,
          subject: `Reminder: ${r.title}`,
          text: r.message || "You have a reminder.",
        });

        // mark reminder as sent
        db.query(
          "UPDATE reminders SET sent = true WHERE id = ?",
          [r.id]
        );

        console.log(`📧 Reminder sent to ${r.email}`);
      } catch (e) {
        console.error("Email send failed:", e);
      }
    }
  });
}, 60 * 1000);
