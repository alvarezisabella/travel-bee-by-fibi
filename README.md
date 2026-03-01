# FiBi presents: Travelbee 

## Overview
An all-in-one travel web app that consolidates every part of vacation planning into one cohesive platform.

## Sprint Goals:
  * Sprint #1: Set up dev environment and begin the Itinerary Page flow
    
## Main Functions
Sprint Backlog	TravelBee by FIBI		
			
### Sprint Dates: 3/3/26 - 3/17/26			
Sprint Goal: Set up dev environment and begin the Itinerary Page flow			
			
## Itinerary Story 1: Landing on Itinerary Page			
As a first time user		
I want to	view itinerary page		
so that	i can create a trip hub to take care of all my travel concerns		
* Priority	High		
* Effort	med		
* Assigned to	**Silvia**
### Acceptance Criteria
* [ ] Given I am routed to the landing page, I can see a header that allows me to input a photo, trip name, dates, and see the number of travelers who are on this trip.
* [ ] Given that I click on 'upload photo,' I can choose a photo on my device and it will appear on the page.
* [ ] Given tha I click 'add location,' I can input a country, city, state
* [ ] Given that I click 'add dates,' I can input a month, date, year*
* [ ] Itinerary shows information inputted in create trip pop up 
### Technical Tasks
* [ ] Create itinerary object class with variables for start and end dates, location, photo, and name.
* [ ] Design UI interface for it
* [ ] Create appropriate getter functions for displaying accurate information.		
			
## Itinerary Story 2: Add Day			
As a registered user		
I want to	add a day to my itinerary		
so that	organize my trip by days		
* Priority	High		
* Effort	med		
* Assigned to **Isabella**
### Acceptance Criteria
* [ ] Given that an 'add day' button is below the header, I am able to click on it and input a month, day, year.        
* [ ] Given that I inputted a month, day, year, I can click the 'save' button and my actions will reflect on the page.        
### Technical Tasks
* [ ] Create add day button
* [ ] Create design for empty day
			
## Itinerary Story 3: Creating Event			
As a registered user		
I want to	add an event to my itinerary		
so that	I can make updates to my trip plan.		
* Priority	high		
* Effort	med		
* Assigned to **Brenda**
### Acceptance Criteria	
* [ ] Given I click on the create an event button, I will see a pop up where I can create an event.
* [ ] I can edit information about event title, date/time, location, and cost
* [ ] I can designate whether the event is an activity, task, or commute.
* [ ] I can designate whether the event is booked, pending, or an idea.
* [ ] When I click save, the event appears on the intinerary with the accurate information.
### Technical Tasks	
* [ ] Create add button that displays a create event pop up when clicked
* [ ] Create event object class with variables like start and end times, location, cost, name, and description.
* [ ] When event is saved, the event appears accurately on the itinerary.
* [ ] Create an X button, which does not save the event
			
## Itinerary Story 4: Editing Events			
As a	registered user		
I want to	change an event's information		
so that	I can keep the information accurately		
* Priority	high		
* Effort	low		
* Assigned to **Brenda**
### Acceptance Criteria	
* [ ] Given I click the edit button on a particular event, the event's information pops up accurately
* [ ] I can change any information for the event and it will appear accurately on the itinerary. "		
### Technical Tasks	
* [ ] Create appropriate setter functions to accurately change event information
* [ ] Ensure "save" button works for existing events
			
## Itinerary Story 5: Deleting Events			
As a	registered user		
I want to	delete an event		
so that	remove it from the itinerary.		
* Priority	High		
* Effort	low		
* Assigned to **Brenda**
### Acceptance Criteria	
* [ ] While on the intinerary page, I can click on the delete button, and the event will be removed from the itinerary.		
### Technical Tasks	
* [ ] Create a delete button that appears when an event is selected
* [ ] Safely remove the information about the selected event from the database
* [ ] Ensure deleted events do not appear on the itinerary
			
## Itinerary Story 6: Voting for Events			
As a friend on a group itinerary		
I want to	upvote or downvote an event		
so that	others in my group will know how I feel about the event		
* Priority	med		
* Effort	med		
* Assigned to **Isabella**
### Acceptance Criteria	
* [ ] Given that I clicked the thumbs up button, a counter will increase, the icon will fill, and everyone in the group can see my vote.
* [ ] Given that I clicked the thumbs down button, a counter will increase, the icon will fill, and everyone in the group can see my vote.
* [ ] Given that I click and thumbs up/thumbs down that has already been clicked, I can click it again and a counter will decrease and the icon will lose its fill."		
### Technical Tasks	
* [ ] Create upvote and downvote buttons that react when user clicks on them
* [ ] Create variables for event objects that store the number of up/downvotes and who did each vote
* [ ] Ensure votes are accurately displayed
			
