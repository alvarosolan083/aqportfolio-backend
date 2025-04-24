import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import fetch from "node-fetch";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Servidor funcionando 🔥");
});

app.post("/send-email", async (req, res) => {
  const { name, email, message, token } = req.body;

  // 🔍 Log inicial
  console.log("📥 Datos recibidos:", { name, email, message, token });

  if (!token) {
    console.warn("❗ Token reCAPTCHA faltante");
    return res.status(400).json({ message: "Token reCAPTCHA faltante" });
  }

  try {
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`;

    // 🔍 Validar reCAPTCHA
    const captchaRes = await fetch(verifyUrl, { method: "POST" });
    const captchaData = await captchaRes.json();

    console.log("🔒 Respuesta reCAPTCHA:", captchaData);

    if (!captchaData.success) {
      console.warn("🚫 Captcha inválido");
      return res.status(403).json({ message: "Captcha inválido" });
    }

    // 🔧 Preparar transporte Nodemailer
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    console.log("📤 Enviando correo...");

    await transporter.sendMail({
      from: `"Portafolio Álvaro" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_RECEIVER,
      subject: `Nuevo mensaje de ${name}`,
      html: `
        <h2>Nuevo mensaje desde tu portafolio</h2>
        <p><strong>Nombre:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Mensaje:</strong></p>
        <p>${message}</p>
      `,
    });

    console.log("✅ Correo enviado con éxito");
    res.status(200).json({ message: "Correo enviado con éxito ✅" });

  } catch (error) {
    console.error("❌ Error al enviar:", error);
    res.status(500).json({ message: "Error al enviar el correo ❌" });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
