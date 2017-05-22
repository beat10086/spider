var  express=require('express');
var  app=express();


app.get('/',function(req,res){
    res.writeHead(200, {"Content-Type": "text/html;charset=utf8"});
    res.write("hello word");
    res.end();
})


app.listen(3000,function(){
	   console.log('this is port 3000');
})