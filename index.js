/**
 * A collection of open-source, non-sensitive, reusable utilities powering Meeting Room 365 <meetingroom365.com>
 */

// Generate a "Unique" "GUID"
function s4 () {
    return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
}

// Integer to two places (useful for time formatting)
function tp (n) {
    return n > 9 ? "" + n : "0" + n;
}

// Returns a lowercase string (safely)
function lowercase (str) {
    if (!str || typeof str !== 'string') return '';
    return str.toLowerCase();
}

// Sane method to return a Microsoft-friendly ISO String variant from a normal ISO string
function dateToMsISOString (D) {
    // Backup: // `${D.getUTCFullYear()}-${tp(D.getUTCMonth()+1)}-${tp(D.getUTCDate())}t${tp(D.getUTCHours())}:${tp(D.getUTCMinutes())}:00z`
    return D.toISOString().replace('T', 't').split('.')[0] + 'z'
}

// Adjust a date object
function adjustedTimeFromNow (minutes) {
    return (+ new Date((new Date()).getTime() + (minutes * 60000)));
}

// Determine if the app is being run locally
function isLocal (request) {
    if (!request) return false;
    return request.headers.host.includes('localhost');
}

// Determine if the app is in a staging environment
function isStaging (request) {
    if (!request) return false;
    return request.headers.host.includes('staging');
}

// Express.js Middleware: determine if the app is being run locally
function expressIsLocal (req, res, next) {
    req.isLocal = !!isLocal(req);
    if (req.isLocal) debug = true;
    next()
}

// Express.js Middleware: Add this to the default cors middleware to handle OPTIONS requests
function corsOptions (req, res, next) {
    if (req.method === 'OPTIONS') {
        var headers = {};
        headers["Access-Control-Allow-Origin"] = "*";
        headers["Access-Control-Allow-Methods"] = "POST, GET, PUT, DELETE, OPTIONS";
        headers["Access-Control-Allow-Credentials"] = true;
        headers["Access-Control-Max-Age"] = '86400'; // 24 hours
        headers["Access-Control-Allow-Headers"] = "Accept,Authorization,Cache-Control,Content-Type,DNT,If-Modified-Since,Keep-Alive,Origin,User-Agent,X-Requested-With,X-HTTP-Method-Override";
        res.writeHead(204, headers);
        res.end();
    } else {
        next();
    }
}

// Some defaults
function corsAndBodyParser (app) {
    app.use(corsOptions);
    app.use(require('cors')());
    app.use(require('body-parser').json({ limit: '5mb', extended: true }));
    app.use(require('body-parser').urlencoded({ limit: '5mb', extended: true }));
}

// Coerce a boolean or string version of a boolean to a boolean
function coerceBoolean (ins) {
    if (typeof ins === 'boolean') return ins; // Just pass it back if it's already a BOOLEAN
    if (String(ins) == 1) return true; // 1 -> true
    if (String(ins) == 0) return false; // 0 // -> false
    if (typeof ins === 'number' && String(ins) === 'NaN') return false; // NaN -> false
    if (typeof ins === 'number') return true; // Would have already returned if zero

    if (typeof ins === 'string' && ins.toLowerCase() !== 'false') return true; // Evaluates all strings not like 'false' to true

    return String(ins).toLowerCase() == 'true'; // Evaluates true / false / 'true' / 'false' / 'True' / 'False' / 'TRUE' / etc.
}

// Fix a Meeting Room 365 display configuration object (type coercion)
function fixDisplayConfig (displayConfig) {
    try { // Fix any values we need before rendering
        if (displayConfig.updated) displayConfig.updated = parseInt(displayConfig.updated);
        if (displayConfig.minutes) displayConfig.minutes = parseInt(displayConfig.minutes);
        if (displayConfig.hoursForward) displayConfig.hoursForward = parseInt(displayConfig.hoursForward);
        if (displayConfig.powershellConfigured) displayConfig.powershellConfigured = parseInt(displayConfig.powershellConfigured);
        if (displayConfig.timeOffset) displayConfig.timeOffset = parseInt(displayConfig.timeOffset);
        if (displayConfig.checkInMinutes) displayConfig.checkInMinutes = parseInt(displayConfig.checkInMinutes);

        displayConfig.private = coerceBoolean(displayConfig.private);
        displayConfig.allowEndEarly = coerceBoolean(displayConfig.allowEndEarly);
        displayConfig.customReserve = coerceBoolean(displayConfig.customReserve);
        displayConfig.forceCheckIn = coerceBoolean(displayConfig.forceCheckIn);
        displayConfig.instant = coerceBoolean(displayConfig.instant);
        displayConfig.intdates = coerceBoolean(displayConfig.intdates);
        displayConfig.twentyfour = coerceBoolean(displayConfig.twentyfour);
        displayConfig.roomfinder = coerceBoolean(displayConfig.roomfinder);
        displayConfig.isOnline = coerceBoolean(displayConfig.isOnline);
        displayConfig.hidden = coerceBoolean(displayConfig.hidden);
        displayConfig.showdates = coerceBoolean(displayConfig.showdates);
        displayConfig.allowExtendMeeting = coerceBoolean(displayConfig.allowExtendMeeting);
        displayConfig.messageAdministrator = coerceBoolean(displayConfig.messageAdministrator);


    } catch(e){}

    return displayConfig;
}

