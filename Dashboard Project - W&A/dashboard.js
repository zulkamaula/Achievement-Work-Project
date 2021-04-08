var express = require("express");
var router = express.Router({ mergeParams: true });
var firebird = require("node-firebird");

// var dashboard = require("./views/dashboard/pages/riwayat.ejs");

var csop = {};
csop.host = process.env.CSOP_HOST;
csop.port = process.env.CSOP_PORT;
csop.database = process.env.CSOP_DATABASE;
csop.user = process.env.CSOP_USER;
csop.password = process.env.CSOP_PASS;
csop.lowercase_keys = false;
csop.role = null;
csop.pageSize = 4096;
var pool = firebird.pool(50, csop);

//! ROUTER-0 untuk Home (Default-FirstShow) 

router.get("/home", function (req, res) {
  console.log("User on Riwayatw page. ID: " + req.session.nik);
  if (!req.session.loggedin) {
    res.redirect("/login");
  } else {
    console.log("User on Home page. ID: " + req.session.nik);

    res.locals.nik = req.session.nik;
    res.locals.nama = req.session.nama;
    res.locals.kdivisi = req.session.kdivisi;
    res.locals.ndivisi = req.session.ndivisi;
    res.locals.kcabang = req.session.kcabang;
    res.locals.ncabang = req.session.ncabang;
    res.render("dashboard/layout/home", {
      title: "Home",
      page_name: "home",
    });
  }
});


//! ROUTER-1 untuk Dashboard

router.get("/", function (req, res) {
  console.log("User on Riwayatw page. ID: " + req.session.nik);
  var rs1;
  if (!req.session.loggedin) {
    res.redirect("/login");
  } else {
    pool.get(function (err, db) {
      if (err) {
        console.log("Error di walkthru.js!");
        throw err;
      } else {
        const kcabang = req.session.kcabang;
        const kdivisi = req.session.kdivisi;
        var start;
        var end;
        var today = new Date();
        var stringToday = `${
          today.getMonth() + 1
        }/${today.getDate()}/${today.getFullYear()}`;
        var field = "";
        var isPJS;
        var sql;

        var { store_id, start_date, end_date, period, month, year } = req.query;

        // store_id = "C01";
        // start_date = "2021-03-01";
        // end_date = "2021-03-10";
        // period = "year";
        // month = "03";
        // year = "2021";

        var usedPeriod = period;
        if (kcabang && kdivisi) {
          isPJS = kcabang.includes("C") && kdivisi.includes("OPR");
        }
        console.log("isPJS = ", isPJS);

        if (isPJS) {
          if (!store_id) {
            return res.render("dashboard/layout/404");
          }
        }

        if (!period && !start_date && !end_date && !month && !year) {
          usedPeriod = "week";
        }

        if (store_id) {
          if (isPJS && store_id !== kcabang) {
            return res.render("dashboard/layout/401");
          }
          field += `STORE_ID = '${store_id}'`;
        }
        if (usedPeriod === "week") {
          var curr = new Date(); // get current date
          var first = curr.getDate() - curr.getDay(); // First day is the day of the month - the day of the week
          var firstday = new Date(curr.setDate(first));
          var lastday = new Date(curr.setDate(first + 6));

          if (firstday.getMonth() !== today.getMonth()) {
            lastday = new Date(curr.setMonth(today.getMonth()));
          } else if (lastday.getMonth() !== today.getMonth()) {
            lastday = new Date(curr.setMonth(today.getMonth() + 1));
          }

          start = `${
            firstday.getMonth() + 1
          }/${firstday.getDate()}/${firstday.getFullYear()}`;
          end = `${
            lastday.getMonth() + 1
          }/${lastday.getDate()}/${lastday.getFullYear()}`;
        } else if (usedPeriod === "month") {
          start = `${today.getMonth() + 1}/1/${today.getFullYear()}`;
          end = `${today.getMonth() + 1}/31/${today.getFullYear()}`;
        } else if (usedPeriod === "year") {
          start = `1/1/${today.getFullYear()}`;
          end = `12/31/${today.getFullYear()}`;
        } else if (start_date && end_date) {
          const raw_start_date = start_date.split("-");
          const raw_end_date = end_date.split("-");
          const start_syear_raw = raw_start_date[0];
          const start_smonth_raw = raw_start_date[1];
          const start_sdate_raw = raw_start_date[2];

          const end_syear_raw = raw_end_date[0];
          const end_smonth_raw = raw_end_date[1];
          const end_sdate_raw = raw_end_date[2];

          var startSmonthRaw = start_smonth_raw;
          var startSdateRaw = start_sdate_raw;
          var endSmonthRaw = end_smonth_raw;
          var endSdateRaw = end_sdate_raw;
          if (startSmonthRaw[0] === "0") {
            startSmonthRaw = start_smonth_raw.replace(/0/g, "");
          }
          if (startSdateRaw[0] === "0") {
            startSdateRaw = start_sdate_raw.replace(/0/g, "");
          }
          if (endSmonthRaw[0] === "0") {
            endSmonthRaw = end_smonth_raw.replace(/0/g, "");
          }
          if (endSdateRaw[0] === "0") {
            endSdateRaw = end_sdate_raw.replace(/0/g, "");
          }
          start = `${startSmonthRaw}/${startSdateRaw}/${start_syear_raw}`;
          end = `${endSmonthRaw}/${endSdateRaw}/${end_syear_raw}`;
        } else if (month && year) {
          if (store_id) {
            field += ` and `;
          }
          field += `SMONTH = ${month} and SYEAR = ${year}`;
        }

        if (start && end) {
          if (store_id) {
            field += ` and `;
          }
          field += `SDATE_GROUP >= '${start} 00:00:01' and SDATE_GROUP <= '${end} 23:59:59'`;
        }

        // QUERY
        sql = `select * from T_WA_DASHBOARD where ${field}`;
        console.log("=== sql", sql);
        const list_store = `select distinct STORE_ID, STORE_NAME from T_WA_DASHBOARD`;

        db.query(list_store, function (err, rs) {
          if (err) {
            console.log("Error");
            throw err;
          } else {
            const new_rs2 = rs.map((item) => {
              const row = {};
              row.STORE_ID = ab2str(item.STORE_ID);
              row.STORE_NAME = ab2str(item.STORE_NAME);
              return row;
            });

            db.query(sql, function (err, rs) {
              if (err) {
                console.log("Error");
                throw err;
              } else {
                const new_rs = rs.map((item) => {
                  const row = {};
                  row.STORE_ID = ab2str(item.STORE_ID);
                  row.STORE_NAME = ab2str(item.STORE_NAME);
                  row.STORE_POINT = ab2str(item.STORE_POINT);
                  row.DATE = ab2str(item.SDATE);
                  row.MONTH = ab2str(item.SMONTH);
                  row.YEAR = ab2str(item.SYEAR);
                  row.HOT_ISSUE = ab2str(item.HOT_ISSUE);
                  row.OPENING = ab2str(item.OPENING);
                  row.PRE_RUSH_LUNCH = ab2str(item.PRE_RUSH_LUNCH);
                  row.PRE_RUSH_DINNER = ab2str(item.PRE_RUSH_DINNER);
                  row.CLOSING = ab2str(item.CLOSING);
                  row.SDATE_GROUP = ab2str(item.SDATE_GROUP);
                  return row;
                });
                // console.log(new_rs2);
                // console.log(new_rs);
                // console.log(store_id);
                // console.log(field);
                // console.log(usedPeriod);
                
                res.render("dashboard/layout/dashboard-index", {
                  results: new_rs,
                  cc2: new_rs2,
                  kstore: store_id,
                  time: field,
                  period: usedPeriod,
                  title: "Dashboard",
                  page_name: "dashboard",
                });
                // res.render("dashboard/layout/home");
              
              }
              db.detach();
            });
          }
        });
      }
    });
    pool.destroy();
  }
});

