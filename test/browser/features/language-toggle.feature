Feature: Language toggle

  Scenario: Selecting Welsh changes the page language
    Given the user navigates to the root page
    When they select Welsh
    Then the page language is "cy"
    And the language preference cookie is set
    And the page heading contains "Cyhoeddwr Cymwysterau Bancio Agored"
    And the page title is "Cyhoeddwr Cymwysterau Bancio Agored – GOV.UK One Login"
