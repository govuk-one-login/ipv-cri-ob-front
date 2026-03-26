Feature: Error pages

  Scenario: Navigating to a non-existent route shows the 404 page
    When I navigate to a page that does not exist
    Then I should see the page not found page

  Scenario: The 404 page is displayed in Welsh when Welsh is selected
    Given I navigate to the app
    When I select Welsh
    And I navigate to a page that does not exist
    Then I should see the Welsh page not found page
