describe('Authentication Flow', () => {
  beforeEach(() => {
    // Visit the app
    cy.visit('/login')
  })

  it('should display the login page', () => {
    // Check if the login form is rendered
    cy.get('input[type="email"]').should('be.visible')
    cy.get('input[type="password"]').should('be.visible')
  })

  it('should navigate to signup from login', () => {
    cy.contains(/Sign Up|إنشاء حساب/).click()
    cy.url().should('include', '/signup')
    cy.get('input[placeholder*="Name"], input[placeholder*="الاسم"]').should('be.visible')
  })

  it('should show validation errors on empty login submit', () => {
    cy.get('button').contains(/Login|تسجيل الدخول/).click()
    cy.on('window:alert', (text) => {
      expect(text).to.contains('Please fill')
    })
  })
})
