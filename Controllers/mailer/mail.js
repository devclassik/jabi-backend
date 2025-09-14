const asyncHandler = require("express-async-handler");
const nodemailer = require("nodemailer");
const helper = require("../../Utilities/helpers");
const XLSX = require("xlsx");
const { scheduleTime } = require("../../Utilities/emailTemplate");
const User = require("../../Models/userModel");
const fs = require("fs");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const sendMailerToMember = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    subject = "Sunday Service Invitation",
    address = "B4, Plot 456, Obafemi Awolowo/Mike Akigbe Way, by Apostolic Faith Bus Stop, Jabi, Abuja",
  } = req.body;

  // Church service schedule
  const schedule = scheduleTime;

  // Email body
  const mailBody = `
  <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); padding: 20px;">
      <h2 style="text-align: center; color: #007bff;">Sunday Service Invitation</h2>

      <p>Dear <strong>${name}</strong>,</p>

      <p>We warmly invite you to join us for our Sunday service this week. Here’s the schedule:</p>
      ${schedule}

      <p style="line-height: 1.6;">We are looking forward to worshiping with you and growing together in faith. Your presence would be a blessing to us!</p>

      <div style="border-top: 2px solid #007bff; padding-top: 20px; margin-top: 20px;">
        <p><strong>Location:</strong> @ ${address}</p>
        <p><strong>Date:</strong> This Sunday</p>
        <p><strong>Contact:</strong> apostolicfaithjabi@gmail.com | 08130567664</p>
      </div>

      <p style="line-height: 1.6;">We pray for God's blessings and look forward to seeing you soon.</p>

      <p>In Christ,</p>

      <p style="font-weight: bold; color: #007bff;">The Apostolic Faith Church &copy; IT Team</p>
    </div>
  </div>
`;

  const mailOptions = {
    from: process.env.EMAIL,
    to: email,
    subject: subject || "Sunday Service Invitation",
    html: mailBody,
  };

  try {
    await transporter.sendMail(mailOptions);
    return helper.controllerResult({
      req,
      res,
      message: "Church service invitation email sent successfully.",
    });
  } catch (error) {
    return helper.controllerResult({
      req,
      res,
      statusCode: 500,
      result: error,
      message: error.message,
    });
  }
});

const sendScheduledEmails = asyncHandler(async (req, res) => {
  try {
    const users = await User.find();
    if (!users.length) {
      return helper.controllerResult({
        req,
        res,
        statusCode: 404,
        message: "No users found to send emails",
      });
    }

    // Send an email to each user
    for (const user of users) {
      const subject = "Sunday Service Invitation";
      const message = `
        <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); padding: 20px;">
            <h2 style="text-align: center; color: #007bff;">Sunday Service Invitation</h2>

            <p>Dear <strong>${user.fullname}</strong>,</p>

            <p>We warmly remind you to join us for our Sunday service. Here’s the schedule:</p>
            ${scheduleTime}

            <p><strong>Location:</strong> @ B4, Plot 456, Obafemi Awolowo/Mike Akigbe Way, by Apostolic Faith Bus Stop, Jabi, Abuja</p>
            <p><strong>Date:</strong> This Sunday</p>
            <p><strong>Contact:</strong> apostolicfaithjabi@gmail.com | 08130567664</p>

            <p>We pray for God's blessings and look forward to seeing you soon.</p>

            <p style="font-weight: bold; color: #007bff;">The Apostolic Faith Church &copy; IT Team</p>
          </div>
        </div>
      `;

      await helper.sendEmailHelper(user.email, subject, message);
    }

    return helper.controllerResult({
      req,
      res,
      statusCode: 200,
      message: "Emails sent successfully to all users",
    });
  } catch (error) {
    return helper.controllerResult({
      req,
      res,
      statusCode: 500,
      message: error.message,
    });
  }
});

