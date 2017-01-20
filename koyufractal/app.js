
var gpu = new GPU();

var max_t = 512;

var th = 2.0;

var x0 = -2.0;
var y0 = -1.0;

var cx = -0.2;
var cy = -0.1775;

var width  = 1000;
var height = 600;
var d = 0.004;
var gpu_mode = "auto";

var lt = 1.0;

function canvas_onclick(e){
  var rect = e.target.getBoundingClientRect();
  var x = e.clientX - rect.left;
  var y = e.clientY - rect.top;
  var w = rect.right - rect.left;
  var h = rect.bottom - rect.top;
  var px = x0 + (x/w) * d * width;
  var py = y0 + ((h-y)/h) * d * height;
  x0 += px - (x0+d*width *0.5);
  y0 += py - (y0+d*height*0.5);
  draw();
}
function canvas_onscroll(e){
  var rect = e.target.getBoundingClientRect();
  var x = e.clientX - rect.left;
  var y = e.clientY - rect.top;
  var w = rect.right - rect.left;
  var h = rect.bottom - rect.top;
  if(x>w || y>h) return;
  var px = x0 + (x/w) * d * width;
  var py = y0 + ((h-y)/h) * d * height;
  var k = e.deltaY > 0 ? 2.0 : 0.5;
  x0 = (x0 - px) * k + px;
  y0 = (y0 - py) * k + py;
  d *= k;

  draw();
}

function draw(){
  document.getElementById('cx').value = cx;
  document.getElementById('cy').value = cy;
  var val = {
    max_t : max_t,
    th : th*th,
    x0 : x0,
    y0 : y0,
    cx : cx,
    cy : cy,
    width : width,
    height : height,
    d : d,
    div : lt
  }

  var compute = gpu.createKernel(
    function(){
      var px = this.constants.cx;
      var py = this.constants.cy;
      var x = this.constants.x0 + this.constants.d*this.thread.x;
      var y = this.constants.y0 + this.constants.d*this.thread.y;
      var t  = 0;
      var div = this.constants.div;

      while(t < this.constants.max_t){
        if(div > 0.0){
          if(x*x+y*y < this.constants.th == false) break;
        }else{
          if(x*x+y*y > this.constants.th == false) break;
        }
        
        x = Math.abs(x);
        //y = Math.abs(y);
        var xx = (x*x-y*y)+px;
        var yy = (2.0*x*y)+py;
        x = xx;
        y = yy;
        t++;
      }
      if(t>=this.constants.max_t){
        this.color(0,0,0);
      }else{
        var xx = x*x;
        var yy = y*y;
        var zz = xx+yy;
        if( zz < 1e-8 ){
          x = 0.5;
          y = 0.5;
        }else{
          if( x<0 ) x = - xx / zz + 1;
          else      x =   xx / zz + 1;

          if( y<0 ) y = - yy / zz + 1;
          else      y =   yy / zz + 1;
        }
        x *= 0.5;
        y *= 0.5;
        this.color((t/200.0), Math.abs(x), Math.abs(y));
      }
      return t;
    }, {dimensions : [width,height], graphical : true, mode:gpu_mode, constants:val, loopMaxIterations:5000}
  );

  compute();
  var canvas = compute.getCanvas();
  document.getElementById('unko').appendChild(canvas);
  document.getElementsByTagName('canvas')[0].addEventListener('click', canvas_onclick);
  document.getElementsByTagName('canvas')[0].addEventListener('wheel', canvas_onscroll);
}

window.onload = function(){
  document.getElementById('cx').onchange = function(){cx = Number(this.value); draw();};
  document.getElementById('cy').onchange = function(){cy = Number(this.value); draw();};
  document.getElementById('iteration').onchange = function(){max_t = Number(this.value); draw();};
  document.getElementById('threathold').onchange = function(){th = Number(this.value); draw();};
  document.getElementById('cond_gt_lt').onchange = function(){
    lt = this.value === "lt" ? 1.0 : -1.0; draw();
  };

  gpu_mode = document.getElementById('gpu_mode').checked ? "auto" : "cpu";
  document.getElementById('gpu_mode').onchange = function(){
    gpu_mode = document.getElementById('gpu_mode').checked ? "auto" : "cpu";
    document.getElementById('unko').innerHTML = "";
    draw();
  };
  draw();
}
