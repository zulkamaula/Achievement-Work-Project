var express = require('express');
var router = express.Router({
    mergeParams: true
});
var firebird = require('node-firebird');

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

router.get('/homed', function(req, res){ 
	if (!req.session.admin) {
		res.redirect("/controlcenter");
	}
	else {
		res.render('controlcenter/dashboard/homed', {
            title: "Home - Dashboard (Pesantare)"
        });
	}
});

//! DATA ORDER | DATA PESANAN

//* DATA ORDER : SHOW DEFAULT
router.get('/dapes/data-order', function (req, res) {

    if (!req.session.admin) {
        res.redirect("/controlcenter");
    } else {
        pool.get(function (err, db) {
            if (err) {
                console.log("Error di checkout.js!");
                throw err;
            } else {
                let sql2 = `
                select C.NAMA, C.TELP, C.EMAIL, C.PLAT, C.MEMBER_ID, H.PAYMENT_TOTAL, H.ORDER_TAX, H.RECID, H.D_CREATED,
                    lpad(extract(year from H.PICKUP_TIME), 4, 0) || '/' ||
                    lpad(extract(month from H.PICKUP_TIME), 2, 0) || '/' ||
                    lpad(extract(day from H.PICKUP_TIME), 2, 0) || ' ' ||
                    lpad(extract(hour from H.PICKUP_TIME), 2, 0) || ':' ||
                    lpad(extract(minute from H.PICKUP_TIME), 2, 0) 
                        as PICKUP_TIME, H.PICKUP_LOCATION, H.STATUS, ''
                        as PAYMENT_STATUS, H.IS_VOID, H.LINK, H.RATING, H.ULASAN, L.LOKASI_NAMA, K.kategori_name, 
                            S.status_deskripsi, S.STATUS_ALERT, H.delivery_address, H.isdelivery, K.KATEGORI_COLOR, 
                            D.WILAYAH, H.FOTO, H.JAM_DITERIMA, H.PENERIMA, H.DELIVERY_NOTE, DR.USER_NAME 
                        as DM, H.DELIVERY_NIK 
                        as DM_NIK, MK.IS_ONLINE 
                from T_CUSTOMER C
                    inner join T_ORDER_H H on C.RECID=H.ID_CUSTOMER 
                    inner join M_LOKASI L on L.LOKASI_ID = H.ID_LOKASI
                    inner join M_KATEGORI K on K.kategori_id=H.id_kategori
                    left join M_ORDER_STATUS S on S.status_id=H.status
                    left join M_DELIVERY D on D.WILAYAH_ID=H.WILAYAH
                    left join GET_DRIVERY_USER DR on DR.USER_LOGIN=H.DELIVERY_NIK
                    left join M_KODESTORE MK on MK.LOKASI_ID=H.ID_LOKASI and MK.brand IN('1','D', 'G')
                    and h.id_kategori IN (1,2,3,4,5)
                order by D_CREATED desc
                                `;
                db.query(sql2, function (err, rs) {
                    if (err) {
                        console.log("Error");
                        throw err;
                    } else {
                        console.log("rs.length ==> ", rs.length);
                        rs1 = rs.map(item => {
                            const row = {};
                            row.RECID = ab2str(item.RECID);
                            row.NAMA = ab2str(item.NAMA);
                            row.TELP = ab2str(item.TELP);
                            row.PLAT = ab2str(item.PLAT);
                            row.EMAIL = ab2str(item.EMAIL);
                            row.MEMBER_ID = ab2str(item.MEMBER_ID);
                            row.TOTAL = ab2str(item.PAYMENT_TOTAL);
                            row.ORDER_TAX = ab2str(item.ORDER_TAX);
                            row.D_CREATED = ab2str(item.D_CREATED);
                            row.ID_PRODUK = ab2str(item.ID_PRODUK);
                            row.PICKUP_TIME = ab2str(item.PICKUP_TIME);
                            row.PICKUP_LOCATION = ab2str(item.PICKUP_LOCATION);
                            row.LINK = ab2str(item.LINK);
                            row.LOKASI_NAMA = ab2str(item.LOKASI_NAMA);
                            row.ULASAN = ab2str(item.ULASAN);
                            row.RATING = ab2str(item.RATING);
                            row.STATUS = ab2str(item.STATUS);
                            row.PAYMENT_STATUS = ab2str(item.PAYMENT_STATUS);
                            row.IS_VOID = ab2str(item.IS_VOID);
                            row.KATEGORI_NAME = ab2str(item.KATEGORI_NAME);
                            row.STATUS_DESKRIPSI = ab2str(item.STATUS_DESKRIPSI);
                            row.STATUS_ALERT = ab2str(item.STATUS_ALERT);
                            row.DELIVERY_ADDRESS = ab2str(item.DELIVERY_ADDRESS);
                            row.DELIVERY_NOTE = ab2str(item.DELIVERY_NOTE);
                            row.ISDELIVERY = ab2str(item.ISDELIVERY);
                            row.KATEGORI_COLOR = ab2str(item.KATEGORI_COLOR);
                            row.WILAYAH = ab2str(item.WILAYAH);
                            row.FOTO = ab2str(item.FOTO);
                            row.JAM_DITERIMA = ab2str(item.JAM_DITERIMA);
                            row.PENERIMA = ab2str(item.PENERIMA);
                            row.DM_NIK = ab2str(item.DM_NIK);
                            row.DM = ab2str(item.DM);
                            row.IS_ONLINE = ab2str(item.IS_ONLINE);
                            return row;
                        });
                        console.log("rs.length ==> ", rs1.length);
                        res.render('controlcenter/dashboard/dapes/data-order', {
                            results: rs1,
                            title: "Data Order - Dashboard (Pesantare)"
                        });
                    }
                    db.detach();
                });
            }
        });
        pool.destroy();
    }
});