// Generate a dummy response similar to Exchange 2016 / Office 365 list calendar items
function generateDummyMeetingData () {
    return [
        generateFakeMeetingItem(adjustedTimeFromNow(-120)),
        generateFakeMeetingItem(adjustedTimeFromNow(60)),
        generateFakeMeetingItem(adjustedTimeFromNow(180))
    ];
}

// Generate a dummy object similar to an Exchange 2016 / Office 365 calendar item
function generateFakeMeetingItem (startTime) {
    return {
        "@odata.etag":"W/\"A2Ks6hPdmEmxwU6/jOPhtgACBSiN2w==\"",
        "id":"AQMkAGMyNGIyNWQyLTYyOTAtNGRmMi1iNjlkLWQxZjI4ZTU3YzFiYQBGAAAD6vZD1Qo7mEazweExQLyoBgcAA2Ks6hPdmEmxwU6-jOPhtgAAAgENAAAAA2Ks6hPdmEmxwU6-jOPhtgACBRAhigAAAA==",
        "createdDateTime":"2018-07-21T19:45:54.4390641Z",
        "lastModifiedDateTime":"2018-07-21T19:45:54.4703138Z",
        "changeKey":"A2Ks6hPdmEmxwU6/jOPhtgACBSiN2w==",
        "categories":[],
        "originalStartTimeZone":"Pacific Standard Time",
        "originalEndTimeZone":"Pacific Standard Time",
        "reminderMinutesBeforeStart":15,
        "isReminderOn":true,
        "hasAttachments":false,
        "subject":"This is a test",
        "bodyPreview":"",
        "importance":"normal",
        "sensitivity":"normal",
        "isAllDay":false,
        "isCancelled":false,
        "isOrganizer":true,
        "responseRequested":true,
        "seriesMasterId":null,
        "showAs":"busy",
        "type":"singleInstance",
        "webLink":"https://outlook.office365.com/owa/?itemid=AQMkAGMyNGIyNWQyLTYyOTAtNGRmMi1iNjlkLWQxZjI4ZTU3YzFiYQBGAAAD6vZD1Qo7mEazweExQLyoBgcAA2Ks6hPdmEmxwU6%2FjOPhtgAAAgENAAAAA2Ks6hPdmEmxwU6%2FjOPhtgACBRAhigAAAA%3D%3D&exvsurl=1&path=/calendar/item",
        "onlineMeetingUrl":null,
        "recurrence":null,
        "responseStatus":{
            "response":"organizer",
            "time":"0001-01-01T00:00:00Z"
        },
        "body":{
            "contentType":"html",
            "content":""
        },
        "start":{
            "dateTime": (new Date(startTime)).toISOString().slice(0, -1),
            "timeZone":"UTC"
        },
        "end":{
            "dateTime": (new Date((new Date(startTime)).getTime() + (60 * 60000))).toISOString().slice(0, -1),
            "timeZone":"UTC"
        },
        "location":{
            "displayName":"",
            "locationType":"default",
            "uniqueIdType":"unknown",
            "address":{
                "type":"unknown"
            },
            "coordinates":{}
        },
        "locations":[],
        "attendees":[],
        "organizer":{
            "emailAddress":{
                "name":"Foobar Jones",
                "address":"foo@bar.co"
            }
        }
    };
}

// Determine if an object is a file Buffer
function isBuffer (arg) {
    return arg instanceof Buffer;
}

// Shuffle an array (Efficient Fisher-Yates shuffle)
function shuffle (a) {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}

