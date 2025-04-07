describe('Position Interface Tests', () => {
  beforeEach(() => {
    // Visitar la página de posición antes de cada prueba
    cy.visit('/position/1') // Ajusta la URL según tu aplicación
    
    // Esperar a que la página cargue completamente
    cy.get('[data-testid="position-container"]').should('be.visible')
  })

  describe('1. Carga inicial de la interfaz', () => {
    it('Muestra el título de la posición correctamente', () => {
      cy.get('[data-testid="position-title"]').should('be.visible')
    })

    it('Renderiza las columnas del proceso de contratación', () => {
      cy.get('[data-testid="stage-column"]').should('have.length.at.least', 1)
    })

    it('Muestra las tarjetas de candidatos en sus columnas correspondientes', () => {
      // Verificar que cada columna tenga sus tarjetas respectivas
      cy.get('[data-testid="stage-column"]').each(($column) => {
        // Obtener el ID de la etapa desde el atributo de datos
        const stageId = $column.attr('data-stage-id')
        
        // Verificar que las tarjetas dentro de esta columna pertenezcan a esta etapa
        cy.wrap($column).find('[data-testid="candidate-card"]').each(($card) => {
          cy.wrap($card).should('have.attr', 'data-stage-id', stageId)
        })
      })
    })
  })

  describe('2. Cambio de etapa (drag and drop)', () => {
    it('Permite arrastrar un candidato a otra columna y actualiza su estado', () => {
      // Interceptar la petición PUT que se hará al mover el candidato
      cy.intercept('PUT', '/candidate/*').as('updateCandidate')
      
      // Obtener una tarjeta de candidato y la columna destino
      cy.get('[data-testid="candidate-card"]').first().as('sourceCard')
      
      // Obtener la columna destino (la segunda columna)
      cy.get('[data-testid="stage-column"]').eq(1).as('targetColumn')
      
      // Obtener el ID del candidato y el ID de la etapa destino
      cy.get('@sourceCard').invoke('attr', 'data-candidate-id').then((candidateId) => {
        cy.get('@targetColumn').invoke('attr', 'data-stage-id').then((targetStageId) => {
          
          // Realizar el drag and drop
          cy.get('@sourceCard')
            .drag('@targetColumn', { force: true })
          
          // Verificar que la tarjeta se haya movido a la columna destino
          cy.get('@targetColumn')
            .find(`[data-candidate-id="${candidateId}"]`)
            .should('exist')
          
          // Verificar que se haya enviado la petición PUT al backend
          cy.wait('@updateCandidate').then((interception) => {
            expect(interception.request.url).to.include(`/candidate/${candidateId}`)
            expect(interception.request.body.stageId).to.equal(targetStageId)
            expect(interception.response.statusCode).to.eq(200)
          })
        })
      })
    })
  })
}) 