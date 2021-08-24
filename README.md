# online-test

Online student testing tools

This project use nodeJs as web server and angularJS for frontend webapp.

Database is mongoDB, update the `dbUrl` variable to your database connection in **index.js**

Run either `npm start` or `node index.js` to start server.

You will need to have a teacher account first to create student accounts. Teacher accounts can create/update/delete students.

To create questions, you need to update the json in `data/questions.json` in line 25, you need to define a unique string id for the question set id.
`name` is the displayed name of the question set id, this can be different from the unique string id.
`numOfQuestions` is the total number of questions each set has.
`isHidden` is a boolean value to determine whether we should display it in the page.
`questions` is an array of questions.
Each question will have `type` : 'singleChoice' | 'multipleChoice' | 'openQuestion' | 'multipleOpenQuestion',
`title`, `text`, `image`, `option`, `latex`. (For 'multipleOpenQuestion' you also need to define `multipleOpenQuestionSymbol`)
If the question set is collaborative, each question will also have `maxHintAllowedPerPerson`, `versionA`, `verionsB`, `checkAnswerSettings`, `hint`, and `hintText`.
`checkAnswerSettings` accepts the following inputs: `methodName`, `methodParams`, and `maxAttempts`.
(For 'multipleOpenQuestion' you need to define `checkAnswerSettings` by each key in `multipleOpenQuestionSymbol`)


Collaborative question set supports online partner searching which when matched in a pair students can chat via messager and select hints to interact with other.
