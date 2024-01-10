const nodemailer = require('nodemailer');
const randomsring = require("randomstring");

const transporter = nodemailer.createTransport({
    service:"gmail",
    auth:{
        user:"mariyasaji321@gmail.com",
        pass:"efea nyma srmi zlaa"
    }
})

async function sentOtp(email){
    const otp = randomsring.generate({
        length : 6,
        charset:'numeric',
    })
 
    const mailOptions = {
        from : 'mariyasaji321@gmail.com',
        to :email,
        subject : 'Yor otp code for verification',
        text:  ` Your OTP verification code is : ${otp}`,
    };

    transporter.sendMail(mailOptions,(error,info)=>{
        if(error){
            console.error("Error sending email : " + error) 
        }else{
            console.log("Email send : ", info.response );
            console.log('OTP : ',otp);
        }
    });
    
    return otp;
}

module.exports = { sentOtp };