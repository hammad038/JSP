var express = require('express');
var passport = require('passport');
var router = express.Router();
var request = require('request');
var cheerio = require('cheerio');

/* GET home page. */
router.get('/', function(req, res, next) {
  if(req.session.passport) {
      res.render('profile.ejs', { user: req.user, data: null});
  } else {
      res.render('index', { title: 'Express' });
  }
});

router.get('/login', function(req, res, next) {
    if(req.session.passport) {
        console.log('profile when u r logged in')
    } else {
        res.render('login.ejs', { message: req.flash('loginMessage') });
    }
});

router.get('/signup', function(req, res) {
    if(req.session.passport) {
        res.render('profile.ejs', { user: req.user, data: null });
        console.log('profile when u r logged in')
    } else {
        res.render('signup.ejs', { message: req.flash('signupMessage') });
    }
});

router.get('/profile', isLoggedIn, function(req, res) {
    res.render('profile.ejs', { user: req.user, data: null });
});

router.get('/logout', function(req, res) {
    req.session.destroy();
    // req.logout();
    res.redirect('/');
});

router.post('/signup', passport.authenticate('local-signup', {
    successRedirect: '/profile',
    failureRedirect: '/signup',
    failureFlash: true,
}));

router.post('/login', passport.authenticate('local-login', {
    successRedirect: '/profile',
    failureRedirect: '/login',
    failureFlash: true,
}));

router.post('/search', function(req, res) {
    if (req.session.passport) {
        var inputSearch = {
            query: req.body.search,
            location: req.body.city,
        }
        var requestDataObj = {
            url: [],
            date: [],
            position: [],
            company: [],
            location: [],
            tag: [],
        }
        scrapData(inputSearch, requestDataObj, function () {
            res.render('profile.ejs', { user: req.user, data: requestDataObj });
        });
    }
});

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();
    res.redirect('/');
}