//! DATA CUSTOMER | DATA PELANGGAN

//* DATA CUSTOMER : SHOW DEFAULT
router.get('/dapel/data-customer', function (req, res) {

    if (!req.session.admin) {
        res.redirect("/controlcenter");
    } else {
        pool.get(function (err, db) {
            if (err) {
                console.log("Error di checkout.js!");
                throw err;
            } else {
                let sql3 = `select * from T_CUSTOMER`;
                db.query(sql3, function (err, rs) {
                    if (err) {
                        console.log("Error");
                        throw err;
                    } else {
                        console.log("rs.length ==> ", rs.length);
                        rs1 = rs.map(item => {
                            const row = {};
                            row.RECID = ab2str(item.RECID);
                            row.NAMA = ab2str(item.NAMA);
                            row.TELP = ab2str(item.TELP);
                            row.EMAIL = ab2str(item.EMAIL);
                            row.WHATSAPP= ab2str(item.WHATSAPP);
                            return row;
                        });
                        console.log("rs.length ==> ", rs1.length);
                        res.render('controlcenter/dashboard/dapel/data-customer', {
                            results: rs1,
                            title: "Data Customer - Dashboard (Pesantare)",
                        });
                    }
                    db.detach();
                });
            }
        });
        pool.destroy();
    }
});

//* DATA CUSTOMER : SHOW DETAIL
router.post('/dapel/detail-data-customer', function (req, res) {

    if (!req.session.admin) {
        res.redirect("/controlcenter");
    } else {
        pool.get(function (err, db) {
            if (err) {
                console.log("Error di checkout.js!");
                throw err;
            } else {
                let sql3 = `select * from T_CUSTOMER where RECID=`+firebird.escape(req.fields.headerid) + ``;
                db.query(sql3, function (err, rs) {
                    if (err) {
                        console.log("Error");
                        throw err;
                    } else {
                        console.log("tes masuk == " );
                        console.log("rs. ==> ", rs1);
                        console.log("rs.length ==> ", rs.length);
                        rs1 = rs.map(item => {
                            const row = {};
                            row.RECID = ab2str(item.RECID);
                            row.NAMA = ab2str(item.NAMA);
                            row.TELP = ab2str(item.TELP);
                            row.PLAT = ab2str(item.PLAT);
                            row.EMAIL = ab2str(item.EMAIL);
                            row.MEMBER_ID = ab2str(item.MEMBER_ID);
                            row.ALAMAT= ab2str(item.ALAMAT);
                            row.WHATSAPP= ab2str(item.WHATSAPP);
                            row.D_CREATED= ab2str(item.D_CREATED);
                            return row;
                        });
                        res.json(rs1);
                    }
                    db.detach();
                });
            }
        });
        pool.destroy();
    }
});

//! UPDATE-ROUTER

router.post('/dapel/update-data-customer', function (req, res) {

    if (!req.session.admin) {
        res.redirect("/controlcenter");
    } else {
        pool.get(function (err, db) {
            if (err) {
                console.log("Error di checkout.js!");
                throw err;
            } else {
                let sql3 = `select * from T_CUSTOMER where RECID=`+firebird.escape(req.fields.headerid) + ``;
                db.query(sql3, function (err, rs) {
                    if (err) {
                        console.log("Error");
                        throw err;
                    } else {
                        console.log("tes masuk update == " );
                        console.log("rs update ==> ", rs1);
                        console.log("rs.length ==> ", rs.length);
                        rs1 = rs.map(item => {
                            const row = {};
                            row.RECID = ab2str(item.RECID);
                            row.NAMA = ab2str(item.NAMA);
                            row.TELP = ab2str(item.TELP);
                            row.PLAT = ab2str(item.PLAT);
                            row.EMAIL = ab2str(item.EMAIL);
                            row.MEMBER_ID = ab2str(item.MEMBER_ID);
                            row.ALAMAT= ab2str(item.ALAMAT);
                            row.WHATSAPP= ab2str(item.WHATSAPP);
                            row.D_CREATED= ab2str(item.D_CREATED);
                            return row;
                        });
                        res.json(rs1);
                    }
                    db.detach();
                });
            }
        });
        pool.destroy();
    }
});


function ab2str(buf) {
    if (Buffer.isBuffer(buf)) {
        return String.fromCharCode.apply(null, new Uint16Array(buf));
    } else {
        return buf;
    }

}

module.exports = router;