Feature: OAuth2 flow

  @happy-path
  Scenario: Authorization code is returned to the client after a successful Open Banking journey
    When I start the Open Banking journey
    And I return to the app after completing the bank interaction
    Then I should be redirected with an authorization code

  @error-path
  Scenario: Access denied error is returned to the client when no authorization code is present
    When I start the Open Banking journey
    And I return to the app after an unsuccessful bank interaction
    Then I should be redirected with an access denied error
