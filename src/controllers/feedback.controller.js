import { Feedback } from "../models/feedback.model.js";
import { User } from "../models/user.model.js";
import { sendEMAil } from "../helpers/mail.helper.js";
import { uploadToCloudinary } from "../helpers/cloudinary.helper.js"; // ✅ Cloudinary funksiyasi

class FeedbackController {
    getPage = async (req, res) => {
        const flash = {
            success: req.cookies?._f_success || null,
            error: req.cookies?._f_error || null,
        };
        res.clearCookie("_f_success");
        res.clearCookie("_f_error");

        res.render("feedback", {
            layout: false,
            title: "Fikr qoldirish - MossMenu",
            year: new Date().getFullYear(),
            flash,
        });
    };

    submit = async (req, res) => {
        try {
            if (!req.user || !req.user.id) {
                res.cookie("_f_error", "Iltimos, avval tizimga kiring.", {
                    httpOnly: true,
                    maxAge: 10000,
                });
                return res.redirect("/login");
            }

            const { type, message, rating, device_info } = req.body;

            if (!message || message.trim().length === 0) {
                res.cookie(
                    "_f_error",
                    "Xabar maydoni bo'sh bo'lishi mumkin emas.",
                    {
                        httpOnly: true,
                        maxAge: 10000,
                    },
                );
                return res.redirect("/feedback");
            }

            const parsedRating = parseInt(rating);
            const finalRating =
                parsedRating >= 1 && parsedRating <= 5 ? parsedRating : 5;
            const feedbackType = type === "complaint" ? "complaint" : "review";

            // ✅ Rasm Cloudinary ga yuklash (ixtiyoriy)
            let imageUrl = undefined;
            if (req.file) {
                imageUrl = await uploadToCloudinary(
                    req.file.buffer,
                    req.file.originalname,
                    "feedbacks",
                );
            }

            await Feedback.create({
                message: message.trim(),
                type: feedbackType,
                rating: finalRating,
                image: imageUrl, // ✅ URL (yoki undefined)
                device_info: device_info || "none",
                created_at: req.user.id,
            });

            // Adminlarga email yuborish (xato bo'lsa ham davom etadi)
            this.#notifyAdmins({
                userName: req.user.name,
                userEmail: req.user.email || "noma'lum",
                type: feedbackType,
                rating: finalRating,
                message: message.trim(),
                device_info: device_info || "none",
                hasImage: !!req.file,
            }).catch((err) => {
                console.error("Email notification failed:", err.message);
            });

