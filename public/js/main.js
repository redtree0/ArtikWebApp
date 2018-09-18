  // var test;

  document.getElementById('actionBtn').onclick = function testFuncOn() {
    console.log("Button Clicked\n");
    var form = $('#postdata');
      form.attr("method", "post");
      form.attr("action", "/actions");
      var parameters = {
        Fan_mode:"1"
      }
      console.log("parameters done\n")
      $.each(parameters, function(key, value) {
          var field = $('#postDiv');

          field.attr("type", "hidden");
          field.attr("name", key);
          field.attr("value", value);
          console.log("key", key);
          console.log("value", value);

          form.append(field);
        });
      //form.attr("parameters","{\"Fan_mode\":\"1\"}");
      console.log("form done\n");
      $(document.body).append(form);
      console.log(JSON.stringify(form));
      form.submit();
      console.log("submit done\n");
    }


 var _pmValue = document.getElementById('pmValue');
 let timeInterval = 5000;

  // $("#deviceTimerBtn").click(function(e){
  //   console.log(e);
    
    
  // });

  var auto = setInterval(function(){
    // getPmValue();
  }, timeInterval);

  function getPmValue(){
      $.get("/pminfo", function(data, status){
        _pmValue.value = JSON.stringify(data);
        //   console.log("Data: " + JSON.stringify(data) + "\nStatus: " + status);
      });
  }

  // class test {
    
  // }
  // test.add = function(){

  // }

  // var test = function(){

  // }
  // test.prototype.add = function(){

  // }

  // java spring -> 정부프레임워크(공무원들이 쓰는 프로그램) 객체지향
  // node.js -> 개발 하기는 편해, 표현방식이 유연해서 제대로 배우기 힘듬
  // python -> 머신러닝 할때 영상 처리할 때 편함
  // go -> 최근 각광 받음
  // c++ -> 하드웨어 할때 

  // document.getElementById('testBtnOff').onclick = function testFuncOff() {
  //   console.log("test");
  //   var form = $('#postdata');
  //     form.attr("method", "post");
  //     form.attr("action", "/actions");
  //     var parameters = {
  //       Fan_mode:"0"
  //     }
  //     $.each(parameters, function(key, value) {
  //         var field = $('#postDiv');

  //         field.attr("type", "hidden");
  //         field.attr("name", key);
  //         field.attr("value", value);

  //         form.append(field);
  //       });
  //     //form.attr("parameters","{\"Fan_mode\":\"0\"}");
  //     $(document.body).append(form);
  //     form.submit();
  // }