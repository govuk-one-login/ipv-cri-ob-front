Feature: Cookie banner

  Scenario: Accepting cookies sets the user preference cookie
    Given I navigate to the app
    Then I should see the cookie banner
    When I accept additional cookies
    Then the cookie preference should be saved
