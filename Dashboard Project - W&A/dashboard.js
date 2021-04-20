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
  }});


//! ROUTER-1 (BARU) untuk Dashboard Default
// todo: Buat 2 Table & Grafik dari data - Walkthru & Audit

router.get('/', function(req, res) {
  
  console.log("User on Dashboard Page with ID : " + req.session.nik);
  
  if(!req.session.loggedin){
		res.redirect('/login');
	}
	else {
    pool.get(function (err, db) {
      const kcabang = req.session.kcabang;
      const kdivisi = req.session.kdivisi;
      var start;
      var end;
      var today = new Date();
      var field = '';
      var isPJS;
      var sql;

      // var stringToday = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;

      const { store_id, start_date, end_date, period, month, year } = req.query;

      var usedPeriod = period;
      if (kcabang && kdivisi) {
        isPJS = kcabang.includes('C') && kdivisi.includes('OPR');
      }
      console.log("isPJS = ", isPJS);

      if (isPJS) {
        if (!store_id) {
          return res.render("dashboard/layout/404");
          // return res.status(400).send('store_id wajib di isi!');
        }
      }

      if (!period && !start_date && !end_date && !month && !year) {
        usedPeriod = 'week';
      }

      if (store_id) {
        if (isPJS && store_id !== kcabang) {
          return res.render("dashboard/layout/401");
          // return res.status(401).send('Tidak dapat membuka cabang lain');
        }
        field += `STORE_ID = '${store_id}'`;
      }
      if (usedPeriod === 'week') {
        var curr = new Date(); //? get current date
        var first = curr.getDate() - curr.getDay(); //? First day is the day of the month - the day of the week
        var firstday = new Date(curr.setDate(first));
        var lastday = new Date(curr.setDate(first + 6));

        if (firstday.getMonth() !== today.getMonth()) {
          lastday = new Date(curr.setMonth(today.getMonth()))
        } else if (lastday.getMonth() !== today.getMonth()) {
          lastday = new Date(curr.setMonth(today.getMonth() + 1))
        }

        start = `${firstday.getMonth() + 1}/${firstday.getDate()}/${firstday.getFullYear()}`;
        end = `${lastday.getMonth() + 1}/${lastday.getDate()}/${lastday.getFullYear()}`;
      } else if (usedPeriod === 'month') {
        start = `${today.getMonth() + 1}/1/${today.getFullYear()}`;
        end = `${today.getMonth() + 1}/31/${today.getFullYear()}`;
      } else if (usedPeriod === 'year') {
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
        if (startSmonthRaw[0] === '0') {
          startSmonthRaw = start_smonth_raw.replace(/0/g, '');
        }
        if (startSdateRaw[0] === '0') {
          startSdateRaw = start_sdate_raw.replace(/0/g, '');
        }
        if (endSmonthRaw[0] === '0') {
          endSmonthRaw = end_smonth_raw.replace(/0/g, '');
        }
        if (endSdateRaw[0] === '0') {
          endSdateRaw = end_sdate_raw.replace(/0/g, '');
        }
        start = `${startSmonthRaw}/${startSdateRaw}/${start_syear_raw}`;
        end = `${endSmonthRaw}/${endSdateRaw}/${end_syear_raw}`;
      } else if (month && year) {
        if (store_id) {
          field += ` and `
        }
        field += `SMONTH = ${month} and SYEAR = ${year}`
      }

      if (start && end) {
        if (store_id) {
          field += ` and `
        }
        field += `SDATE_GROUP >= '${start} 00:00:01' and SDATE_GROUP <= '${end} 23:59:59'`;
      } 
    
      sql = `select * from T_WA_DASHBOARD where ${field}`;
      console.log('=== sql', sql);

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

        db.query(sql, function(err, rs) {
          if (err) {
            console.log('Error');
            throw err;
          } else {
            const result = rs.map(item => {
              const row = {};
              row.STORE_ID = ab2str(item.STORE_ID);
              row.STORE_NAME = ab2str(item.STORE_NAME);
              row.STORE_POINT = ab2str(item.STORE_POINT);
              row.MAX_POINT = ab2str(item.MAX_POINT);
              row.TOTAL_GROUP_POINT = ab2str(item.TOTAL_GROUP_POINT);
              row.DATE = ab2str(item.SDATE);
              row.MONTH = ab2str(item.SMONTH);
              row.YEAR = ab2str(item.SYEAR);
              row.HOT_ISSUE = ab2str(item.HOT_ISSUE);
              row.OPENING = ab2str(item.OPENING);
              row.PRE_RUSH_LUNCH = ab2str(item.PRE_RUSH_LUNCH);
              row.PRE_RUSH_DINNER = ab2str(item.PRE_RUSH_DINNER);
              row.CLOSING = ab2str(item.CLOSING);
              row.AUDIT = ab2str(item.AUDIT);
              row.SDATE_GROUP = ab2str(item.SDATE_GROUP);
              return row;
            });
            
            // const label = new_rs2.map(item => item.STORE_NAME);
            const label = [...new Set(result.map(item => item.STORE_NAME))];

            let tanggal = [];
            result.forEach(item => {
              const date = `${item.YEAR}-${item.MONTH}-${item.DATE}`;
              const indexTanggal = tanggal.findIndex(item => item.usedDate === date);
              if (indexTanggal < 0) {
                tanggal.push({ usedDate: date, year: item.YEAR, month: item.MONTH, date: item.DATE });
              }
            });
            let graph = [];
            const storeNameResult = []
            tanggal.map((tgl, index) => {
              graph.push([tgl.usedDate]);
              label.map(store => {
                const walkthruStore = storeNameResult.find(item => item === `${store}`);
                if (!walkthruStore) {
                  storeNameResult.push(store)
                }
                const dataWalkthru = result.find(item => {
                  return item.DATE === tgl.date && item.MONTH === tgl.month && item.STORE_NAME === store && item.AUDIT === null
                });
         
                if (dataWalkthru) {
                  graph[index].push(dataWalkthru.STORE_POINT);
                } else {
                  graph[index].push(0);
                }

                const dataAudit = result.find(item => {
                  return item.DATE === tgl.date && item.MONTH === tgl.month && item.STORE_NAME === store && item.AUDIT !== null
                });
                if (dataAudit) {
                  const usedStore = storeNameResult.find(item => item === `${store} - Audit`); 
                  if (!usedStore) {
                    storeNameResult.push(`${store} - Audit`);
                  }
                  graph[index].push(dataAudit.STORE_POINT)
                } else if (!dataAudit) {
                  const usedStore = storeNameResult.find(item => item === `${store} - Audit`); 
                  if (!usedStore) {
                    storeNameResult.push(`${store} - Audit`);
                  }
                  graph[index].push(0)
                }
              });
            });
            console.log('=== label', storeNameResult);
            console.log('=== graph', graph);

            const walkthru = result.filter(item => item.AUDIT == null || item.AUDIT == undefined);
            const audit = result.filter(item => item.AUDIT != null || item.AUDIT != undefined);

            return res.render("dashboard/layout/dashboard-index", {
              results: {walkthru, audit},
              cc2: new_rs2,
              kstore: store_id,
              time: field,
              period: usedPeriod,
              title: "Dashboard",
              page_name: "dashboard",
              storeNameResult: JSON.stringify(storeNameResult),
              graph: JSON.stringify(graph),
              tanggalUpdate : JSON.stringify(tanggal)
            });
          }
        });
      }
    });
    });
  }
});

