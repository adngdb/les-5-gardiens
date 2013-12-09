define(['piwik'], function (piwik) {
    "use strict";
    var u = (("https:" === document.location.protocol) ? "https" : "http") + "://services.lqbs.fr/piwik/";
    _paq.push(["setTrackerUrl", u + "piwik.php"]);
    _paq.push(["setSiteId", "5"]);
    _paq.push(["trackPageView"]);
    _paq.push(["enableLinkTracking"]);
    return _paq;
});
