@mock
Feature: Successful Open Banking authorisation

  Scenario: User completes the full journey and receives an authorisation code
    Given the user initiates an authorisation request with "test-jwt-success"
    When the Open Banking callback is processed
    Then an authorisation code "DEADBEEF" and state "sT@t3" are returned to the client
    And the session API was called with the JWT
    And the authorisation API was called with the correct session ID "CAFEBABE"
