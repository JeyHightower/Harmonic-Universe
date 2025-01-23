describe('Common Components', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  describe('EmptyState', () => {
    it('should render empty state with default props', () => {
      cy.mount(<EmptyState />);
      cy.get('[data-testid="empty-state"]').should('be.visible');
      cy.get('[data-testid="empty-state-icon"]').should('be.visible');
      cy.get('[data-testid="empty-state-title"]').should(
        'contain',
        'No items found'
      );
    });

    it('should render empty state with custom props', () => {
      cy.mount(
        <EmptyState
          icon="custom-icon"
          title="Custom Title"
          description="Custom Description"
          actionText="Custom Action"
          onAction={() => {}}
        />
      );
      cy.get('[data-testid="empty-state-icon"]').should(
        'have.class',
        'custom-icon'
      );
      cy.get('[data-testid="empty-state-title"]').should(
        'contain',
        'Custom Title'
      );
      cy.get('[data-testid="empty-state-description"]').should(
        'contain',
        'Custom Description'
      );
      cy.get('[data-testid="empty-state-action"]').should(
        'contain',
        'Custom Action'
      );
    });
  });

  describe('LazyImage', () => {
    it('should render loading state initially', () => {
      cy.mount(<LazyImage src="test.jpg" alt="Test" />);
      cy.get('[data-testid="lazy-image-loading"]').should('be.visible');
    });

    it('should render image after loading', () => {
      cy.mount(<LazyImage src="test.jpg" alt="Test" />);
      cy.get('img').should('have.attr', 'src', 'test.jpg');
      cy.get('img').should('have.attr', 'alt', 'Test');
      cy.get('[data-testid="lazy-image-loading"]').should('not.exist');
    });

    it('should handle loading error', () => {
      cy.mount(<LazyImage src="invalid.jpg" alt="Test" />);
      cy.get('img').should('have.attr', 'src', 'invalid.jpg');
      cy.get('[data-testid="lazy-image-error"]').should('be.visible');
    });
  });

  describe('LoadingErrorState', () => {
    it('should render loading state', () => {
      cy.mount(<LoadingErrorState isLoading={true} />);
      cy.get('[data-testid="loading-spinner"]').should('be.visible');
    });

    it('should render error state', () => {
      cy.mount(<LoadingErrorState error="Test Error" onRetry={() => {}} />);
      cy.get('[data-testid="error-message"]').should('contain', 'Test Error');
      cy.get('[data-testid="retry-button"]').should('be.visible');
    });

    it('should handle retry action', () => {
      const onRetry = cy.stub().as('onRetry');
      cy.mount(<LoadingErrorState error="Test Error" onRetry={onRetry} />);
      cy.get('[data-testid="retry-button"]').click();
      cy.get('@onRetry').should('have.been.called');
    });
  });

  describe('LoadingSpinner', () => {
    it('should render with default props', () => {
      cy.mount(<LoadingSpinner />);
      cy.get('[data-testid="loading-spinner"]').should('be.visible');
      cy.get('[data-testid="loading-text"]').should('contain', 'Loading...');
    });

    it('should render with custom props', () => {
      cy.mount(
        <LoadingSpinner size="large" text="Custom Loading" color="red" />
      );
      cy.get('[data-testid="loading-spinner"]')
        .should('have.class', 'large')
        .and('have.css', 'color', 'red');
      cy.get('[data-testid="loading-text"]').should(
        'contain',
        'Custom Loading'
      );
    });
  });

  describe('Modal', () => {
    it('should render when open', () => {
      cy.mount(
        <Modal isOpen={true} onClose={() => {}} title="Test Modal">
          <div>Modal Content</div>
        </Modal>
      );
      cy.get('[data-testid="modal"]').should('be.visible');
      cy.get('[data-testid="modal-title"]').should('contain', 'Test Modal');
      cy.get('[data-testid="modal-content"]').should(
        'contain',
        'Modal Content'
      );
    });

    it('should not render when closed', () => {
      cy.mount(
        <Modal isOpen={false} onClose={() => {}} title="Test Modal">
          <div>Modal Content</div>
        </Modal>
      );
      cy.get('[data-testid="modal"]').should('not.exist');
    });

    it('should handle close action', () => {
      const onClose = cy.stub().as('onClose');
      cy.mount(
        <Modal isOpen={true} onClose={onClose} title="Test Modal">
          <div>Modal Content</div>
        </Modal>
      );
      cy.get('[data-testid="modal-close"]').click();
      cy.get('@onClose').should('have.been.called');
    });

    it('should handle click outside', () => {
      const onClose = cy.stub().as('onClose');
      cy.mount(
        <Modal isOpen={true} onClose={onClose} title="Test Modal">
          <div>Modal Content</div>
        </Modal>
      );
      cy.get('[data-testid="modal-overlay"]').click('topLeft');
      cy.get('@onClose').should('have.been.called');
    });

    it('should prevent click propagation inside modal', () => {
      const onClose = cy.stub().as('onClose');
      cy.mount(
        <Modal isOpen={true} onClose={onClose} title="Test Modal">
          <div>Modal Content</div>
        </Modal>
      );
      cy.get('[data-testid="modal-content"]').click();
      cy.get('@onClose').should('not.have.been.called');
    });
  });

  describe('Search', () => {
    it('should render search input', () => {
      cy.mount(<Search onSearch={() => {}} />);
      cy.get('[data-testid="search-input"]').should('be.visible');
    });

    it('should handle input change', () => {
      const onSearch = cy.stub().as('onSearch');
      cy.mount(<Search onSearch={onSearch} />);
      cy.get('[data-testid="search-input"]').type('test');
      cy.get('@onSearch').should('have.been.calledWith', 'test');
    });

    it('should debounce search input', () => {
      const onSearch = cy.stub().as('onSearch');
      cy.mount(<Search onSearch={onSearch} debounce={300} />);
      cy.get('[data-testid="search-input"]').type('test');
      cy.get('@onSearch').should('not.have.been.called');
      cy.wait(300);
      cy.get('@onSearch').should('have.been.calledWith', 'test');
    });

    it('should clear search input', () => {
      const onSearch = cy.stub().as('onSearch');
      cy.mount(<Search onSearch={onSearch} />);
      cy.get('[data-testid="search-input"]').type('test');
      cy.get('[data-testid="search-clear"]').click();
      cy.get('[data-testid="search-input"]').should('have.value', '');
      cy.get('@onSearch').should('have.been.calledWith', '');
    });
  });

  describe('SuccessMessage', () => {
    it('should render success message', () => {
      cy.mount(<SuccessMessage message="Test Success" onClose={() => {}} />);
      cy.get('[data-testid="success-message"]').should('be.visible');
      cy.get('[data-testid="success-text"]').should('contain', 'Test Success');
    });

    it('should auto-hide after delay', () => {
      const onClose = cy.stub().as('onClose');
      cy.mount(
        <SuccessMessage
          message="Test Success"
          onClose={onClose}
          autoHideDuration={1000}
        />
      );
      cy.get('[data-testid="success-message"]').should('be.visible');
      cy.wait(1000);
      cy.get('@onClose').should('have.been.called');
    });

    it('should handle manual close', () => {
      const onClose = cy.stub().as('onClose');
      cy.mount(<SuccessMessage message="Test Success" onClose={onClose} />);
      cy.get('[data-testid="success-close"]').click();
      cy.get('@onClose').should('have.been.called');
    });

    it('should prevent auto-hide when hovered', () => {
      const onClose = cy.stub().as('onClose');
      cy.mount(
        <SuccessMessage
          message="Test Success"
          onClose={onClose}
          autoHideDuration={1000}
        />
      );
      cy.get('[data-testid="success-message"]').trigger('mouseenter');
      cy.wait(1000);
      cy.get('@onClose').should('not.have.been.called');
      cy.get('[data-testid="success-message"]').trigger('mouseleave');
      cy.wait(1000);
      cy.get('@onClose').should('have.been.called');
    });
  });
});