const sendInvitationToAll = asyncHandler(async (req, res) => {
  try {
    if (!req.file) {
      return helper.controllerResult({
        req,
        res,
        statusCode: 400,
        message: "No file uploaded. Please upload an Excel file.",
      });
    }

    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    let sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    if (!Array.isArray(sheetData) || sheetData.length === 0) {
      return helper.controllerResult({
        req,
        res,
        statusCode: 400,
        message: "Excel file is empty or invalid.",
      });
    }

    const errors = [];
    const updatedSheetData = [];

    const subject = "The Green Money Project Team";
    const batchSize = 20; // Number of emails per batch
    const delayBetweenBatches = 5000; // 5 seconds delay between batches

    // Function to process a batch of emails
    const processBatch = async (batch) => {
      for (const row of batch) {
        const { FIRSTNAME, EMAIL } = row;

        if (!FIRSTNAME || !EMAIL) {
          errors.push({
            row,
            message: "Missing required fields (First Name or Email).",
          });
          row.SUCCESSFUL = "No (Missing Info)";
          updatedSheetData.push(row);
          continue;
        }

        const mailBody = `
          <div style="font-family: Arial, sans-serif; background-color: #ffffff; padding: 20px; color: #000;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 20px;">
              <h2 style="text-align: center;">Thank You for Your Application</h2>
              <p>Dear <strong>${FIRSTNAME}</strong>,</p>
              <p>Thank you for your interest in the <strong>Presidential Initiative for the Empowerment of Young Farmers</strong> (The Green Money Project).</p>
              <p>The first batch of candidates will be contacted in March 2025 regarding the next steps.</p>
              <p>Stay updated by following our social media pages:</p>
              <ul style="list-style-type: none; padding: 0;">
                <li><strong>YouTube:</strong> <a href="https://www.youtube.com/@thegreenmoneyproject">The Green Money Project</a></li>
                <li><strong>Facebook:</strong> <a href="https://www.facebook.com/profile.php?id=61567909974481">The Green Money Project</a></li>
                <li><strong>Instagram:</strong> <a href="https://www.instagram.com/thegreenmoneyproject/">@thegreenmoneyproject</a></li>
                <li><strong>X (Twitter):</strong> <a href="https://x.com/thegreenmoneyng"> @thegreenmoneyng</a></li>
              </ul>
              <p>Best regards,</p>
              <p><strong>The Green Money Project Team</strong></p>
            </div>
          </div>`;

        const mailOptions = {
          from: process.env.EMAIL,
          to: EMAIL,
          subject,
          html: mailBody,
        };

        try {
          await transporter.sendMail(mailOptions);
          row.SUCCESSFUL = "Yes"; // Mark as successfully sent
        } catch (error) {
          errors.push({ EMAIL, message: error.message });
          row.SUCCESSFUL = "No (Error: " + error.message + ")";
        }

        updatedSheetData.push(row);
      }
    };

    // Split data into batches
    const batches = [];
    for (let i = 0; i < sheetData.length; i += batchSize) {
      batches.push(sheetData.slice(i, i + batchSize));
    }

    // Process each batch with delay
    for (let i = 0; i < batches.length; i++) {
      console.log(`Processing batch ${i + 1} of ${batches.length}...`);
      await processBatch(batches[i]);

      if (i < batches.length - 1) {
        console.log(
          `Waiting ${delayBetweenBatches / 1000} seconds before next batch...`
        );
        await new Promise((resolve) =>
          setTimeout(resolve, delayBetweenBatches)
        );
      }
    }

    // Save updated data to an Excel file
    saveToExcel(updatedSheetData);

    return helper.controllerResult({
      req,
      res,
      statusCode: 200,
      result: { errors },
      message: "Emails processed successfully in batches.",
    });
  } catch (error) {
    return helper.controllerResult({
      req,
      res,
      statusCode: 500,
      result: error,
      message: error.message,
    });
  }
});

// Function to save updated data to an Excel file
const saveToExcel = (data) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Emails");

  // Save file
  XLSX.writeFile(workbook, "email_status.xlsx");
  console.log("📁 Excel file saved: email_status.xlsx");
};

