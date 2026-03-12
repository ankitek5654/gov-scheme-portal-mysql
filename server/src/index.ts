import "dotenv/config";
import express from "express";
import cors from "cors";
import { initDb } from "./db";
import { createSchemesRouter } from "./routes/schemes";
import { createEligibilityRouter } from "./routes/eligibility";
import { createAuthRouter } from "./routes/auth";
import { createApplicationsRouter } from "./routes/applications";
import { createAdminRouter } from "./routes/admin";

const PORT = process.env.PORT || 3001;

async function main() {
  const pool = await initDb();

  const app = express();
  app.use(cors({ origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"] }));
  app.use(express.json());

  app.use("/api/auth", createAuthRouter(pool));
  app.use("/api/schemes", createSchemesRouter(pool));
  app.use("/api/eligibility", createEligibilityRouter(pool));
  app.use("/api/applications", createApplicationsRouter(pool));
  app.use("/api/admin", createAdminRouter(pool));

  app.get("/api/categories", (_req, res) => {
    const categories = [
      { id: "healthcare", label: "Healthcare", label_hi: "स्वास्थ्य सेवा" },
      { id: "education", label: "Education", label_hi: "शिक्षा" },
      { id: "agriculture", label: "Agriculture", label_hi: "कृषि" },
      { id: "housing", label: "Housing", label_hi: "आवास" },
      { id: "employment", label: "Employment", label_hi: "रोजगार" },
      { id: "women_child", label: "Women & Child", label_hi: "महिला एवं बाल" },
      { id: "senior_citizens", label: "Senior Citizens", label_hi: "वरिष्ठ नागरिक" },
      { id: "disability", label: "Disability", label_hi: "दिव्यांगजन" },
      { id: "startup_msme", label: "Startup / MSME", label_hi: "स्टार्टअप / MSME" },
      { id: "financial_inclusion", label: "Financial Inclusion", label_hi: "वित्तीय समावेशन" },
      { id: "energy", label: "Energy", label_hi: "ऊर्जा" },
    ];
    res.json(categories);
  });

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

main().catch(console.error);
