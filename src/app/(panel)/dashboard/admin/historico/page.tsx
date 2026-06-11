import { redirect } from "next/navigation"

// Histórico foi mesclado à Auditoria (mesma fonte de dados, filtro "lojistas").
export default function AdminHistoricoPage() {
  redirect("/dashboard/admin/audit?escopo=lojistas")
}