//! ROUTER-2 untuk Detail Points

router.get("/detail/:store_id/:date", function (req, res) {
  // console.log("User on Riwayatw page. ID: " + req.session.nik);
  var result1;
  var result2;
  pool.get(function (err, db) {
    if (err) {
      console.log("Error");
      throw err;
    } else {
      const { store_id, date } = req.params;
      const kcabang = req.session.kcabang;
      const kdivisi = req.session.kdivisi;
      var isPJS;

      if (kcabang && kdivisi) {
        isPJS = kcabang.includes("C") && kdivisi.includes("OPR");
      }

      if (isPJS) {
        if (!store_id) {
          return res.status(400).send("store_id wajib diisi!");
        }
      }

      if (store_id) {
        if (isPJS && store_id !== kcabang) {
          return res.status(401).send("Tidak dapat membuka cabang lain");
        }
      } else {
        return res.status(400).send("store_id wajib diisi");
      }

      const new_tgl = date.split("-");
      const syear = new_tgl[0];
      const smonthRaw = new_tgl[1];
      const sdateRaw = new_tgl[2];

      var smonth = smonthRaw;
      var sdate = sdateRaw;
      if (smonthRaw[0] === "0") {
        smonth = smonthRaw.replace(/0/g, "");
      }
      if (sdateRaw[0] === "0") {
        sdate = sdateRaw.replace(/0/g, "");
      }

      const dashboard = `select * from T_WA_DASHBOARD_DETAIL where STORE_ID = '${store_id}' and SMONTH = '${smonth}' AND SDATE = '${sdate}' AND SYEAR = '${syear}'`;

      db.query(dashboard, function (err, rs) {
        if (err) {
          console.log("Error");
          throw err;
        } else {
          result1 = rs.map((item) => {
            const row = {};
            row.STORE_ID = ab2str(item.STORE_ID);
            row.STORE_NAME = ab2str(item.STORE_NAME);
            row.GROUP_ID = ab2str(item.GROUP_ID);
            row.GROUP_POINT = ab2str(item.GROUP_POINT);
            row.DATE = ab2str(item.SDATE);
            row.MONTH = ab2str(item.SMONTH);
            row.YEAR = ab2str(item.SYEAR);
            row.FULLDATE = ab2str(item.SDATE_GROUP);
            row.GOOD = ab2str(item.GOOD);
            row.BAD = ab2str(item.BAD);
            row.WARNING = ab2str(item.NOT_AVAILABLE);
            row.TOTAL_CL = ab2str(item.TOTAL_CL);
            return row;
          });
          // res.send(result1);
          res.render("dashboard/layout/detail", {
            rs: result1,
            kstore: store_id,
            title: "Detail Points",
            page_name: "detail",
            // time: field,
            // period: usedPeriod,
          });
        }
        db.detach();
      });
    }
  });
  pool.destroy();
  // getDashboard(req, res)
});

function ab2str(buf) {
  if (Buffer.isBuffer(buf)) {
    return String.fromCharCode.apply(null, new Uint16Array(buf));
  } else {
    return buf;
  }
}

module.exports = router;
