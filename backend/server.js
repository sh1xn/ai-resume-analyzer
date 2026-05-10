const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const Groq = require("groq-sdk");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

// ================= GROQ =================

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

// ================= FILE STORAGE =================

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "C:/Users/KIIT/OneDrive/Desktop/tempUploads/");
    },

    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

const upload = multer({ storage });

// ================= ANALYZE ROUTE =================

app.post("/analyze", upload.single("resume"), async (req, res) => {

    try {

        console.log("NEW AI ANALYZER RUNNING");

        if (!req.file) {
            return res.json({
                analysis: "No file uploaded."
            });
        }

        const file = req.file;

        let resumeText = "";

        // ================= PDF =================

        if (file.mimetype === "application/pdf") {

            const dataBuffer = fs.readFileSync(file.path);

            const pdfData = await pdfParse(dataBuffer);

            resumeText = pdfData.text;
        }

        // ================= DOCX =================

        else if (
            file.mimetype ===
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ) {

            const result = await mammoth.extractRawText({
                path: file.path
            });

            resumeText = result.value;
        }

        else {

            return res.json({
                analysis: "Unsupported file type."
            });
        }

        // DELETE FILE AFTER EXTRACTION

        fs.unlinkSync(file.path);

        // ================= AI PROMPT =================

        const prompt = `
You are an expert AI Resume Analyzer.

Analyze the following resume and provide:

1. Overall Resume Score out of 100
2. Strengths
3. Weaknesses
4. Missing Skills
5. ATS Optimization Tips
6. Suggestions for Improvement
7. Final Hiring Readiness Verdict

Resume:

${resumeText}
`;

        // ================= GROQ API =================

        const completion =
            await groq.chat.completions.create({

                messages: [
                    {
                        role: "user",
                        content: prompt
                    }
                ],

                model: "llama-3.3-70b-versatile"
            });

        const aiResponse =
            completion.choices[0].message.content;

        // ================= SEND RESPONSE =================

        res.json({
            analysis: aiResponse
        });

    } catch (error) {

        console.log(error);

        res.json({
            analysis: "Backend server error."
        });
    }
});

// ================= TEXT ANALYSIS =================

app.post("/grammar", async (req, res) => {

    try {

        const { text } = req.body;

        const completion =
            await groq.chat.completions.create({

                messages: [
                    {
                        role: "user",
                        content: `
Correct the grammar and improve the professionalism of this text:

${text}
`
                    }
                ],

                model: "llama-3.3-70b-versatile"
            });

        const correctedText =
            completion.choices[0].message.content;

        res.json({
            correctedText
        });

    } catch (error) {

        console.log(error);

        res.json({
            correctedText:
                "Grammar correction failed."
        });
    }
});

// ================= SERVER =================

app.listen(5000, () => {

    console.log("Server running on port 5000");
});