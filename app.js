//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
var _ = require("lodash");

const app = express();

app.set("view engine", "ejs");

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(express.static("public"));

let items = [];
const workItems = [];

mongoose.connect(
  "mongodb+srv://GauravSharma:test123@cluster0-ngy7i.mongodb.net/Todo",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

const ToDoList = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Arre Kaam toh bata "],
  },
});

const ListSchema = new mongoose.Schema({
  name: String,
  itemsList: [ToDoList],
});

const Item = mongoose.model("Item", ToDoList);
const List = mongoose.model("List", ListSchema);

async function dataBaseOperations() {
  await Item.find({}, function (err, docs) {
    items = docs;
  });
}

app.get("/", async function (req, res) {
  await dataBaseOperations();
  const day = await date.getDate();
  await res.render("list", {
    listTitle: day,
    newListItems: items,
  });
});

app.post("/", async function (req, res) {
  const newItem = req.body.newItem;
  const listName = req.body.list;
  const day = await date.getDate();
  const item = new Item({
    name: newItem,
  });
  if (day === listName) {
    await item.save();
    res.redirect("/");
  } else {
    List.findOne(
      {
        name: listName,
      },
      function (err, foundList) {
        if (err) {
          console.log("Error");
        } else {
          foundList.itemsList.push(item);
          foundList.save();
          res.redirect("/" + listName);
        }
      }
    );
  }
});

app.get("/:parameter", function (req, res) {
  const routeParameter = _.capitalize(req.params.parameter);
  List.findOne({ name: routeParameter }, async function (err, results) {
    if (err) {
      console.log("error");
    } else {
      if (results === null) {
        items = [];
        const list = new List({ name: routeParameter, itemsList: items });
        await list.save();
        await res.redirect("/" + routeParameter);
      } else {
        items = await results.itemsList;
        await res.render("list", {
          listTitle: routeParameter,
          newListItems: items,
        });
      }
    }
  });
});

app.post("/delete", async function (req, res) {
  const itemId = req.body.checkbox;
  listName = _.capitalize(req.body.listName);
  const day = await date.getDate();
  if (listName === day) {
    Item.deleteOne(
      {
        _id: itemId,
      },
      function (err) {
        if (err) {
          console("Error");
        } else {
          res.redirect("/");
        }
      }
    );
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { itemsList: { _id: itemId } } },
      function (err, foundList) {
        if (err) {
          console.log("Error");
        } else {
          res.redirect("/" + listName);
        }
      }
    );
  }
});

app.get("/about", function (req, res) {
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port, function () {
  console.log("Server started on port 3000");
});
