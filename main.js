var http = require("http");
var fs = require("fs");
var url = require("url");
var qs = require("querystring");
var template = require("./lib/template.js");
var path = require("path");
var sanitizeHtml = require("sanitize-html");
var mysql = require("mysql");

var connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "ehdgur154!",
  database: "opentutorials",
});

connection.connect();

var app = http.createServer(function (request, response) {
  var _url = request.url;
  var queryData = url.parse(_url, true).query;
  var pathname = url.parse(_url, true).pathname;
  if (pathname === "/") {
    if (queryData.id === undefined) {
      connection.query("SELECT * FROM topic", function (error, row, fields) {
        if (!error) {
          console.log(row);
          var title = "Welcom",
            description = "Hello , Node.js",
            list = template.list(row),
            html = template.HTML(
              title,
              list,
              `<h2>${title}</h2>${description}
            `,
              `<a href="/create">create</a>`
            );
          response.writeHead(200);
          response.end(html);
        }
        console.log(error);
        response.writeHead(404);
        response.end("Sever Error...");
      });
    } else {
      connection.query("SELECT * FROM topic", function (error, row, fields) {
        if (!error) {
          connection.query(
            `SELECT * FROM topic WHERE id=?`,
            [queryData.id],
            function (error2, topic) {
              if (!error) {
                console.log(topic[0].title);
                var title = topic[0].title,
                  description = topic[0].description,
                  list = template.list(row),
                  html = template.HTML(
                    title,
                    list,
                    `<h2>${title}</h2>${description}
                  `,
                    ` <a href="/create">create</a>
              <a href="/update?id=${queryData.id}">update</a>
                <form action="delete_process" method="post">
                  <input type="hidden" name="id" value="${queryData.id}">
                <input type="submit" value="delete">
               </form>`
                  );
                response.writeHead(200);
                response.end(html);
              } else {
                console.log(error);
                response.writeHead(404);
                response.end("Sever Error...");
              }
            }
          );
        } else {
          console.log(error);
          response.writeHead(404);
          response.end("Sever Error...");
        }
      });
    }
  } else if (pathname === "/create") {
    connection.query("SELECT * FROM topic", function (error, row, fields) {
      if (!error) {
        console.log(row);
        var title = "Create",
          list = template.list(row),
          html = template.HTML(
            title,
            list,
            `  <form action="/create_process" method="post">
            <p><input type="text" name="title" placeholder="title"></p>
            <p>
              <textarea name="description" placeholder="description"></textarea>
            </p>
            <p>
              <input type="submit">
            </p>
          </form>
          `,
            `<a href="/create">create</a>`
          );
        response.writeHead(200);
        response.end(html);
      }
      console.log(error);
      response.writeHead(404);
      response.end("Sever Error...");
    });
  } else if (pathname === "/create_process") {
    var body = "";
    request.on("data", function (data) {
      body = body + data;
    });
    request.on("end", function () {
      var post = qs.parse(body);
      connection.query(
        "INSERT INTO topic (title, description, created, author_id) VALUES(?, ?, NOW(), ?)",
        [post.title, post.description, 1],
        function (err, row, fields) {
          if (!err) {
            response.writeHead(302, { Location: `/?id=${row.insertId}` });
            response.end();
          } else {
            throw err;
          }
        }
      );
    });
  } else if (pathname === "/update") {
    fs.readdir("./data", function (error, filelist) {
      var filteredId = path.parse(queryData.id).base;
      fs.readFile(`data/${filteredId}`, "utf8", function (err, description) {
        var title = queryData.id;
        var list = template.list(filelist);
        var html = template.HTML(
          title,
          list,
          `
            <form action="/update_process" method="post">
              <input type="hidden" name="id" value="${title}">
              <p><input type="text" name="title" placeholder="title" value="${title}"></p>
              <p>
                <textarea name="description" placeholder="description">${description}</textarea>
              </p>
              <p>
                <input type="submit">
              </p>
            </form>
            `,
          `<a href="/create">create</a> <a href="/update?id=${title}">update</a>`
        );
        response.writeHead(200);
        response.end(html);
      });
    });
  } else if (pathname === "/update_process") {
    var body = "";
    request.on("data", function (data) {
      body = body + data;
    });
    request.on("end", function () {
      var post = qs.parse(body);
      var id = post.id;
      var title = post.title;
      var description = post.description;
      fs.rename(`data/${id}`, `data/${title}`, function (error) {
        fs.writeFile(`data/${title}`, description, "utf8", function (err) {
          response.writeHead(302, { Location: `/?id=${title}` });
          response.end();
        });
      });
    });
  } else if (pathname === "/delete_process") {
    var body = "";
    request.on("data", function (data) {
      body = body + data;
    });
    request.on("end", function () {
      var post = qs.parse(body);
      var id = post.id;
      var filteredId = path.parse(id).base;
      fs.unlink(`data/${filteredId}`, function (error) {
        response.writeHead(302, { Location: `/` });
        response.end();
      });
    });
  } else {
    response.writeHead(404);
    response.end("Not found");
  }
});
app.listen(3000);
