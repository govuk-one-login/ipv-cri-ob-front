Feature: Language toggle

  Scenario: Selecting Welsh changes the page language
    Given I navigate to the app
    When I select Welsh
    Then the page should be displayed in Welsh
