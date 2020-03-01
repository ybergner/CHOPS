# online-test

Online student testing tools

This project use nodeJs as web server and angularJS for frontend webapp.

Database is mongoDB, update the `dbUrl` variable to your database connection in **index.js**

Run either `npm start` or `node index.js` to start server.

You will need to have a teacher account first to create student accounts. Teacher accounts can create/update/delete students.

To create questions, you need to update the js object in `webapp/js/app.js` in line 25, you need to define a unique string id for the question set id, this string id will be mapped into `webapp/template/questions` to display the template question files.
`name` is the displayed name of the question set id, this can be different from the unique string id.
`numOfQuestions` is the total number of questions each set has.
`isHidden` is a boolean value to determine whether we should display it in the page.
`isCollaborative` is a bollean value to determine the type of the question set, if it is true, question template file will be mapped into `webapp/template/questions/collaborative/{questionSetId}`, it is false they will be mapped into `webapp/template/questions/individual/{questionSetId}` instead.
`answers` is initialized as an empty array for data purpose.

Collaborative question set supports online partner searching which when matched in a pair students can chat via messager and select hints to interact with other.