//! ROUTER-2 (BARU) untuk Detail Point - pada data Walkthru & Audit
router.get('/detail/:store_id/:date', function(req, res){
  var result;
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
        isPJS = kcabang.includes('C') && kdivisi.includes('OPR');
      }

      if (isPJS) {
        if (!store_id) {
          return res.status(400).send('store_id wajib diisi!');
        }
      }

      if (store_id) {
        if (isPJS && store_id !== kcabang) {
          return res.status(401).send('Tidak dapat membuka cabang lain');
        }
      } else {
        return res.status(400).send('store_id wajib diisi')
      }

      const new_tgl = date.split("-");
      const syear = new_tgl[0];
      const smonthRaw = new_tgl[1];
      const sdateRaw = new_tgl[2];

      var smonth = smonthRaw;
      var sdate = sdateRaw;
      if (smonthRaw[0] === '0') {
        smonth = smonthRaw.replace(/0/g, '');
      }
      if (sdateRaw[0] === '0') {
        sdate = sdateRaw.replace(/0/g, '');
      }

      // const dashboard = `select * from T_WA_DASHBOARD_DETAIL where STORE_ID = '${store_id}' and SMONTH = '${smonth}' AND SDATE = '${sdate}' AND SYEAR = '${syear}'`;
      const dashboard = `select * from GET_DASHBOARD_DETAIL('`+ store_id + `','`+ syear + `','`+ smonth + `','`+ sdate + `')`;

      db.query(dashboard, function(err, rs) {
        if (err) {
        console.log("Error");
        throw err;
        } else {
          result = rs.map(item => {
              const row = {};
              row.STORE_ID = ab2str(item.STORE_ID);
              row.STORE_NAME = ab2str(item.STORE_NAME);
              row.GROUP_ID = ab2str(item.GROUP_ID);
              row.DESCRIPTION = ab2str(item.DESCRIPTION);
              row.GROUP_POINT = ab2str(item.GROUP_POINT);
              row.POINT = ab2str(item.POINT);
              row.DATE = ab2str(item.SDATE);
              row.MONTH = ab2str(item.SMONTH);
              row.YEAR = ab2str(item.SYEAR);
              row.FULLDATE = ab2str(item.SDATE_GROUP);
              row.GOOD = ab2str(item.GOOD);
              row.BAD = ab2str(item.BAD);
              row.WARNING = ab2str(item.NOT_AVAILABLE);
              row.TOTAL_CL = ab2str(item.TOTAL_CL);
              row.AUDIT_ID = ab2str(item.AUDIT_ID)
              return row;
          });
          const walkthru = result.filter(item => item.AUDIT_ID === "undefined");
          const audit = result.filter(item => item.AUDIT_ID !== "undefined");
          db.detach(); 
          console.log('DETAIL : audit ===###> ', audit);
          console.log('DETAIL : walkthru ===###> ', walkthru);
          // return res.status(200).send({result: { walkthru, audit }});
          return res.render("dashboard/layout/detail", {
                        rs: {walkthru, audit},
                        kstore: store_id,
                        title: "Detail Points",
                        page_name: "detail",
          });
        }
      });
    }
  });
  pool.destroy();
});

function ab2str(buf) {
  if (Buffer.isBuffer(buf)) {
    return String.fromCharCode.apply(null, new Uint16Array(buf));
  } else {
    return buf;
  }
}

module.exports = router;
