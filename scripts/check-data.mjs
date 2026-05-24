import "dotenv/config"
import { PrismaClient } from "../src/generated/prisma/index.js"
const db = new PrismaClient()
const KEY = process.env.GOOGLE_PLACES_API_KEY

const total = await db.photo.count()
const all = await db.photo.findMany({ select: { url: true } })
const proxied = all.filter(p => p.url.startsWith("/api/photo/")).length
console.log(`Fotos: ${total} | proxy: ${proxied} | antigas: ${total - proxied}`)

// simula o que o proxy faz: photoName → Google skipHttpRedirect → photoUri
const name = all[0].url.replace("/api/photo/", "")
const url = `https://places.googleapis.com/v1/${name}/media?maxWidthPx=1600&key=${KEY}&skipHttpRedirect=true`
const res = await fetch(url)
const data = await res.json()
console.log(`\nProxy → Google: HTTP ${res.status}`)
console.log("photoUri:", data.photoUri ? data.photoUri.slice(0, 70) + "..." : JSON.stringify(data).slice(0, 150))
await db.$disconnect()