// Generate a friendly three-word trigraph (with enough entropy to be used as a pseudo-unique key)
function trigraph () {
    var words = "find any new work part take get place made live where after back little only round year came show every good me give our under name very through just form sentence great think say help low line differ turn cause much mean before move right boy old too same tell does set three want air well also play small end put home read hand port large spell add even land here must big high such follow act why ask change went light kind off need house picture try us again animal point mother world near build self earth father head stand own page should country found answer school grow study still learn plant cover food sun four between state keep eye never last let thought city tree cross farm hard start might story saw far sea draw left late run dont while press close night real life few north open seem together next white children begin got walk example ease paper group always music those both mark often letter until mile river car feet care second book carry took science eat room friend began idea fish mountain stop once base hear horse cut sure watch color face wood main enough plain girl usual young ready above ever red list though feel talk bird soon body dog family direct pose leave song measure door product black short numeral class wind question happen complete ship area half rock order fire south problem piece told knew pass since top whole king space heard best hour better true during hundred five remember step early hold west ground interest reach fast verb sing listen six table travel less morning ten simple several vowel toward war lay against pattern slow center love person money serve appear road map rain rule govern pull cold notice voice unit power town fine certain fly fall lead cry dark machine note wait plan figure star box noun field rest correct able pound done beauty drive stood contain front teach week final gave green oh quick develop ocean warm free minute strong special mind behind clear tail produce fact street inch multiply nothing course stay wheel full force blue object decide surface deep moon island foot system busy test record boat common gold possible plane stead dry wonder laugh thousand ago ran check game shape equate hot miss brought heat snow tire bring yes distant fill east paint language among grand ball yet wave drop heart am present heavy dance engine position arm wide sail material size vary settle speak weight general ice matter circle pair include divide syllable felt perhaps pick sudden count square reason length represent art subject region energy hunt probable bed brother egg ride cell believe fraction forest sit race window store summer train sleep prove lone leg exercise wall catch mount wish sky board joy winter sat written wild instrument kept glass grass cow job edge sign visit past soft fun bright gas weather month million bear finish happy hope flower clothe strange gone jump baby eight village meet root buy raise solve metal whether push seven paragraph third shall held hair describe cook floor either result burn hill safe cat century consider type law bit coast copy phrase silent tall sand soil roll temperature finger industry value fight lie beat excite natural view sense ear else quite broke case middle kill son lake moment scale loud spring observe child straight consonant nation dictionary milk speed method organ pay age section dress cloud surprise quiet stone tiny climb cool design poor lot experiment bottom key iron single stick flat twenty skin smile crease hole trade melody trip office receive row mouth exact symbol die least trouble shout except wrote seed tone join suggest clean break lady yard rise bad blow oil blood touch grew cent mix team wire cost lost brown wear garden equal sent choose fell fit flow fair bank collect save control decimal gentle captain practice separate difficult doctor please protect noon whose locate ring character insect caught period indicate radio spoke atom human history effect electric expect crop modern element hit student corner party supply bone rail imagine provide agree thus capital wont chair danger fruit rich thick soldier process operate guess necessary sharp wing create neighbor wash bat rather crowd corn compare poem string bell depend meat rub tube famous dollar stream fear sight thin triangle planet hurry chief colony clock mine tie enter major fresh search send yellow gun allow print dead spot desert suit current lift rose continue block chart hat sell success company subtract event particular deal swim term opposite wife shoe shoulder spread arrange camp invent cotton born determine quart nine truck noise level chance gather shop stretch throw shine property column molecule select wrong gray repeat require broad prepare salt nose plural anger claim continent oxygen sugar death pretty skill season solution magnet silver thank branch match suffix especially fig afraid huge sister steel discuss forward similar guide experience score apple bought led pitch coat mass card band rope slip win dream evening condition feed tool total basic smell valley nor double seat arrive master track parent shore division sheet substance favor connect post spend chord fat glad original share station dad bread charge proper bar offer segment duck instant market degree populate dear enemy reply drink occur support speech nature range steam motion path liquid log meant quotient teeth shell neck";
    words = words.split(' ');
    words = shuffle(words);
    return words[0] + words[2] + words[5] + (Math.floor(Math.random() * 99) + 1);
}

// Determine if an email address or domain is free or disposible
function isFreeMail (selector) {
    const freemail = require('freemail');

    if (!selector.includes('@')) selector = 'foo@' + selector;

    if (freemail.isFree(selector) || freemail.isDisposable(selector)) {
        //console.log('Disposable email used', selector);
        return true;
    }

    return false;
}

