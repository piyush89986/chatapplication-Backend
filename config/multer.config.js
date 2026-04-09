import multer from "multer";
import fs from "fs";

fs.mkdirSync("uploads/images", { recursive: true });
fs.mkdirSync("uploads/temp", { recursive: true });

const imageStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.fieldname === "avatar") {
            cb(null, "uploads/images");
        } else {
            cb(null, "uploads/temp/")
        }
    },
    filename: (req, file, cb) => {
        if (file.fieldname === "avatar") {
            cb(null, Date.now() + "_" + req.userData.user_name + "." + file.mimetype.split("/")[1])
        } else {
            cb(null, file.originalname)
        }
    }
});

const imageFileFilter = (req, file, cb) => {
    if (file.mimetype.includes("image/")) {
        cb(null, true)
    } else {
        cb(new Error("only image file can upload"))
    }
}


export const ImageUpload = multer({ storage: imageStorage, fileFilter: imageFileFilter, limits: 1024 * 1024 * 3 })