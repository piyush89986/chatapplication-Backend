import {createTransport}  from  "nodemailer";
import { config } from "dotenv";
config();

const transpoter = createTransport({
    service : "gmail",
    auth : {
        user : process.env.EMAIL,
        pass : process.env.PASSWORD
    }
})

export default transpoter;