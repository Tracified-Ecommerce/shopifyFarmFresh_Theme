// begin tracified.js

function detectIE() {
    var ua = window.navigator.userAgent;

    var msie = ua.indexOf('MSIE ');
    if (msie > 0) {
        // IE 10 or older => return version number
        return parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
    }

    var trident = ua.indexOf('Trident/');
    if (trident > 0) {
        // IE 11 => return version number
        var rv = ua.indexOf('rv:');
        return parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);
    }

    var edge = ua.indexOf('Edge/');
    if (edge > 0) {
        // Edge (IE 12+) => return version number
        return parseInt(ua.substring(edge + 5, ua.indexOf('.', edge)), 10);
    }

    // other browser
    return false;
}

function drawPieSlice(ctx, centerX, centerY, radius, startAngle, endAngle, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.fill();
}

var Piechart = function (options) {
    this.options = options;
    this.canvas = options.canvas;
    this.ctx = this.canvas.getContext("2d");
    this.colors = options.colors;

    this.draw = function () {
        var total_value = 0;
        var color_index = 0;
        for (var categ in this.options.data) {
            var val = this.options.data[categ];
            total_value += val;
        }

        var start_angle = 0;
        for (categ in this.options.data) {
            val = this.options.data[categ];
            var slice_angle = 2 * Math.PI * val / total_value;

            drawPieSlice(
                this.ctx, //context
                this.canvas.width / 2, //centerx
                this.canvas.height / 2, //centery
                Math.min(this.canvas.width / 2, this.canvas.height / 2), //radius, geting the least one from height and width
                start_angle, //start angle
                start_angle + slice_angle, //end angle
                this.colors[color_index % this.colors.length] //array of colors
            );

            start_angle += slice_angle;
            color_index++;
        }

        //drawing a white circle over the chart
        //to create the doughnut chart
        if (this.options.doughnutHoleSize) {
            drawPieSlice(
                this.ctx,
                this.canvas.width / 2, //centerx
                this.canvas.height / 2, //centery
                this.options.doughnutHoleSize * Math.min(this.canvas.width / 2, this.canvas.height / 2), //radius
                0,
                2 * Math.PI,
                "#ffffff"
            );

            //creating the percentage label in the center of the donut
            if (options.percentage == 100) {
                var labelX = this.canvas.width / 2 - this.canvas.width / 4.5;
                var labelY = this.canvas.height / 2 + this.canvas.height / 20;
                this.ctx.font = "bold 18px Arial";
            }
            else {
                var labelX = this.canvas.width / 2 - this.canvas.width / 6;
                var labelY = this.canvas.height / 2 + this.canvas.height / 20;
                this.ctx.font = "bold 20px Arial";
            }


            var labelText = options.percentage;
            this.ctx.fillStyle = "#2f823a";
            this.ctx.fillText(labelText + "%", labelX, labelY);

        }

    }
}

