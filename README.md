# multivocal-backend


### Description
This is the backend & rest API for the multivocal project.
It is based on node with express with mongodb.

### Requirements

There are a few requirements for a system to run the API.

* MongoDB - v3 or newer (https://www.mongodb.com/)
* node.js - v4 or newer (https://nodejs.org/en/)
* yarn:
    * Not required, but recommended. Install by following the instructions on
    https://yarnpkg.com/en/docs/install#linux-tab after installing node.js
* nodemon :
    * Daemon used to run node - requires node to be install. Install by
    running ```npm install -g nodemon```.


### Configuration
The server is configured by default to run on either port 80 or 3000.
Port 80 should be used in production, while 3000 should be used in development.

To set the port, use the NODE_ENV environment variable, set to either
development or production

## Usage
Before running the application for the first time, run ```yarn``` in the project
root.  This will install all required dependencies.

The application is configured to run with nodemon as a daemon - so it will
automatically restart on errors, and reload on changes.

To start the server, simply run ```npm start``` from a terminal in the root
of the project.

### API Documentation

These Are the API endpoints that are a part of the backend so far.

#### POST /api/recording
Used for uploading new files and supplying data about the recording.
It takes the following form data:

- file: The actual file of a recording
- transcription_id: The id of the transcription the recording is for.
- client_id (optional): The id of the client uploading the recording
- notes (optional): Notes about the specific recording

At this point in time, no authentication is implemented for the endpoint,
but will be at a later time.

It will return a status code of 422 if missing data, and 200 on succesful upload.

#### PUT /api/recording/:file_name/edit
Replaces the current file with an edited version.

It takes a file, just like in the endpoint for uploading, as form data

#### DELETE /api/recording/:file_name
Deletes the recording with the specified name from the system

#### GET /api/recordings/:transcription_id
Gets all recordings for the specified transcription_id.

The transcription_id in the url is the id to get recordings for.

#### PUT /api/recording/:file_name/rate/:rating
Adds a rating for the specified file_name

As of now, there are no spec for the ratings, that will have to decided.
