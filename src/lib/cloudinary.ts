/**
 * src/lib/cloudinary.ts
 * Upload de imagens para o Cloudinary — usado pelo upload do lojista, pela
 * auto-cura do proxy de fotos e pela migração em massa. Hospedar as fotos no
 * Cloudinary elimina o custo por-visualização da API do Google.
 */
import { v2 as cloudinary } from "cloudinary"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
  secure: true,
})

export function isCloudinaryUrl(url: string | null | undefined): boolean {
  return !!url && url.includes("res.cloudinary.com")
}

/** public_id determinístico a partir do nome da foto do Google (idempotente). */
export function publicIdFromPhotoName(photoName: string): string {
  return photoName.replace(/[^a-zA-Z0-9]+/g, "_").slice(0, 120)
}

/**
 * Sobe uma imagem (URL remota ou data URI) para o Cloudinary e retorna a
 * secure_url. Com `overwrite`, rodar de novo no mesmo public_id não duplica.
 */
export async function uploadToCloudinary(source: string, publicId: string, folder = "achei/places"): Promise<string> {
  const res = await cloudinary.uploader.upload(source, {
    public_id: publicId,
    folder,
    overwrite: true,
    resource_type: "image",
    transformation: [{ quality: "auto", fetch_format: "auto" }],
  })
  return res.secure_url
}

export { cloudinary }