            res.cookie(
                "_f_success",
                "Fikringiz muvaffaqiyatli yuborildi! Rahmat.",
                {
                    httpOnly: true,
                    maxAge: 10000,
                },
            );
            res.redirect("/feedback");
        } catch (error) {
            console.error("FeedbackController.submit:", error.message);
            res.cookie(
                "_f_error",
                "Xatolik yuz berdi. Qaytadan urinib ko'ring.",
                {
                    httpOnly: true,
                    maxAge: 10000,
                },
            );
            res.redirect("/feedback");
        }
    };

    // Adminlarga chiroyli HTML email yuborish
    #notifyAdmins = async (data) => {
        const admins = await User.find({ role: "ADMIN" })
            .select("email")
            .lean();

        if (!admins.length) {
            console.warn("Admin topilmadi, email yuborilmadi");
            return;
        }

        const isComplaint = data.type === "complaint";
        const typeLabel = isComplaint ? "Shikoyat" : "Sharh";
        const typeColor = isComplaint ? "#dc2626" : "#16a34a";
        const typeBg = isComplaint ? "#fee2e2" : "#dcfce7";
        const typeIcon = isComplaint ? "⚠️" : "✨";
        const stars = "★".repeat(data.rating) + "☆".repeat(5 - data.rating);
        const subject = `${typeIcon} [MossMenu] Yangi ${typeLabel} — ${data.userName}`;

        const html = `
<!DOCTYPE html>
<html lang="uz">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>MossMenu — Yangi feedback</title>
</head>
<body style="margin:0; padding:0; background:#f7f3ef; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f3ef; padding:40px 20px;">
        <tr>
            <td align="center">
                <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 8px 32px rgba(26,20,16,.08);">

                    <!-- HEADER -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #c8622a 0%, #f5a623 100%); padding:32px 40px; text-align:center;">
                            <div style="display:inline-block; background:rgba(255,255,255,.2); padding:8px 16px; border-radius:999px; margin-bottom:12px;">
                                <span style="color:#ffffff; font-size:12px; font-weight:700; letter-spacing:.1em; text-transform:uppercase;">🍽️ MossMenu</span>
                            </div>
                            <h1 style="margin:0; color:#ffffff; font-size:24px; font-weight:700; font-family:'Georgia', serif;">
                                ${typeIcon} Yangi ${typeLabel.toLowerCase()} keldi
                            </h1>
                            <p style="margin:8px 0 0; color:rgba(255,255,255,.85); font-size:14px;">
                                Foydalanuvchidan yangi xabar bor
                            </p>
                        </td>
                    </tr>

                    <!-- TYPE BADGE -->
                    <tr>
                        <td style="padding:24px 40px 0;">
                            <span style="display:inline-block; background:${typeBg}; color:${typeColor}; padding:6px 14px; border-radius:999px; font-size:12px; font-weight:700; letter-spacing:.05em; text-transform:uppercase;">
                                ${typeIcon} ${typeLabel}
                            </span>
                        </td>
                    </tr>

                    <!-- USER INFO -->
                    <tr>
                        <td style="padding:20px 40px 0;">
                            <table role="presentation" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="padding-right:14px;">
                                        <div style="width:48px; height:48px; border-radius:50%; background:linear-gradient(135deg, #c8622a, #f5a623); color:#ffffff; text-align:center; line-height:48px; font-size:18px; font-weight:700;">
                                            ${(data.userName || "?")[0].toUpperCase()}
                                        </div>
                                    </td>
                                    <td>
                                        <div style="color:#1a1410; font-size:16px; font-weight:700;">${data.userName}</div>
                                        <div style="color:#7a6a5a; font-size:13px; margin-top:2px;">${data.userEmail}</div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- RATING -->
                    <tr>
                        <td style="padding:20px 40px 0;">
                            <div style="background:#fef9f0; border:1px solid #fde8c0; border-radius:12px; padding:16px 20px; text-align:center;">
                                <div style="color:#7a6a5a; font-size:11px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; margin-bottom:6px;">Bahosi</div>
                                <div style="color:#f5a623; font-size:28px; letter-spacing:4px;">${stars}</div>
                                <div style="color:#1a1410; font-size:14px; font-weight:600; margin-top:4px;">${data.rating} / 5</div>
                            </div>
                        </td>
                    </tr>

                    <!-- MESSAGE -->
                    <tr>
                        <td style="padding:24px 40px 0;">
                            <div style="color:#7a6a5a; font-size:11px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; margin-bottom:10px;">Xabar matni</div>
                            <div style="background:#f7f3ef; border-left:4px solid ${typeColor}; padding:18px 20px; border-radius:0 12px 12px 0;">
                                <p style="margin:0; color:#1a1410; font-size:15px; line-height:1.6;">${this.#escapeHtml(data.message)}</p>
                            </div>
                        </td>
                    </tr>

                    <!-- META -->
                    <tr>
                        <td style="padding:24px 40px 0;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f3ef; border-radius:12px; padding:14px 18px;">
                                <tr>
                                    <td style="padding:6px 0;">
                                        <span style="color:#7a6a5a; font-size:13px;">📱 Qurilma:</span>
                                        <span style="color:#1a1410; font-size:13px; font-weight:600; margin-left:8px;">${data.device_info}</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding:6px 0;">
                                        <span style="color:#7a6a5a; font-size:13px;">🖼️ Rasm:</span>
                                        <span style="color:#1a1410; font-size:13px; font-weight:600; margin-left:8px;">${data.hasImage ? "Bor (admin panelda ko'ring)" : "Yo'q"}</span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- CTA BUTTON -->
                    <tr>
                        <td style="padding:32px 40px;">
                            <a href="http://localhost:4000/admin/feedbacks"
                               style="display:block; background:linear-gradient(135deg, #c8622a 0%, #f5a623 100%); color:#ffffff; text-decoration:none; padding:16px 28px; border-radius:12px; font-size:15px; font-weight:600; text-align:center; box-shadow:0 4px 14px rgba(200,98,42,.3);">
                                Admin panelda ko'rish →
                            </a>
                        </td>
                    </tr>

                    <!-- FOOTER -->
                    <tr>
                        <td style="background:#1a1410; padding:24px 40px; text-align:center;">
                            <p style="margin:0; color:rgba(255,255,255,.5); font-size:12px;">
                                Bu xabar <strong style="color:#f5a623;">MossMenu</strong> tizimi tomonidan avtomatik yuborildi
                            </p>
                            <p style="margin:8px 0 0; color:rgba(255,255,255,.3); font-size:11px;">
                                © ${new Date().getFullYear()} MossMenu. Barcha huquqlar himoyalangan.
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>`.trim();

        for (const admin of admins) {
            if (admin.email) {
                sendEMAil(admin.email, subject, html, true);
            }
        }
    };

    #escapeHtml = (str) => {
        if (!str) return "";
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;")
            .replace(/\n/g, "<br>");
    };
}

export default new FeedbackController();
