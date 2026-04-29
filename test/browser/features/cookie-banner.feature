Feature: Cookie banner

  Scenario: Accepting cookies sets the user preference cookie
    Given the user navigates to the root page
    When they accept additional cookies
    Then the cookies preferences cookie is set with analytics true
    And the cookies accepted banner is visible
