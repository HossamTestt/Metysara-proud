describe('Booking Flow', () => {
  beforeEach(() => {
    // Visit the home page
    cy.visit('/home')
  })

  it('should prevent booking with invalid phone number format', () => {
    // Note: Since this is an E2E test, we would normally log in first.
    // For this test, we assume the user is either logged in or we navigate to a venue that allows guest viewing.
    
    // Attempt to navigate to a venue details page (using the first available venue card)
    cy.get('.cursor-pointer').first().click({ force: true })

    // Click "Book Now"
    cy.contains(/Book Now|احجز الآن/).click({ force: true })

    // Select a date from the calendar (just click an available day)
    cy.get('.rdp-day').not('.rdp-day_disabled').first().click({ force: true })
    
    // Select a time slot
    cy.contains(/Morning|الصباح|Evening|المساء/).first().click({ force: true })
    
    // Continue
    cy.contains(/Continue|متابعة/).click({ force: true })

    // Wait to reach the details form
    cy.get('input[type="tel"]').should('be.visible').type('03012345678') // Invalid prefix

    // Accept terms
    cy.get('button[role="checkbox"]').click({ force: true })

    // Submit
    cy.contains(/Continue to Payment|متابعة للدفع/).click({ force: true })

    // Verify error toast appears for invalid phone number
    cy.contains(/Invalid Egyptian mobile number|رقم هاتف مصري غير صالح/).should('be.visible')
  })
})
