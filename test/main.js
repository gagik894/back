var nodemailer = require('nodemailer');
const code = Math.floor(100000 + Math.random() * 900000);
console.log(code)
var transporter = nodemailer.createTransport({
  service: 'hotmail',
  auth: {
    user: 'together.app@hotmail.com',
    pass: 'pass5445'
  }
});

var mailOptions = {
  from: 'together.app@hotmail.com',
  to: 'gaguiksargsian@gmail.com',
  subject: 'Sending Email using Node.js',
  html: '<table dir="ltr"><tbody><tr><td id="m_-3347290649743965137i1"style="'+
  "padding:0;font-family:'Segoe UI Semibold','Segoe UI Bold','Segoe UI','Helvetica Neue Medium',Arial,sans-serif;font-size:17px;color:#707070"+
  '"><span class="il">Togheter</span> account</td></tr><tr><td id="m_-3347290649743965137i2"style="'+
  "padding:0;font-family:'Segoe UI Light','Segoe UI','Helvetica Neue Medium',Arial,sans-serif;font-size:41px;color:#2672ec"+
  '">Security code</td></tr><tr><td id="m_-3347290649743965137i3"style="'+
  "padding:0;padding-top:25px;font-family:'Segoe UI',Tahoma,Verdana,Arial,sans-serif;font-size:14px;color:#2a2a2a"+
  '">Please use the following security code for your Togheter account. </td></tr><tr><td id="m_-3347290649743965137i4"style="'+
  "padding:0;padding-top:25px;font-family:'Segoe UI',Tahoma,Verdana,Arial,sans-serif;font-size:14px;color:#2a2a2a"+
  '">Security code: <spanstyle="'+
  "font-family:'Segoe UI Bold','Segoe UI Semibold','Segoe UI','Helvetica Neue Medium',Arial,sans-serif;font-size:14px;font-weight:bold;color:#2a2a2a"+
  '">' + code +'</spanstyle=></td></tr><tr><td id="m_-3347290649743965137i6"style="'+
  "padding:0;padding-top:25px;font-family:'Segoe UI',Tahoma,Verdana,Arial,sans-serif;font-size:14px;color:#2a2a2a"+
  '">Thanks,</td></tr><tr><td id="m_-3347290649743965137i7"style="'+
  "padding:0;font-family:'Segoe UI',Tahoma,Verdana,Arial,sans-serif;font-size:14px;color:#2a2a2a"+
  '">The <span class="il">Togheter</span> account team</td></tr></tbody></table>'
};

transporter.sendMail(mailOptions, function(error, info){
  if (error) {
    console.log(error);
  } else {
    console.log('Email sent: ' + info.response);
  }
});