## Itinerary Story 7: Invite people to trip with link			
As a registered user		
I want to	invite friends to a trip		
so that	collaborate in a shared itinerary		
* Priority	High		
* Effort	low		
* Assigned to			
### Acceptance Criteria	
* [ ] Given I click on travelers icon, 'add travelers' pop up is shown
* [ ] when copy link is pressed, user gets feedback that link is copied, link is in their clipboard
* [ ] when recipient presses link, they are taken to itinerary page with an accept invite popup 
* [ ] When 'accept invite' button at bottom of pop up is pressed, then user has full view & edit abilities of itinerary
### Technical Tasks
* [ ] Create invite friends button that brings up the invite pop up
* [ ] Create variable for trip members that store what role they have (owner/editor/viewer)
* [ ] Create function that generates the link to the itinerary 
* [ ] Create setter that accurately grants the desired permissions to the shared users		
			
## Itinerary Story 8: Invite people to trip with email			
As a User		
I want to	add an event to my itinerary with email		
so that	i can collaborate on group trip		
* Priority	low		
* Effort	low		
* Assigned to			
### Acceptance Criteria	
* [ ] Given I click on travelers icon, 'add travelers' pop up is shown
* [ ] Input field takes emails of travelers 
* [ ] when email is entered, if user presses 'done' button 
* [ ] the owner of entered email recieves invite, trip sharer gets feedback that invatation was sent
* [ ] when recipient opens the email of invite, the email shows who invited them to the trip and has button saying view invite
* [ ] when recipient clicks 'view invite', they are taken to itinerary page with an accept invite popup
* [ ] pop up displays trip details and who invited them
* [ ] When 'accept invite' button at bottom of pop up is pressed, then user has full view & edit abilities of itinerary
### Technical Tasks	
* [ ] Create setter that accurately grants the desired permissions to the shared users
* [ ] Create function that sends each entered email account the link to the itinerary
* [ ] Create invite friends button that brings up the invite pop up
* [ ] Create variable for trip members that store what role they have (owner/editor/viewer)
* [ ] Create function that generates the link to the itinerary
			
## Itinerary Story 9: Quick Add Event			
As a User		
I want to	add an event that i already have confirmed		
so that	my confirmed event is formatted in the site for me		
* Priority	med		
* Effort	med		
* Assigned to **Roman**
### Acceptance Criteria	
* [ ] Given I selected add event
* [ ] Given I select 'quick add' button
* [ ] upload prompt pops up 
* [ ] user inputs screenshot, or pdf containing their confirmation
* [ ] details in the file is formatted in the original fields
* [ ] user confirms input by pressing 'add event'
* [ ] event is viewable in the itinerary
### Technical Tasks	
* [ ] Create function that grabs necessary information from upload and creates an event object using it
* [ ] Create upload button for events
* [ ] When saved, ensure new event is accurately displayed
			
## Itinerary Story 10: Input location of event			
As a User		
I want to	tag location onto the event		
so that	i can save the exact location of an event		
* Priority	low		
* Effort	low		
* Assigned to **Silvia**
### Acceptance Criteria
* [ ] Given I clicked on add event and the popup appears, I have the option to add a location to the event.
* [ ] Given that I clicked the add location button, a popup appears that allows me to enter text.
* [ ] Given that I entered my location, I can click the save button.
* [ ] Given that I clicked the save button, I return to the main event popup.
* [ ] Given that I am done editing the event, I can click the save button.
* [ ] Given that I clicked the save button, the event has a tagged location.
* [ ] Given that I exited the event popup without clicking the save button, the event does not have a tagged location.	
### Technical Tasks	
* [ ] Create variable for event objects to store a location
* [ ] Ensure the create event pop up has a field for location
* [ ] Ensure location is accurately displayed if saved
			
