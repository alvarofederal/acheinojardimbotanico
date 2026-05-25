// Cria/garante um ADMIN de teste com senha conhecida e email verificado,
// usado pelos testes E2E do Cypress. Não interfere no admin real.
import { PrismaClient } from "../src/generated/prisma/index.js"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

const EMAIL = "cypress-admin@ajb.test"
const PASSWORD = "CypressAdmin#2026"

const passwordHash = await bcrypt.hash(PASSWORD, 10)

const user = await prisma.user.upsert({
  where: { email: EMAIL },
  update: { role: "ADMIN", passwordHash, emailVerified: new Date() },
  create: { email: EMAIL, name: "Cypress Admin", role: "ADMIN", passwordHash, emailVerified: new Date() },
})

console.log(`✅ Admin de teste pronto: ${user.email} (role=${user.role})`)
await prisma.$disconnect()