function scrapData(inputSearch, requestDataObj, callback) {
    console.log('here is the code for scrapping!')

    var urlObject = {
        stepStone: "http://www.it-jobs.stepstone.de/?what="+inputSearch.query+"&where="+inputSearch.location+"&resultsPerPage=25",
        meinpraktikum: "http://www.meinpraktikum.de/praktikum/suchen?location="+inputSearch.location+"&q="+inputSearch.query,
        indeed: "http://de.indeed.com/Jobs?q="+inputSearch.query+"&l="+inputSearch.location,
        praktikumInfo: "https://www.praktikum.info/stellenangebote?&query%5Btext%5D="+inputSearch.query+"&query%5Bcity%5D="+inputSearch.location+"%2C+Germany&button=&query%5Bmandatory_internship%5D=0",
        roberthalf: "https://www.roberthalf.de/jobs/"+inputSearch.query+"/"+inputSearch.location
    }
    var finish = 0;
    var failureArr = [];

    request(urlObject.stepStone,function(req,res,body) {
        if (!req) {

            var count = 0;
            var $ = cheerio.load(body);

            $('a.resultItem-link', '#resultList').each(function () {
                var a = $(this);
                var url = a.attr('href');
                requestDataObj.url.push(url);
                count++;
            });

            $('.date').each(function () {
                var b = $(this);
                var date = b.text();
                requestDataObj.date.push(date);
            });

            $('.job').each(function(){
                var c = $(this);
                var desc = c.text();
                requestDataObj.position.push(desc);
            });

            $('.company').each(function(){
                var d = $(this);
                var company = d.text();
                requestDataObj.company.push(company);
            });

            $('.location','#resultList').each(function(){
                var e = $(this);
                var location = e.text();
                requestDataObj.location.push(location);
            });

            for(var i=0;i<count;i++)
            {
                requestDataObj.tag.push('StepStone');
            }
            console.log('COUNT StepStone: ',count)
            done(true);

        } else {
            console.log(">> StepStone Global Search Jobs Request not sent !!!")
            done(false);
        }
    });

    request(urlObject.meinpraktikum,function(req,res,body) {
        if (!req) {

            var count = 0;
            var $ = cheerio.load(body);

            {
                $('a.search-result-vacancy').each(function () {
                    var a = $(this);
                    var url = a.attr('href');
                    requestDataObj.url.push('http://www.meinpraktikum.de'+url);
                    count++;
                });

            }

            {

                $('a.search-result-vacancy').each(function () {
                    var b = $(this);
                    var str = b.attr('href');
                    var company = str.substring(str.lastIndexOf("praktikum/")+10,str.lastIndexOf("/jobs"));
                    requestDataObj.company.push(company);
                });
            }

            {

                $('a.search-result-vacancy').each(function () {
                    var c = $(this);
                    var str = c.attr('href');
                    var src = str.search("jobs/");
                    var len = str.length;
                    var desc = str.substring(src+5,len);
                    requestDataObj.position.push(desc);
                });
            }

            {

                $('span','.title').each(function () {
                    var d = $(this);
                    var location = d.text();
                    requestDataObj.location.push(location);
                });
            }

            {
                var e = new Date();
                for (var i = 0; i < count; i++) {
                    requestDataObj.date.push("x");
                }
            }

            for(var i=0;i<count;i++)
            {
                requestDataObj.tag.push('meinPraktikum');
            }
            console.log('COUNT meinPraktikum: ',count)
            done(true);

        } else {
            console.log(">> meinpraktikum Global Search Jobs Request not sent !!!")
            done(false);
        }
    });

    request(urlObject.indeed,function(req,res,body) {
        if (!req) {

            var count = 0;
            var $ = cheerio.load(body);

            {
                $('a', '.jobtitle').each(function () {
                    var a = $(this);
                    var url = a.attr('href');
                    requestDataObj.url.push('http://de.indeed.com'+url);
                    count++;
                });
            }

            {
                for (var i = 0; i < count; i++) {
                    requestDataObj.company.push("X");
                }
            }

            {
                $('a', '.jobtitle').each(function(){
                    var d = $(this);
                    var desc = d.text();
                    requestDataObj.position.push(desc);
                });
            }

            {
                for (var i = 0; i < count; i++) {
                    requestDataObj.location.push(inputSearch.location);
                }
            }

            {
                var e = new Date();
                for (var i = 0; i < count; i++) {
                    requestDataObj.date.push("X");
                }
            }

            for(var i=0;i<count;i++)
            {
                requestDataObj.tag.push('indeed');
            }

            console.log('COUNT indeed: ',count)
            done(true);

        } else {
            console.log(">> Indeed.de Global Search Jobs Request not sent !!!")
            done(false);
        }
    });

    request(urlObject.praktikumInfo,function(req,res,body) {
        if (!req) {

            var count = 0;
            var $ = cheerio.load(body);

            {
                $('.job-offer-teaser__title').each(function () {
                    var a = $(this);
                    var url = a.text();
                    requestDataObj.url.push(urlObject.praktikumInfo);
                    count++;
                });
            }

            {
                $('.job-offer-teaser__company').each(function(){
                    var b = $(this);
                    var company = b.text();
                    requestDataObj.company.push(company);
                });
            }

            {
                $('.job-offer-teaser__title').each(function(){
                    var c = $(this);
                    var desc = c.text();
                    requestDataObj.position.push(desc);
                });
            }

            {
                $('.job-offer-teaser__address-item').each(function(){
                    var d = $(this);
                    var location = d.text();
                    requestDataObj.location.push(location);
                });
            }

            {
                $('.job-offer-teaser__date').each(function(){
                    var e = $(this);
                    var date = e.text();
                    requestDataObj.date.push(date);
                });
            }

            for(var i=0;i<count;i++)
            {
                requestDataObj.tag.push('praktikumInfo');
            }

            console.log('COUNT PraktikumInfo: ',count)
            done(true);

        } else {
            console.log(">> Praktikum.Info Global Search Jobs Request not sent !!!")
            done(false);
        }

    });

    request(urlObject.roberthalf,function(req,res,body) {
        if (!req) {
            var count = 0;
            var $ = cheerio.load(body);

            {
                $('a', '.JobTitle').each(function () {
                    var a = $(this);
                    var url = a.attr('href');
                    requestDataObj.url.push("https://www.roberthalf.de"+url);
                    count++;
                });
            }

            {
                $('a', '.JobTitle').each(function(){
                    var d = $(this);
                    var desc = d.text();
                    requestDataObj.position.push(desc);
                });
            }

            {
                $('.midRight').each(function(){
                    var b = $(this);
                    var location = b.text();
                    requestDataObj.location.push(location);
                });
            }

            {
                $('.topRight').each(function(){
                    var e = $(this);
                    var date = e.text();
                    requestDataObj.date.push(date);
                });
            }

            for(var i=0;i<count;i++)
            {
                requestDataObj.company.push('Personalvermittlung');
            }

            for(var i=0;i<count;i++)
            {
                requestDataObj.tag.push('Robert Half');
            }

            console.log('COUNT roberthalf: ',count)
            done(true);

        } else {
            console.log(">> roberthalf Global Search Jobs Request not sent !!!")
            done(false);
        }
    });

    function done(serverResponse) {
        finish++;
        failureArr.push(serverResponse)
        // var ok = 1;
        if(finish == Object.keys(urlObject).length) {
            // Checking for console only that all servers gave response or not
            /*
            for (var i in failureArr) {
                if (failureArr[i] == false) {
                    ok = 0;
                }
            }
            (ok) ? console.log('response from all server completed !!!') : console.log('Response Incomplete !!!');
            */

            console.log('Failure Array: ',failureArr)
            callback();
        }
    }

}

module.exports = router;
