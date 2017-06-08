var request   =require('request');
var iconv     =require('iconv-lite');
var cheerio   =require('cheerio');
var async     =require('async');
var url       = 'http://www.xiaohuar.com/list-1-0.html';
var count     =2;
var urlsList = [];// 待抓取的页面地址
var xiaohuaUrlsList = [];// 待要抓取的详情页面地址
//加载标准库
var path=require('path');
var fs  =require('fs');

for(var i=0;i<count;i++){
	 urlsList.push('http://www.xiaohuar.com/list-1-' + i + '.html');
}
//async 异步函数，操作多个方法
async.waterfall([getInfoList, getImageList], function (error) {
    console.log('爬虫结束');
});
function getInfoList (done) {
	async.forEachLimit(urlsList,5,function(url,callback){
		  request.get({
		        url: url,
		        encoding: null // buffer
		    }, function (err, response, body) {
		        if (!err && response.statusCode === 200) {
		            body = iconv.decode(body, 'gb2312');// 处理转码问题
		            var $ = cheerio.load(body);// 解析页面
		            // 拿到页面的相关链接
		            $('#list_img').find('.item').each(function (item) {
		                var xiaohuaUrl = $(this).find('a').attr('href');// 获取这个页面的我们要抓的url地址
		                /**
		                 * 经过抓取发现格式不统一
		                 * /p-1-146.html
		                 * http://www.xiaohuar.com/p-1-584.html
		                 * 所以统一一下格式
		                 */
		                 console.log(xiaohuaUrl);
		                xiaohuaUrl = 'http://www.xiaohuar.com' + xiaohuaUrl.replace('http://www.xiaohuar.com', '');
		                // 放到容器内
		                xiaohuaUrlsList.push(xiaohuaUrl);
		            });
		            callback();
		        } else {
		            console.error('请求失败', err);
		            // 因为我们不希望报错停止抓取 所以不拦截报错
		            callback();
		        }
		    }); 
	},function (error, result) {
	    //批量抓取
	    if(error){
	    	  console.log('抓取列表页失败');
	    	  done();
	    }else {
	          console.log('批量抓取列表页结束, 共计获取了', xiaohuaUrlsList.length, '条详情页数据');
	         done();
	    }
	})   
}
function  getImageList (done) {
  async.forEachLimit(xiaohuaUrlsList,10,function(url,callback){
           // 利用定时器来模拟人操作的延迟行为 防止一次请求太多 对目标网站造成ddoc攻击
        setTimeout(function () {
            // 开始抓取
            request.get({
                url: url,
                encoding: null // buffer
            }, function (err, response, body) {
                if (!err && response.statusCode === 200) {
                    body = iconv.decode(body, 'gb2312');// 处理转码问题
                    var $ = cheerio.load(body);// 解析页面
                    var photosr = [];
                    // 获取图片链接
                    $('.photo_ul').find('img').each(function (item) {
                        photosr.push($(this).attr('src'));
                    })
                    // 下载图片
                    async.forEach(photosr, function (item, downloadImgCallback) {
                        // 处理一下链接不存在的可能
                        if (!item) {
                            return downloadImgCallback();
                        }
                        var imgsrc = 'http://www.xiaohuar.com' + item;
                        var filename = parseUrlForFileName(imgsrc);
                        downloadImg(imgsrc, filename, function () {downloadImgCallback();});
                    }, function () {
                        console.log('某个妹子图片下载处理结束');
                        callback();
                    });
                } else {
                    console.error('请求失败', err);
                    // 因为我们不希望报错停止抓取 所以不拦截报错
                    callback();
                }
            });
        }, 500 + Math.floor(Math.random() * 500));
  }, function (error, result) {
        if (error) {
            console.log('获取图片链接失败');
            done();
        }else{
            console.log('获取图片链接结束');
            done();
        }
    })
}

// 生成文件名
function parseUrlForFileName (address) {
    var filename = path.basename(address);  //提取出用 ‘/' 隔开的path的最后一部分
    return filename;
}
// 下载图片
function downloadImg (_url, filename, callback) {
    // 判断是否有存放文件的文件夹
    if (!fs.existsSync(__dirname + '/images')) {
        fs.mkdirSync(__dirname + '/images');
        console.log('初始化创建目录');
    }
    // 请求下载
    request.head(_url, function (err, res, body) {
        // console.log('content-type:', res.headers['content-type']);  //这里返回图片的类型
        // console.log('content-length:', res.headers['content-length']);  //图片大小
        if (err) {
            console.log('err: ' + err);
            return false;
        }
        // 调用request的管道来下载到 images文件夹下
        request(_url).pipe(fs.createWriteStream('images/' + filename)).on('close', callback);  
    });
}
