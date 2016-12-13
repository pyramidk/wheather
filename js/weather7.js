//初始化app
var myApp= new Framework7({
	modalTitle: '天气搜索', //默认的标题
	material: true,         //安卓模式
	materialPageLoadDelay: 200
});

var $$ = Dom7;
// //注册   可以获得星期
// Template7.registerHelper('dayOfWeek', function (data) {
// 	date = new Date(date);
// 	var days = ('星期日 星期一 星期二 星期三 星期四 星期五 星期六').split(' ');
// 	return days[date.getDay()];
// });
// Template7.registerHelper('formatedDated', function (date) {
//     date = new Date(date);
//     var months = '一月 二月 三月 四月 五月 六月 七月 八月 九月 十月 十一月 十二月'.split(' ');
//     return months[date.getMonth()] + ' ' + date.getDate() + ' ' + date.getFullYear();
// });

// Templates using Template7 template engine
myApp.searchResultsTemplate = Template7.compile($$('#search-results-template').html());
myApp.homeItemsTemplate = Template7.compile($$('#home-items-template').html());
myApp.detailsTemplate = Template7.compile($$('#details-template').html());

//Add view
var mainView = myApp.addView('.view-main');

//搜索相关
var searchTimeout;
var flickrAPIKey = 'c3bd54dcf0754905b52f5ed0a68e9204';

myApp.searchLocation = function () {
	var searchTarget = $$('.searchbar-input input').val();
    if (searchTarget.trim() === '') {
        $$('.popup .search-results').html('');
        return;
    }
    var api = 'https://api.heweather.com/x3/weather?city=' + searchTarget + '&key='+ flickrAPIKey+ '';
    $$('.popup .preloader').show();
    if(searchTimeout) clearTimeout(searchTimeout);
    searchTimeout = setTimeout(function () {
        $$.get(api, function(results) {
            var html = '';
            results = JSON.parse(results);
            console.log(results);
            $$('.popup .preloader').hide();
            //判断是否有搜索结果
            if(results["HeWeather data service 3.0"][0]["status"] === 'ok') {
            	var places = results["HeWeather data service 3.0"][0]["basic"];
            	html = myApp.searchResultsTemplate(places);
            }
            $$('.popup .search-results').html(html);
        });

    }, 300);
}

var mySeachbar = myApp.searchbar('.searchbar', {
    customSearch: true,
    onDisable: function (s) {
        $$('.popup input[type="search"]')[0].blur();
        myApp.closeModal('.popup');
    },
    onSearch: function (s, q) {
        myApp.searchLocation();
    },
    onClear: function (s) {
        $$('.popup .search-results').html('');
    }
 });
$$('.popup').on('open', function () {
    mySeachbar.enable();  //输入框焦点
});
$$('.popup').on('opened', function () {
    $$('.popup input[type="search"]')[0].focus();
});
//结果点击
$$('.popup .search-results').on('click', 'li', function () {
    var li = $$(this);
    var id = li.attr('data-id'); 
    var city = li.attr('data-city');   
    var country = li.attr('data-country');
    var places;
    if (localStorage.storePlaces) {
        places = JSON.parse(localStorage.storePlaces);
    } else {
        places = [];
    }
    places.push({
        id: li.attr('data-id'),
        city: li.attr('data-city'),  
        country: li.attr('data-country')
    })
    localStorage.storePlaces = JSON.stringify(places);

    myApp.updateWeatherData(function () {
        myApp.buildIndexHtml();
    });

    //myApp.updateWeatherData(   function () {myApp.buildIndexHtml()}   );  先执行update函数，然后再执行传入为参数的函数

});


myApp.updateWeatherData = function (callback) {
    var city = [];   
    if (!localStorage.storePlaces) {    //因为需要缓存来获取更多的数据， 所以需要判断
        return;
    }
    var places = JSON.parse(localStorage.storePlaces);
    for (var i = 0; i < places.length; i++) {
        city.push(places[i].city)
    }
    var weatherData = [];
    for (var i = 0; i < city.length; i++) {
        // console.log(city[i]);
        var api = 'https://api.heweather.com/x3/weather?city=' + city[i] + '&key='+ flickrAPIKey+ '';
        $$.get(api, function(results) {
            results = JSON.parse(results);
            var needData= results["HeWeather data service 3.0"][0];
            // console.log(needData);
            weatherData.push({
                city: needData.basic.city,
                cnty: needData.basic.cnty,
                id: needData.basic.id,
                daily_forecast: needData.daily_forecast,
                condition: needData.now.tmp,
                text: needData.now.cond.txt,
            });

            localStorage.storeData = JSON.stringify(weatherData);
            if (callback) callback(); 
        });

    }

}

myApp.buildIndexHtml = function () {
    var weatherData = localStorage.storeData;
    if (!weatherData) {
        return;
    }
    $$('.places-list ul').html('');
    weatherData = JSON.parse(weatherData); 
    var html = myApp.homeItemsTemplate(weatherData);
    $$('.places-list ul').html(html);
}

myApp.updateWeatherData(function () {
        myApp.buildIndexHtml();
});


//detail page
$$('.places-list').on('click', 'a.item-link', function(e) {
	var id = $$(this).attr('data-id');
	var item;
	var weatherData = JSON.parse(localStorage.storeData);
	console.log(weatherData);
	for(var i = 0; i < weatherData.length; i++) {
		if (weatherData[i].id === id) {
			item = weatherData[i];
			console.log(weatherData[i].id );
		}
	}
	var pageContent = myApp.detailsTemplate(item);
    mainView.loadContent(pageContent);
})

//delete item  将places的地方去掉
$$('.places-list').on('delete', '.swipeout', function() {
	var id = $$(this).attr('data-id');
	//将存储的places删除
	if(!localStorage.storePlaces) return;
	var places = JSON.parse(localStorage.storePlaces);
	for(var i = 0;i < places.length;i++) {
		if (places[i].id === id) places.splice(i,1);
	}
	localStorage.storePlaces = JSON.stringify(places);

	//将存储的具体data删除
	if(!localStorage.storeData) return;
	var WholeData = JSON.parse(localStorage.storeData);
	for (var i = 0; i < WholeData.length; i++) {
	 	if(WholeData[i].id = id) WholeData.splice(i,1);
	}
	localStorage.storeData = JSON.stringify(WholeData); 
})

// //背景图片
// myApp.onPageAfterAnimation('detail', function (page) {
// 	console.log('test');
// 	function placePhotos () {
// 		var api = 'http://www.tngou.net/tnfs/api/classify';
//         $$.get(api, function(results) {
//         	console.log(results);            
//         });
// 	}
// 	placePhotos();
// })
// function placePhotos () {
// 		var api = 'http://api.laifudao.com/open/tupian.json';
//         $$.get(api, function(results) {
//         	console.log(results);            
//         });
// }
// placePhotos ();