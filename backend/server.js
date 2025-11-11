require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const nodemailer = require("nodemailer");

const app = express();
const PORT = process.env.PORT;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// MySQL connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

db.connect(err => {
  if (err) {
    console.error('❌ MySQL Connection Failed:', err);
  } else {
    console.log('✅ Connected to MySQL Database');
  }
});

// Route for form submission into my sql database
app.post('/contact', (req, res) => {
  const { name, email, phone, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ ok: false, message: 'All required fields must be filled' });
  }

  const sql = 'INSERT INTO contact_messages (name, email, phone, message) VALUES (?, ?, ?, ?)';
  db.query(sql, [name, email, phone, message], (err, result) => {
    if (err) {
      console.error('❌ Database Error:', err);
      return res.status(500).json({ ok: false, message: 'Database error' });
    }
    console.log('✅ Data saved:', result.insertId);
    res.json({ ok: true, message: 'Message received successfully!' });
  });
});

// route for form submission into gmail account

app.post("/api/contact", async (req, res) => {
  const { name, email, phone, message } = req.body;

  if (!name || !email || !phone || !message) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    // Configure Gmail SMTP
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Verify SMTP connection (for debugging)
    await transporter.verify();

    // Email details
    const mailOptions = {
      from: `"${name}" <${email}>`,
      to: process.env.EMAIL_USER, // where you'll receive it
      subject: "New Client Inquiry - Danny Tracker",
        html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              background-color:#f8f9fa; 
              color:#222; 
              padding:20px; 
              border-radius:10px; 
              border:1px solid #e0e0e0;">

    <!--  <img src="https://www.dannytracker.com/public/headerlogo.jpg"
     alt="Danny Tracker Logo" 
     style="display:block; margin:0 auto 15px auto; width:120px; height:auto; border-radius:10px;" />-->

    

    <h2 style="color:#007bff; text-align:center; margin-bottom:20px;">
      Hey Danny! You've got a new message 🎉
    </h2>

    <div style="background-color:#ffffff; 
                padding:20px; 
                border-radius:8px; 
                box-shadow:0 2px 6px rgba(0,0,0,0.1); 
                transition:background-color .3s, color .3s;">
      
      <p style="margin:10px 0;"><strong style="color:#007bff;">Client's Name:</strong> ${name}</p>
      <p style="margin:10px 0;"><strong style="color:#007bff;">Client's Email:</strong> ${email}</p>
      <p style="margin:10px 0;"><strong style="color:#007bff;">Client's Phone:</strong> ${phone}</p>

      <hr style="margin:20px 0; border:none; border-top:1px solid #e0e0e0;">

      <p style="margin-bottom:5px;"><strong style="color:#007bff;">Client's Message:</strong></p>
      <p style="line-height:1.6; 
                background-color:#f1f3f4; 
                padding:10px; 
                border-radius:6px;">
        ${message}
      </p>
    </div>

    <footer style="text-align:center; margin-top:25px; font-size:13px; color:#777;">
      <p>💡 This message was sent via <strong>www.dannytracker.com</strong> website contact form.</p>
    </footer>

    <!-- Dark-mode support for clients that honor prefers-color-scheme -->
    <style>
      @media (prefers-color-scheme: dark) {
        body, div[style] {
          background-color:#121212 !important;
          color:#e4e4e4 !important;
        }
        h2[style], strong[style] {
          color:#4dabf7 !important;
        }
        hr[style] {
          border-top:1px solid #333 !important;
        }
        p[style][style*="background-color:#f1f3f4"] {
          background-color:#1f1f1f !important;
        }
      }
    </style>
  </div>
`

    };

    // Send the email
    await transporter.sendMail(mailOptions);

    res.status(200).json({ success: "Message sent successfully!" });
  } catch (err) {
    console.error("Error sending email:", err);
    res.status(500).json({ error: "Failed to send message. Check your settings." });
  }
});

// Route to serve all static files (HTML, CSS, JS, images) from /public folder

// Serve frontend on the server http://192.168.184.1:${PORT}

app.use(express.static(path.join(__dirname, '..', 'public')));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://192.168.184.1:${PORT}`);
});
