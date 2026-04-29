@smoke
Feature: App availability

  Scenario: App root responds successfully
    When the user requests the root page
    Then the response status is 200
