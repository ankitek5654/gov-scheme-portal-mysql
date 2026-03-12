import mysql from "mysql2/promise";
import dotenv from "dotenv";
import path from "path";
import { seedSchemes } from "./seedData";

dotenv.config({ path: path.join(__dirname, "..", "..", ".env") });

async function migrate() {
  const DB_NAME = process.env.DB_NAME || "gov_scheme_portal";

  // Connect without database first to create it
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASS || "",
  });

  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\``);
  await conn.query(`USE \`${DB_NAME}\``);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(200) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'user',
      created_at DATETIME DEFAULT NOW()
    )
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS schemes (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(500) NOT NULL,
      name_hi VARCHAR(500) NOT NULL,
      ministry VARCHAR(500) NOT NULL,
      ministry_hi VARCHAR(500) NOT NULL,
      category VARCHAR(100) NOT NULL,
      description TEXT NOT NULL,
      description_hi TEXT NOT NULL,
      eligibility_criteria TEXT NOT NULL,
      required_documents TEXT NOT NULL,
      application_process TEXT NOT NULL,
      benefit_amount VARCHAR(200) NOT NULL,
      benefit_type VARCHAR(200) NOT NULL,
      deadline VARCHAR(100),
      official_link VARCHAR(500) NOT NULL,
      tags TEXT NOT NULL,
      is_new TINYINT DEFAULT 0,
      min_age INT,
      max_age INT,
      max_income INT,
      gender_restriction VARCHAR(50),
      category_restriction VARCHAR(100),
      disability_required TINYINT DEFAULT 0,
      created_at DATETIME DEFAULT NOW(),
      updated_at DATETIME DEFAULT NOW() ON UPDATE NOW()
    )
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS applications (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT NOT NULL,
      scheme_id INT NOT NULL,
      status VARCHAR(30) NOT NULL DEFAULT 'pending',
      applied_at DATETIME DEFAULT NOW(),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (scheme_id) REFERENCES schemes(id),
      UNIQUE KEY unique_user_scheme (user_id, scheme_id)
    )
  `);

  // Seed schemes
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
    await conn.execute(insertSql, [
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
  await conn.execute(
    "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
    ["Admin", "admin@gov.in", adminHash, "admin"]
  );

  await conn.end();
  console.log(`Seeded ${seedSchemes.length} schemes into MySQL database '${DB_NAME}'`);
}

migrate().catch(console.error);
