//初始化app
var myApp= new Framework7({
	modalTitle: '天气搜索', //默认的标题
	material: true,         //安卓模式
	materialPageLoadDelay: 200
});

var $$ = Dom7;
//注册   可以获得星期
Template7.registerHelper('dayOfWeek', function (data) {
	date = new Date(date);
	var days = ('星期日 星期一 星期二 星期三 星期四 星期五 星期六').split(' ');
	return days[date.getDay()];
});
Template7.registerHelper('formatedDated', function (date) {
    date = new Date(date);
    var months = 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(' ');
    return months[date.getMonth()] + ' ' + date.getDate() + ' ' + date.getFullYear();
});

// Templates using Template7 template engine
myApp.searchResultsTemplate = Template7.compile($$('#search-results-template').html());
myApp.homeItemsTemplate = Template7.compile($$('#home-items-template').html());
myApp.detailsTemplate = Template7.compile($$('#details-template').html());

// Add view
var mainView = myApp.addView('.view-main');

// Search Locations
var searchTimeout;

myApp.searchLocation = function (search) {
    if (search.trim() === '') {
        $$('.popup .search-results').html('');
        return;
    }
    var query = encodeURIComponent('select * from geo.places where text="' + search + '"');
    var q = 'http://query.yahooapis.com/v1/public/yql?q=' + query + '&format=json';
    if (searchTimeout) clearTimeout(searchTimeout);
    $$('.popup .preloader').show();
    searchTimeout = setTimeout(function () {
        $$.get(q, function (results) {
            var html = '';
            results = JSON.parse(results);
            $$('.popup .preloader').hide();
            if (results.query.count > 0) {
                var places = results.query.results.place;
                html = myApp.searchResultsTemplate(places);
            }
            $$('.popup .search-results').html(html);
        });
    }, 300);
};
