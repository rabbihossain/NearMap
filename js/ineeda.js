(function(){
    /*
     *Declare variables to avoid global scope
     */
   var destLoc,map,loc,places,directionsDisplay,directionsService,ref,placesReq,detailsReq,type='',defRadius = '2000';

   /**
    * Click/touch handler for expand search button
    * Double radius and try search again
    */
   $('#expand-search').live('vclick',function(event){
       defRadius = placesReq.radius * 2;
       $.mobile.changePage('places.html', {transition:'pop', reloadPage:true, changeHash:false});
   });

   /**
    * Set ref variable when a place is clicked
    */
   $('#places-list li a').live('vclick',function(event){
       ref = $(this).attr('data-ref');
   });

    /**
     * Before the places page is created, update the header to match the selected type
     */
    $('#places-page').live('pagebeforecreate',function(event){
        var formattedPlaces = type.replace('_', ' ');
        formattedPlaces = formattedPlaces.substring(0,1).toUpperCase()+formattedPlaces.substring(1);
        $('#places-page > div:first-child').html('<h1>'+formattedPlaces+'</h1>');
    });

    /**
     * When the homepage is shown, reset the search radius and type back to the default value
     */
     $('#home').live('pageshow',function(event){
        defRadius = '2000';
        type='';
        if(navigator.geolocation){
           navigator.geolocation.getCurrentPosition(function(position){
                loc = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
           } ,function(error){
                alert("Position can't be determined, please refresh the home page and try again");
                console.log(error.code);
            },{maximumAge:10000,timeout:10000,enableHighAccuracy:true});
       }  else {
          alert('Geolocation not enabled');
       }
     });

     /**
      * add event handler to homepage links to set type when clicked
      */
      $('#home').live('pagecreate',function(event){
        $('.index-link').bind('vclick',function(event2){
            type = $(this).attr('data-type');
        })
      });

    /**
     * When the places page is shown, populated the map with the relevant places
     * based on our current location and the current radius
     */
    $('#places-page').live('pageshow',function(event){
          
           map = new google.maps.Map(document.getElementById('map_canvas'),{
               mapTypeId: google.maps.MapTypeId.ROADMAP,
               center: loc,
               zoom:13
           });

           var marker = new google.maps.Marker({
                position: loc,
                map: map,
                icon: 'http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=A|66ba4a|000000'
            });

               placesReq = {
                   location: loc,
                   radius: defRadius,
                   types: [type]
               };
             
           places = new google.maps.places.PlacesService(map);
           places.search(placesReq,placesCB);
       
    });

/**
 * When the place detail page is shown, display the map with directions, and get
 * the place details based on the reference set earlier
 */
$('#place-detail-page').live('pageshow',function(event){
       directionsDisplay = new google.maps.DirectionsRenderer();
       directionsService = new google.maps.DirectionsService();
       map = new google.maps.Map(document.getElementById('map_canvas_detail'),{
           mapTypeId: google.maps.MapTypeId.ROADMAP,
           center: loc,
           zoom:15
       });

       directionsDisplay.setMap(map);

       detailsReq = {reference: ref};
       places = new google.maps.places.PlacesService(map);
       places.getDetails(detailsReq,detailPlacesCB);
});

/**
 * Callback function from places page search
 * Add each place to the list and map, and display details about the place and
 * a marker on the map
 */
function placesCB(results, status){
    if (status == google.maps.places.PlacesServiceStatus.OK) {
        for(var i=0;i<results.length;i++){
            var markerNum = i+1;
            var bubbleFillColor = '2489CE',
                bubbleTextColor='FFFFFF';
            var detailsReq = {reference: results[i].reference};
            var numDetail = placesClosure(i);
            places.getDetails(detailsReq,numDetail);
            $('.ui-listview').append('<li>\n\
                                            <a href="place-detail.html" data-ref="'+results[i].reference+'" class="ui-link-inherit">\n\
                                                <div class="place-icon-container">\n\
                                                    <img src="http://chart.apis.google.com/chart?chst=d_bubble_text_small&chld=bbT|'+markerNum+'|'+bubbleFillColor+'|'+bubbleTextColor+'" class="ul-li-icon" />\n\
                                                </div>\n\
                                                <div class="place-details-container">\n\
                                                    <h3 class="ui-li-heading">'+results[i].name+'</h3>\n\
                                                    <p class="ui-li-desc address"></p>\n\
                                                    <p class="ui-li-desc phone"></p>\n\
                                                    <p class="ui-li-desc rating"></p>\n\
                                                </div>\n\
                                            </a>\n\
                                    </li>');
            var detailLat = results[i].geometry.location.lat();
            var detailLng = results[i].geometry.location.lng();
            var placeLoc = new google.maps.LatLng(detailLat, detailLng);

            var marker = new google.maps.Marker({
                position: placeLoc,
                map: map,
                icon: 'http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld='+markerNum+'|'+bubbleFillColor+'|'+bubbleTextColor
            });

        }
        $('ul').listview('refresh');

    } else if(status == google.maps.places.PlacesServiceStatus.ZERO_RESULTS){
         $('.ui-listview').append('<li>No results found within default distance</li>');
          $('.ui-listview').append('<li><a href="#" id="expand-search">Expand Search</a></li>');
          $('ul').listview('refresh');
    }
}

/**
 * Closure function for populating places information
 */
function placesClosure(position){
    return function(place,status){
         if (status == google.maps.places.PlacesServiceStatus.OK) {
            if(place.rating != undefined){
                $('.ui-listview li:eq('+position+') a  p.rating').append(insertStars(place.rating));
            }
            $('.ui-listview li:eq('+position+') a p.address').append(place.formatted_address);
            $('.ui-listview li:eq('+position+') a p.phone').append(place.formatted_phone_number);
         }
    }
}

/**
 * Callback function from places detail search
 * Displays route to place as well as information about place
 */
function detailPlacesCB(place,status){
    if (status == google.maps.places.PlacesServiceStatus.OK) {
        var ratingValue = '';
        var phoneNum = '';
        var detailLat = place.geometry.location.lat();
        var detailLng = place.geometry.location.lng();
        destLoc = new google.maps.LatLng(detailLat, detailLng);

        var directionRequest = {
           origin:loc,
           destination:destLoc,
           travelMode:google.maps.TravelMode['DRIVING']
       }

       directionsService.route(directionRequest, function(response, status) {
        if (status == google.maps.DirectionsStatus.OK) {
          directionsDisplay.setDirections(response);
        }
      });
      if(place.rating != undefined){
          ratingValue = insertStars(place.rating)
      }
      if(place.formatted_phone_number != undefined){
          phoneNum = place.formatted_phone_number;
      }
      $('#place-detail-page > div:first-child h1').html(place.name);
      $('.ui-listview').append('<li data-role="list-divider">Address</li><li>'+place.formatted_address+'</li><li data-role="list-divider">Rating</li><li>'+ratingValue+'</li><li data-role="list-divider">Call</li><li data-icon="false">'+phoneNum+'</li>');
       $('ul').listview('refresh');
    }
}

/**
 * Function for inserting the ratings to the places and detail pages
 */
function insertStars(ratingNum){
   var tmp = ratingNum/5;
   var starNum = Math.round(tmp*100);
   var output = '<div class="rating_bar"><div style="width:'+starNum+'%"></div></div>';
   return output;
}


})();