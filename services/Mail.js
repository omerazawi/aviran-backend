import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'omer949494@gmail.com',
    pass: 'ntjr brer bcdb kygg',
  },
});

export async function sendAppointmentEmail({ fullName, tel, date, hour }) {
  const mailOptionsToAdmin = {
    from: '"המספרה של אבירן" <omer949494@gmail.com>',
    to: 'aviran94cohen@gmail.com',
    subject: "לקוח קבע תור חדש",
    text: `לקוח בשם ${fullName}, טלפון: ${tel}, קבע תור בתאריך ${date} בשעה ${hour}.`,
  };

  await transporter.sendMail(mailOptionsToAdmin);
}
