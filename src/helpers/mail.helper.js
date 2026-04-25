import transporter from "../config/mail.config.js";

export const sendEMAil = (to, subject, content, isHtml = false) => {
    const mailOptions = {
        to,
        subject,
    };

    if (isHtml) {
        mailOptions.html = content;
    } else {
        mailOptions.text = content;
    }

    transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
            console.error("Mail error:", err.message);
            return;
        }
        console.log("Mail sent:", info.messageId);
    });
};
