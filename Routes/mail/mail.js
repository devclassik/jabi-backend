const express = require("express");
const upload = require("../../Utilities/multer");

const {
  sendMailerToMember,
  sendInvitationToAll,
  sendScheduledEmails,
  sendBirthdayMailerToMember,
  sendEventMailerToMember,
} = require("../../Controllers/mailer/mail");

const router = express.Router();

router.post("/", sendMailerToMember);
router.post("/send-to-multiple", upload.single("file"), sendInvitationToAll);
router.get("/auto-send", sendInvitationToAll);
router.get("/send-instant", sendScheduledEmails);
router.post("/send-birthday", sendBirthdayMailerToMember);
router.post("/send-event", sendEventMailerToMember);

module.exports = router;