$(document).ready(function () {
  
    const itemID = $('#hiddenItem').text();
    const shopID = $('#hiddenShop').text();
    const pinIcon = $('#pinIcon').text();
    const pinIconSmall = $('#pinIconSmall').text();
    // const traceURL = "https://tracified-api-test.herokuapp.com/shopify/modal/modal-mapping/";
    const traceURL = "https://tracified-api-test.herokuapp.com/shopify/modal/modal-mapping/mock/";
    const URL = traceURL + shopID + "/" + itemID;

    $.ajax({
      
        type: "GET",
        statusCode: {
            404: function (xhr) {
                console.log("item not found: " + xhr.responseText);
                document.getElementById("loader").style.display = "none";
                document.getElementById("noTrace").style.display = "block";
            }
        },
        url: URL,
    
    }).done(function (data) {

        console.log("!!!!!!!!!!!!!!"+data);
        document.getElementById("columnContainer").innerHTML = data.components.htmltxt;
        document.getElementById("dimensionComponentRow").innerHTML = data.dimensionComponents.htmltxt;
        document.getElementById("mapContainer").innerHTML = data.mapComponents.htmltabs;
        document.getElementById("mapTabContainer").innerHTML = data.mapComponents.htmltabcontent;
        document.getElementById("imageSliderWrapper").innerHTML = data.imageSliderComponents.htmltxt;
        document.getElementById("loader").style.display = "none";
        document.getElementById("myDiv").style.display = "block";
        tabs = document.getElementsByClassName("tabcontent");

        if (detectIE()) {

            // COde run if internet explorer or Edge browser
            console.log('IE ' + detectIE());
            $("canvas").css({ "width": "100px" });


        } else {

            console.log('not IE');

        };

        for (x in data.components.pieChartData) {

            var canvas = document.getElementById(data.components.pieChartData[x].canvas);
            canvas.width = 100;
            canvas.height = 100;

            var options = data.components.pieChartData[x];
            options.canvas = canvas;
            var myPiechart = new Piechart(options);
            myPiechart.draw();

        }

//         for (let imgObj of data.imageSliderComponents.imageArray) {
//             document.getElementById(imgObj.id).setAttribute('src', imgObj.src);
//         }
      
        for (var i = 0, len = data.imageSliderComponents.imageArray.length; i < len; i++) {
          console.log('INSIDE IMAGE FOR')
          document.getElementById(data.imageSliderComponents.imageArray[i].id).setAttribute('src', data.imageSliderComponents.imageArray[i].src);
        }

      
      $('.carousel[data-type="multi"] .item').each(function() {
        var next = $(this).next();
        if (!next.length) {
          next = $(this).siblings(':first');
        }
        next.children(':first-child').clone().appendTo($(this));

        for (var i = 0; i < 2; i++) {
          next = next.next();
          if (!next.length) {
            next = $(this).siblings(':first');
          }

          next.children(':first-child').clone().appendTo($(this));
        }
      });
   	

      /* Map */  
      /*..........................................................................*/
      /* Taking average of longtitudes & latitudes */
      var sumLat=0;	
      var avgLat=0;
      var sumLong=0;	
      var avgLong=0;
//       console.log("aaaaaaaa :"+JSON.stringify(data.mapComponents.mapTabData[1].markers));
      for (var i = 0, len = data.mapComponents.mapTabData.length; i < len; i++) {
       sumLat=0;	
       avgLat=0;
       sumLong=0;	
       avgLong=0;
        
        var x = data.mapComponents.mapTabData[i];
		
         for (var j = 0; j < x.markers.length; ++j) {
            /* Latitudes */
            var Lat=x.markers[j].lat;
           	var Latitude=parseFloat(Lat);
            console.log("lat :"+Lat);
            sumLat+=Latitude;
           
           
           /* Longtitudes */
           var Long=x.markers[j].long;
           	var Longtitude=parseFloat(Long);
            console.log("Long :"+Long);
            sumLong+=Longtitude;
      	}       
        
        /*..........................................................................*/
        avgLat=sumLat/x.markers.length;
        avgLong=sumLong/x.markers.length;
        console.log("%%%%%% Average of Latitudes :"+avgLat);
        console.log("%%%%%% Sum of Latitudes :"+sumLat);
        console.log("%%%%%% Average of Longtitudes :"+avgLong);
        console.log("%%%%%% Sum of Longtitudes :"+sumLong);
        
        console.log(data.mapComponents.mapTabData[0].markers.length);
            let map = L.map(x.mapID, {
                attributionControl: false,
              center:[avgLat,avgLong],
                minZoom: 2,
                zoom: 7,
            })
            
            L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                subdomains: ['a', 'b', 'c']
            }).addTo(map);
        
            var myIcon = L.icon({
                iconUrl: "https://use.fontawesome.com/releases/v5.0.10/svgs/solid/map-marker-alt.svg",
                iconRetinaUrl: "https://use.fontawesome.com/releases/v5.0.10/svgs/solid/map-marker-alt.svg",
                iconSize: [25, 41],
                iconAnchor: [12.5, 41],
                popupAnchor: [0, -14]
            })
             
            
			// ..............................................................................
            var markers = [];        			
            for (var j = 0; j < x.markers.length; ++j) {
              	L.marker([x.markers[j].lat, x.markers[j].long], { icon: myIcon }).bindPopup('This is Littleton, CO.').addTo(map);
            }
        	    
        
        }
      
      	

        document.getElementById('button0').click(); // this is needed to make the tabs work properly
		
      	console.log("::::::::::::::::::::"+JSON.stringify(data.mapComponents.mapTabData));
        
//         console.log("%%%%%% length :"+data.mapComponents.mapTabData.length);
      
    }).fail(function (jqXHR, textStatus, errorThrown) {
        console.log("error in ajax request");
        console.log(jqXHR);
        console.log(textStatus);
        console.log(JSON.stringify(errorThrown));
        document.getElementById("loader").style.display = "none";
        document.getElementById("traceError").style.display = "block";
    });
  		

});



// end tracified.js