## Itinerary Story 15: View Traveler List			
As a traveler on a group itinerary		
I want to	view who is on the trip		
so that	know who the travelers on are on the trip		
* Priority	High		
* Effort	low		
* Assigned to **Matt**
### Acceptance Criteria	
* [ ] Given that I am on the itinerary page, I can click on the traveler count.
* [ ] Given I clicked the traveler count, a popup appears with the profile pictures & names of each traveler.
* [ ] I can click anywhere on the page and the popup disappears.	
### Technical Tasks	
* [ ] Create travelers icon and list pop up
* [ ] Create getter function for an itinerary object to get the number of trip members		
			
## Itinerary Story 16: Change Event Status			
As a editor on an itinerary		
I want to	change the status of an event without editing the event block		
so that	easily switch the status		
* Priority	High		
* Effort	low		
* Assigned to **Matt**
### Acceptance Criteria	
* [ ] Given that I am on the itinerary page, I can click on the event status.
* [ ] Given I clicked the event status, a dropdown menu will appear with all the possible options (booked, pending, idea).
* [ ] I can click on any of the options and the status will update/the downdown will disappear.		
### Technical Tasks	
* [ ] Create event status buttons on event pop up
* [ ] Create setter for the event's status

## Story 17: Mapping Event Description to Day		
As a editor on an itinerary	
I want to	see the description for each event on the day scheduled	
so that	easily see the details of an event without opening the event block	
* Priority	High	
* Effort	low	
* Assigned to **Roman**
### Acceptance Criteria	
* [ ] Given that I am on the itinerary page, added a day, and added an event to that day, I can see the description I added on the evnt block, on the list view.	
### Technical Tasks	
* [ ] Ensure the list view displays some of the event information under the name
* [ ] Create getters for event variables like description, location, and cost

## Register Story 1: Landing on Register Page
As a new user I want to create an account on this website with my email so that my identity is verified and i can access my itinerary
* Priority High
* Effort Medium
* Assigned to **Don**
### Acceptance Criteria
* [ ] Given that I clicked the register button on the landing page, I am redirected to the create an account/ register page.
* [ ] I can see the travelbee logo/ theme colors & a form to fill out my information.
### Technical Tasks
* [ ] Add a Register/Sign Up button on the landing page.
* [ ] Set up page routing so clicking Register/Sign Up takes the user to the Register/Sign Up pop-up page.
* [ ] Create the Register page layout.
* [ ] Add the TravelBee logo and theme colors to match the design.
* [ ] Add a form layout (email + password fields).

## Register Story 2: First time traveler creates account by typing in email
As a First time traveler I want to create an account on this website with my email so that my identity is verified and i can access my itinerary
* Priority High
* Effort Medium
* Assigned to **Don**
### Acceptance Criteria
* [ ] Given that I inputted a email and password that leads to verification page
* [ ] If account with the same email, then an error message "Account with this email already exist" is displayed
* [ ] The password field must be obscure
### Technical Tasks
* [ ] Create the Register page and connect it to the Register button
  * when users click on it on the landing page, they are taken to the account creation page
* [ ] Design the page to match Figma
  * TravelBee logo, theme colors, etc.
* [ ] Make a form for email and password, and for validation:
  * all fields are filled out
  * the email looks valid
  * the passwords match
* [ ] Connect the form to Supabase
  * a real account is created when the user submits their information
* [ ] Show helpful messages and redirect the user:
  * show an error message if something goes wrong
  * show a loading state when submitting
  * send the user to their profile dashboard after successful registration
* [ ] Make the password field hidden when users type.
* [ ] Connect the form to Supabase so a new account is created.
* [ ] Redirect users to verification page after successful signup.
* [ ] Detect if the email already exists.
* [ ] Show Error message: “Account with this email already exists”
* [ ] Show loading state while the form is submitting.
			
## Login Story 1: Landing on Login Page
As a registered user
I want to login so that my identity is verified and i can access my itinerary
* Priority High
* Effort Medium
* Assigned to **Don**
### Acceptance Criteria
* [ ] Given that I clicked the login button, I am redirected to the create an account/ register page.
* [ ] I can see the travelbee logo/ theme colors & a form to fill out my information.
### Technical Tasks
* [ ] Add a Login button on the landing page.
* [ ] Set up routing so clicking Login takes the user to the Login page.
* [ ] Create the Login page layout.
* [ ] Add the TravelBee logo and theme colors to match the design.
* [ ] Add a visual login form (email + password fields + submit button).
# Technologies used:
  * FrontEnd:
    * React
    * TypeScript
  * BackEnd:
    * Next.js
  * Database:
    * Supabase(Auth/DB)
