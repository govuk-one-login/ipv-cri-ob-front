Feature: Error pages

  Scenario: Navigating to a non-existent route shows the 404 page
    When the user navigates to "/this-page-does-not-exist"
    Then the page heading contains "Page not found"
    And the page title matches "Page not found"
    And the GOV.UK homepage link is present
    And the One Login contact link is present

  Scenario: 404 page is displayed in Welsh when Welsh is selected
    Given the user navigates to the root page
    And they select Welsh
    When the user navigates to "/this-page-does-not-exist"
    Then the page heading contains "Tudalen heb ei darganfod"
    And the page title matches "Tudalen heb ei darganfod"
    And the Welsh GOV.UK homepage link is present
    And the Welsh One Login contact link is present