// Generate a new Meeting Room 365 display configuration object
function newConfigObject (emailAddr, tenantDomain, overrides) {
    if (!emailAddr) return false;

    if (!tenantDomain && emailAddr.includes('@')) tenantDomain = emailAddr.split('@')[1];

    let displayConfig = {
        styles: '/* Paste your CSS styles here to override existing styles. */\n\n/* Use your browser\'s Inspector to understand & test overrides for current styles. */',
        image: 'https://meetingroom365.com/display/images/bg.jpg',
        tenant_lc: lowercase(tenantDomain),
        created: (new Date()).toString(),
        email_lc: lowercase(emailAddr),
        originalKey: trigraph(),
        customReserve: false,
        tenant: tenantDomain,
        name: 'Meeting Room',
        email: emailAddr,
        status: 'Active',
        hoursForward: 8,
        implicit: true,
        instant: true,
        twentyfour: 0,
        minutes: 15,
        intdates: 0,
        i18n: null
    };

    if (overrides) Object.assign(displayConfig, overrides);

    return displayConfig;
}

// Generate random alphanumeric key
function generateKey (keyLength) {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    var key = "";
    var length = (keyLength && typeof keyLength === "number") ? keyLength : 10;

    for (var i = 0; i < length; i++) {
        key += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    return key;
}

// Translate a truncated timestamp (int) to a timestamp (int)
function truncToTS (i) {
    return i * (5 * 60 * 1000) + 1454212801000;
}

// Translate a timestamp (int) to a truncated timestamp (int)
function tsToTrunc (i) {
    return Math.floor((i - 1454212801000) / (5 * 60 * 1000));
}

// Generate a random int <= 9999999999
function rint (max) {
    if (!max) max = 9999999999;
    return Math.floor(Math.random() * Math.floor(max));
}

// Middleware to tally path request counts on a global
function prcsMiddleware (req, res, next) {
    var url = req.originalUrl ? req.originalUrl.split('?')[0] : '';
    if (url.includes('/')) url = '/' + url.split('/')[1];
    if (!global._prcs) global._prcs = {};

    if (!global._prcs['_ts']) global._prcs['_ts'] = +new Date();
    if (!global._prcs[url]) global._prcs[url] = 0;
    global._prcs[url]++;
    next();
}

// Middleware to return path request counts
function pathRequestCounts (req, res) {
    res.json(global._prcs || {});
}

// Middleware to allow lots of origins
function allowAllOrigins (req, res, next) {
    var origin = req.headers.origin;

    // Allow a whitelisted set of origins
    // var allowedOrigins = ['http://127.0.0.1:8020', 'http://localhost:8020', 'http://127.0.0.1:9000', 'http://localhost:9000'];
    // if(allowedOrigins.indexOf(origin) > -1){
    //     res.setHeader('Access-Control-Allow-Origin', origin);
    // }

    // Allow all origins, basically
    if (origin) res.setHeader('Access-Control-Allow-Origin', origin);

    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', true);
    next();
}

/**
 * Transforms a string into a valid firebase key by stripping a subset of special characters, and replacing
 * with underscores
 */
function firebaseSafeKey (str) {
    if (!str || (typeof str !== 'string' && typeof str !== 'number')) return false;

    return ('' + str).replace(/ |\/|\\|\.|\$|\&|\[|\]|\*|\#|\"|\'|\`|\,|\{|\}/g, '_').replace(/_{2,}/g, '_');
}

/**
 * Transforms a string into a URL-safe string by replacing all non-ascii and special characters with underscores,
 * leaving only letters and numbers
 */
function urlSafeString (str) {
    if (!str || (typeof str !== 'string' && typeof str !== 'number')) return false;

    return ('' + str).replace(/[^a-zA-Z0-9 ]/g, '_').replace(/_{2,}/g, '_');
}


// Exports
module.exports = {
    s4: s4,
    tp: tp,
    rint: rint,
    isLocal: isLocal,
    shuffle: shuffle,
    isBuffer: isBuffer,
    trigraph: trigraph,
    lowercase: lowercase,
    tsToTrunc: tsToTrunc,
    truncToTS: truncToTS,
    isFreeMail: isFreeMail,
    corsOptions: corsOptions,
    generateKey: generateKey,
    urlSafeString: urlSafeString,
    coerceBoolean: coerceBoolean,
    expressIsLocal: expressIsLocal,
    allowAllOrigins: allowAllOrigins,
    firebaseSafeKey: firebaseSafeKey,
    newConfigObject: newConfigObject,
    fixDisplayConfig: fixDisplayConfig,
    dateToMsISOString: dateToMsISOString,
    corsAndBodyParser: corsAndBodyParser,
    adjustedTimeFromNow: adjustedTimeFromNow,
    generateFakeMeetingItem: generateFakeMeetingItem,
    generateDummyMeetingData: generateDummyMeetingData
};
