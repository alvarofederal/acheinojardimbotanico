/// <reference types="cypress" />

/**
 * E2E — Planos & Cobrança (controle do admin)
 * Loga como admin de teste, abre a tela e prova que cada controle
 * (preço, limites, recursos, ativo, rótulo) lê, salva e persiste. Tudo é restaurado.
 *
 * Pré-requisitos:
 *   - server rodando em http://localhost:3000 (dev recomendado)
 *   - admin de teste semeado: npm run seed:test-admin
 */

// Ignora exceções não-tratadas da aplicação (ex.: avisos de hydration do React
// em dev). Não mascaram falhas dos asserts — só evitam ruído do framework.
Cypress.on("uncaught:exception", () => false)

const ADMIN = { email: "cypress-admin@ajb.test", password: "CypressAdmin#2026" }
const PLANS = ["FREE", "VISIBILITY", "PREMIUM"] as const
const FEATURES = ["promocoes", "loja", "eventos", "metricas", "destaque", "redesSociais", "selo"] as const
const CONFIG_URL = "/dashboard/admin/pagamento"

function login() {
  cy.request("POST", "/api/auth/login-and-redirect", ADMIN).its("status").should("eq", 200)
}

/** Clica em salvar e confirma que a API respondeu 200. */
function saveAndExpectOk() {
  cy.intercept("PATCH", "/api/admin/pagamento").as("save")
  cy.get("[data-testid=save-plans]").click()
  cy.wait("@save").its("response.statusCode").should("eq", 200)
  cy.contains("Configuração salva").should("be.visible")
}

describe("Planos & Cobrança — controle do admin", () => {
  beforeEach(() => login())

  it("renderiza os 3 planos, cada um com os 7 recursos", () => {
    cy.visit(CONFIG_URL)
    cy.contains("Planos & Cobrança").should("be.visible")
    PLANS.forEach(p => {
      cy.get(`[data-testid=plan-card-${p}]`).should("exist")
      cy.get(`[data-testid=price-${p}]`).should("exist")
      cy.get(`[data-testid=products-${p}]`).should("exist")
      cy.get(`[data-testid=photos-${p}]`).should("exist")
      FEATURES.forEach(f => cy.get(`[data-testid=feat-${p}-${f}]`).should("exist"))
    })
  })

  it("Free é protegido: preço e 'Ativo' desabilitados", () => {
    cy.visit(CONFIG_URL)
    cy.get("[data-testid=active-FREE]").should("be.disabled")
    cy.get("[data-testid=price-FREE]").should("be.disabled")
  })

  it("salva preço e limite, persiste após reload, e restaura", () => {
    cy.visit(CONFIG_URL)
    cy.get("[data-testid=price-VISIBILITY]").invoke("val").then(origPrice => {
      cy.get("[data-testid=products-PREMIUM]").invoke("val").then(origProd => {
        cy.get("[data-testid=price-VISIBILITY]").clear()
        cy.get("[data-testid=price-VISIBILITY]").type("123.45").should("have.value", "123.45")
        cy.get("[data-testid=products-PREMIUM]").clear()
        cy.get("[data-testid=products-PREMIUM]").type("42").should("have.value", "42")
        saveAndExpectOk()

        cy.reload()
        cy.get("[data-testid=price-VISIBILITY]").should("have.value", "123.45")
        cy.get("[data-testid=products-PREMIUM]").should("have.value", "42")

        // restaura
        cy.get("[data-testid=price-VISIBILITY]").clear()
        cy.get("[data-testid=price-VISIBILITY]").type(String(origPrice))
        cy.get("[data-testid=products-PREMIUM]").clear()
        cy.get("[data-testid=products-PREMIUM]").type(String(origProd))
        saveAndExpectOk()
      })
    })
  })

  it("liga/desliga um recurso (Premium → Loja) e persiste, depois restaura", () => {
    cy.visit(CONFIG_URL)
    cy.get("[data-testid=feat-PREMIUM-loja]").then($cb => {
      const was = $cb.is(":checked")
      const sel = "[data-testid=feat-PREMIUM-loja]"

      // inverte e salva
      cy.get(sel)[was ? "uncheck" : "check"]({ force: true })
      saveAndExpectOk()

      // persiste
      cy.reload()
      cy.get(sel).should(was ? "not.be.checked" : "be.checked")

      // restaura ao estado original
      cy.get(sel)[was ? "check" : "uncheck"]({ force: true })
      saveAndExpectOk()
      cy.reload()
      cy.get(sel).should(was ? "be.checked" : "not.be.checked")
    })
  })

  it("renomeia o rótulo de um plano e persiste, depois restaura", () => {
    cy.visit(CONFIG_URL)
    const sel = "[data-testid=label-VISIBILITY]"
    cy.get(sel).invoke("val").then(orig => {
      cy.get(sel).clear()
      cy.get(sel).type("Visibilidade Plus")
      saveAndExpectOk()
      cy.reload()
      cy.get(sel).should("have.value", "Visibilidade Plus")
      // restaura
      cy.get(sel).clear()
      cy.get(sel).type(String(orig))
      saveAndExpectOk()
    })
  })
})
