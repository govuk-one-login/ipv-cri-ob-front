@mock
Feature: Failed Open Banking authorisation

  Scenario: User is returned an access denied error when authorisation is rejected
    Given the user initiates an authorisation request with "test-jwt-error"
    When the Open Banking callback is processed
    Then an "access_denied" error with description "Authorization permission denied" is returned
    And the session API was called with the JWT
    And the authorisation API was called with the correct session ID "8BADF00D"
