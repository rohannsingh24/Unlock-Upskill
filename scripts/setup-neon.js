const { neon } = require("@neondatabase/serverless")
require('dotenv').config();
console.log("DATABASE_URL from env:", process.env.DATABASE_URL);


async function setupNeonDatabase() {
  try {
    console.log("🔍 Setting up Neon database...")

    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is required")
    }

    // Initialize Neon connection
    const sql = neon(process.env.DATABASE_URL)

    console.log("📡 Connected to Neon PostgreSQL")

    // Test connection
    console.log("🧪 Testing connection...")
    const testResult = await sql`SELECT NOW() as current_time`
    console.log("✅ Connection test passed:", testResult[0].current_time)

    console.log("👥 Creating users table...")
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    console.log("💳 Creating payments table...")
    await sql`
      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        razorpay_order_id VARCHAR(255),
        razorpay_payment_id VARCHAR(255),
        razorpay_signature TEXT,
        amount INTEGER NOT NULL,
        status VARCHAR(20) DEFAULT 'created' CHECK (status IN ('created', 'completed', 'failed')),
        verified BOOLEAN DEFAULT FALSE,
        verified_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    console.log("📊 Creating indexes...")
    await sql`CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_payments_razorpay_order_id ON payments(razorpay_order_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`

    console.log("📋 Showing tables...")
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `

    console.log("✅ Created tables:", tables.map((row) => row.table_name).join(", "))

    // Show table structures
    console.log("\n📋 Table structures:")

    const usersStructure = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `

    console.log("👥 Users table:")
    usersStructure.forEach((col) => {
      console.log(`   ${col.column_name}: ${col.data_type} ${col.is_nullable === "NO" ? "NOT NULL" : "NULL"}`)
    })

    const paymentsStructure = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'payments' 
      ORDER BY ordinal_position
    `

    console.log("💳 Payments table:")
    paymentsStructure.forEach((col) => {
      console.log(`   ${col.column_name}: ${col.data_type} ${col.is_nullable === "NO" ? "NOT NULL" : "NULL"}`)
    })

    console.log("\n🎉 Neon database setup completed successfully!")
    console.log("📋 Next steps:")
    console.log("   1. Your Neon database is ready to use")
    console.log("   2. Update your Render environment variables")
    console.log("   3. Deploy to Render: the connection should work perfectly!")
  } catch (error) {
    console.error("❌ Neon database setup failed:", error)
    console.error("Please check your Neon DATABASE_URL and try again")
  }
}

setupNeonDatabase()
