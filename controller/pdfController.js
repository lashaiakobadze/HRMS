const fs = require("fs");
var moment = require("moment");
const pdf = require("pdf-creator-node");
const path = require("path");
const options = require("../../hrms/helpers/options");
const data = require("../../hrms/helpers/data");
const User = require("../models/user");
const Leave = require("../models/leave");
const Attendance = require("../models/attendance");
var UserSalary = require("../models/user_salary");

// <!-- PART OF: 6) Download PDF (table) monthly to view attendance / leave for all employees -->
const generatePdf = async (req, res, next) => {
  let foundTotalDays = 0;
  let foundTotalLeaves = 0;
  let userMonthlySalary = 0;

  let user = await User.findById(
    req.session.user._id,
    function getUser(err, user) {
      if (err) {
        console.log(err);
      }
    }
  );

  let attendanceChunks = await Attendance.find({
    employeeID: user._id
    // month: req.body.month,
    // year: req.body.year
  });

  let userSalary = await UserSalary.find({ employeeID: user._id });

  let leaveChunks = await Leave.find({ applicantID: user._id });

  if (attendanceChunks.length) {
    foundTotalDays = attendanceChunks.length;
  }

  if (leaveChunks.length) {
    foundTotalLeaves = leaveChunks.length;
  }

  //<!-- PART OF: 5) to caluculate Salary based on Total working Days -->
  if (userSalary) {
    userMonthlySalary = userSalary[0].salary * foundTotalDays;
  }

  const html = fs.readFileSync(path.join("views/pdf/template1.html"), "utf-8");
  const filename = Math.random() + "_doc" + ".pdf";

  const monthlyEmployee = {
    userMonthlySalary,
    foundTotalDays,
    foundTotalLeaves,
    title: "Monthly profile",
    month: new Date().getMonth() + 1,
    attendance: attendanceChunks,
    leave: leaveChunks,
    moment: moment,
    userName: req.session.user.name
  };

  const obj = {
    monthlyEmployee
  };
  const document = {
    html: html,
    data: {
      monthlyEmployeeInfo: obj
    },
    path: "./docs/" + filename
  };
  pdf
    .create(document, options)
    .then((res) => {
      console.log(res);
    })
    .catch((error) => {
      console.log(error);
    });
  const filepath = "http://localhost:3000/docs/" + filename;

  res.render("pdf/download", {
    path: filepath,
    title: "Monthly pdf info",
    csrfToken: req.csrfToken(),
    userName: req.session.user.name
  });
};

module.exports = {
  generatePdf
};
