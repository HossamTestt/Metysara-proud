describe('Support & FAQ Flow', () => {
  beforeEach(() => {
    // Visit the profile page
    cy.visit('/profile')
  })

  it('should navigate to the FAQ section', () => {
    // We assume the user is logged in via a programmatic login command in a real scenario
    // Click on FAQ tab
    cy.contains(/FAQ|الأسئلة الشائعة/).click({ force: true })

    // Verify FAQ content is visible
    cy.contains(/How do I book a venue\?|كيف يمكنني حجز مكان؟/).should('be.visible')
  })

  it('should navigate to Live Chat from Support tab', () => {
    // Click on Support tab
    cy.contains(/Support|الدعم/).click({ force: true })

    // Click Start Live Chat
    cy.contains(/Start Live Chat|بدء محادثة مباشرة/).click({ force: true })

    // Verify chat screen URL
    cy.url().should('include', '/chat')
  })
})
