import initSqlJs from "sql.js";
import path from "path";
import fs from "fs";
import { seedSchemes } from "./seedData";

async function migrate() {
  const dataDir = path.join(__dirname, "..", "..", "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const DB_PATH = path.join(dataDir, "schemes.db");

  const SQL = await initSqlJs();
  const db = new SQL.Database();

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      scheme_id INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      applied_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (scheme_id) REFERENCES schemes(id),
      UNIQUE(user_id, scheme_id)
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS schemes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      name_hi TEXT NOT NULL,
      ministry TEXT NOT NULL,
      ministry_hi TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      description_hi TEXT NOT NULL,
      eligibility_criteria TEXT NOT NULL,
      required_documents TEXT NOT NULL,
      application_process TEXT NOT NULL,
      benefit_amount TEXT NOT NULL,
      benefit_type TEXT NOT NULL,
      deadline TEXT,
      official_link TEXT NOT NULL,
      tags TEXT NOT NULL,
      is_new INTEGER DEFAULT 0,
      min_age INTEGER,
      max_age INTEGER,
      max_income INTEGER,
      gender_restriction TEXT,
      category_restriction TEXT,
      disability_required INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);

  const insertSql = `
    INSERT INTO schemes (
      name, name_hi, ministry, ministry_hi, category,
      description, description_hi, eligibility_criteria, required_documents,
      application_process, benefit_amount, benefit_type, deadline,
      official_link, tags, is_new, min_age, max_age, max_income,
      gender_restriction, category_restriction, disability_required
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  for (const s of seedSchemes) {
    db.run(insertSql, [
      s.name, s.name_hi, s.ministry, s.ministry_hi, s.category,
      s.description, s.description_hi, s.eligibility_criteria, s.required_documents,
      s.application_process, s.benefit_amount, s.benefit_type, s.deadline,
      s.official_link, s.tags, s.is_new, s.min_age, s.max_age, s.max_income,
      s.gender_restriction, s.category_restriction, s.disability_required,
    ]);
  }

  // Seed default admin (password: admin123)
  const bcrypt = await import("bcryptjs");
  const adminHash = await bcrypt.hash("admin123", 12);
  db.run(
    "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
    ["Admin", "admin@gov.in", adminHash, "admin"]
  );

  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
  db.close();

  console.log(`Seeded ${seedSchemes.length} schemes into ${DB_PATH}`);
}

migrate().catch(console.error);