const sendBirthdayMailerToMember = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    subject = "🎉 Happy Birthday from Apostolic Faith Jabi 🎉",
    address = "B4, Plot 456, Obafemi Awolowo/Mike Akigbe Way, by Apostolic Faith Bus Stop, Jabi, Abuja",
  } = req.body;

  // Email body
  const mailBody = `
  <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); padding: 20px;">
      <h2 style="text-align: center; color: #ff4081;">🎂 Happy Birthday, ${name}! 🎂</h2>
      
      <p>Dear <strong>${name}</strong>,</p>

      <p style="line-height: 1.6;">
        On this special day, we at <strong>The Apostolic Faith Church, Jabi</strong> celebrate you and thank God for your life. 
      </p>

      <p style="line-height: 1.6;">
        May the Lord bless you with good health, joy, peace, and abundant grace. 
        We pray this year brings you closer to God's promises and fills your life with testimonies.
      </p>

      <div style="border-top: 2px solid #ff4081; padding-top: 20px; margin-top: 20px; text-align:center;">
        <p style="font-size: 16px; font-weight: bold; color: #ff4081;">🎉 Wishing you a blessed and joyful year ahead! 🎉</p>
      </div>

      <p style="line-height: 1.6;">With love and prayers,</p>
      <p style="font-weight: bold; color: #007bff;">The Apostolic Faith Church &copy; IT Team</p>
      <p style="font-size: 12px; color: gray;">${address}</p>
    </div>
  </div>
  `;

  const mailOptions = {
    from: process.env.EMAIL,
    to: email,
    subject: subject,
    html: mailBody,
  };

  try {
    await transporter.sendMail(mailOptions);
    return helper.controllerResult({
      req,
      res,
      message: "Birthday email sent successfully 🎉.",
    });
  } catch (error) {
    return helper.controllerResult({
      req,
      res,
      statusCode: 500,
      result: error,
      message: error.message,
    });
  }
});

const sendEventMailerToMember = asyncHandler(async (req, res) => {
  try {
    const {
      subject = "📢 You're Invited to Our Upcoming Event!",
      eventName = "Special Church Event",
      theme = "Walking in Faith",
      date = "This Saturday",
      time = "10:00 AM",
      venue = "B4, Plot 456, Obafemi Awolowo/Mike Akigbe Way, by Apostolic Faith Bus Stop, Jabi, Abuja",
    } = req.body;

    const users = await User.find();
    if (!users.length) {
      return helper.controllerResult({
        req,
        res,
        statusCode: 404,
        message: "No users found to send emails",
      });
    }

    for (const user of users) {
      const mailBody = `
        <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; 
                      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); padding: 20px;">
            <h2 style="text-align: center; color: #007bff;">📢 Invitation: ${eventName}</h2>

            <p>Dear <strong>${user.fullname}</strong>,</p>

            <p style="line-height: 1.6;">
              We are excited to invite you to our upcoming event at 
              <strong>The Apostolic Faith Church, Jabi</strong>.
            </p>

            <div style="margin: 20px 0; padding: 15px; border-left: 5px solid #007bff; background-color: #f9f9f9;">
              <p><strong>🎯 Theme:</strong> ${theme}</p>
              <p><strong>📅 Date:</strong> ${date}</p>
              <p><strong>⏰ Time:</strong> ${time}</p>
              <p><strong>📍 Venue:</strong> ${venue}</p>
            </div>

            <p style="line-height: 1.6;">
              It promises to be a time of blessings, fellowship, and inspiration. 
              We would be honored to have you with us.
            </p>

            <div style="border-top: 2px solid #007bff; padding-top: 20px; margin-top: 20px; text-align: center;">
              <p style="font-size: 16px; font-weight: bold; color: #007bff;">
                🙏 Don’t miss it – we look forward to seeing you there!
              </p>
            </div>

            <p style="line-height: 1.6;">Blessings,</p>
            <p style="font-weight: bold; color: #007bff;">The Apostolic Faith Church &copy; IT Team</p>
          </div>
        </div>
      `;

      await helper.sendEmailHelper(user.email, subject, mailBody);
    }

    return helper.controllerResult({
      req,
      res,
      statusCode: 200,
      message: "✅ Event schedule sent successfully to all members",
    });
  } catch (error) {
    return helper.controllerResult({
      req,
      res,
      statusCode: 500,
      message: error.message,
    });
  }
});

module.exports = {
  sendMailerToMember,
  sendInvitationToAll,
  sendScheduledEmails,
  sendBirthdayMailerToMember,
  sendEventMailerToMember,
};
