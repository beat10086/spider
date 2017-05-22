var express=require('express');
var app=express();
var request=require('request');
var cheerio=require('cheerio');
var events = require('events');
var urlsArray = [];	//存放爬取网址
var pageUrls = [];	//存放收集文章页面网站
var pageNum = 200;	//要爬取文章的页数
var eventEmitter = new events.EventEmitter();
var eventproxy = require('eventproxy');
var ep = new eventproxy();
for(var i=1 ; i<= 200 ; i++){
		pageUrls.push('http://www.cnblogs.com/#p'+i);
}
app.get('/',function(req,res){
	  res.writeHead(200, {"Content-Type": "text/html;charset=utf8"});
      pageUrls.forEach(function(pageUrl){
            request(pageUrl,function(error, response, body){
            	   if (!error && response.statusCode == 200) {
				      $ = cheerio.load(body);
				      var curPageUrls = $('.titlelnk');
				     for(var i = 0 ; i < curPageUrls.length ; i++){
					  	var articleUrl = curPageUrls.eq(i).attr('href');
					  	urlsArray.push(articleUrl);
					  	eventEmitter.emit('showTitleUrl',articleUrl)
					  }
				  }
            })
      }) 
      eventEmitter.on('showTitleUrl',function(articleUrl){
      	   if(urlsArray.length<=4000){
      	   	   res.write(articleUrl+"<br/>"); 
      	   }
      })
      res.write("搜到数据的条数:"+urlsArray.length); 
      //res.end();
})
var server=app.listen(3000,function(){
	   console.log('this is port 3000');
})
