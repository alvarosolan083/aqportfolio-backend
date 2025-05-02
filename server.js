import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";
import nodemailer from "nodemailer";

dotenv.config();

const app = express();

// ✅ Configuración CORS solo para tu frontend desplegado
app.use(cors({
  origin: "https://portafolio-alvaro-solano.vercel.app"
}));

app.use(express.json());

app.post("/send-email", async (req, res) => {
  const { name, email, message, token } = req.body;

  if (!token) {
    return res.status(400).json({ message: "Falta el token de reCAPTCHA" });
  }

  try {
    const verifyURL = `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${token}`;
    const captchaResponse = await fetch(verifyURL, { method: "POST" });
    const captchaData = await captchaResponse.json();

    if (!captchaData.success) {
      return res.status(400).json({ message: "Falló la verificación de reCAPTCHA" });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"Formulario de contacto" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_RECEIVER,
      subject: "Nuevo mensaje de contacto",
      text: `Nombre: ${name}\nCorreo: ${email}\nMensaje:\n${message}`,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "Correo enviado correctamente" });
  } catch (error) {
    console.error("❌ Error en servidor:", error);
    res.status(500).json({ message: "Error al enviar el correo" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
