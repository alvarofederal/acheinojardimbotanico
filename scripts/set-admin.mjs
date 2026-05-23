import { PrismaClient } from "../src/generated/prisma/index.js"

const prisma = new PrismaClient()

const result = await prisma.user.updateMany({
  where: { email: "alvarofederal@gmail.com" },
  data: { role: "ADMIN" },
})

console.log(`✅ Usuários atualizados: ${result.count}`)
await prisma.$disconnect()
