/* version 1.1.7 */

'use strict';
// NOTE: this code runs on the client so needs to be written defensively and for multi-browser compatibility

var jQ = jQuery.noConflict();
(function () {

  window.addEventListener('load', init);

  var deliveryDateWidgetContainerId = 'streamthing_delivery_date_picker';  // div id containing entire widget
  var formInputTarget = 'streamthing_delivery_date';  // value of form input data-target

  function init(){
    // get settings
    getSettings(function(datetimepickerOptions, appSettings){
      if(appSettings.enabled){
        createDatePicker(appSettings);
        disableFastClickjs();  // disable fastclick.js if installed in theme  
        jQ('#' + formInputTarget).datetimepicker(datetimepickerOptions);
      }

    });
  }

  function getSettings(callback){
    var request = new XMLHttpRequest();
    var destination = 'apps/delivery-date/handy/shopify/settings?source=cart';
    var method = 'GET';
    request.open(method, destination);
    request.send();
    request.onreadystatechange = function(){
      if(request.readyState === XMLHttpRequest.DONE && request.status === 200){
        var settings;
        try {
          settings = JSON.parse(request.responseText);
          applySettings(settings, callback);
        }
        catch(err){
          console.log('error\n', err);
        }
      }
    };
  }


  function applySettings(settings, callback){
    // defaults are hard-coded as fall back in case something goes wrong
    var defaultSettings = {
      enabled: true,                // app is enabled
      latest_future_delivery: 30,   // maximum future delivery date relative to today
      delivery_lead_time: 3,        // lead time for earliest delivery
      daily_cutoff: 13,             // daily cut-off time
      timezone: 'est',              // timezone for daily cutoff
      no_delivery_days_of_the_week: [], // days of the week where there is no delivery
      blackout_dates: [Date.now() + 7 * 24 * 60 * 60 * 1000 ],           // specific delivery blackout dates
      label_text: 'Please select your delivery date'  // text label
    };

    settings = typeof settings !== 'object' ? defaultSettings : settings;

    var datetimepickerOptions = {
      format: 'MMMM Do, YYYY',
      useCurrent: false,
      minDate: earliestDelivery(settings),
      maxDate: latestDelivery(settings),
      daysOfWeekDisabled: disabledDays(settings),
      disabledDates: disabledDates(settings)
    };

    var appSettings = {
      enabled: settings.enabled,
      delivery_date_required: settings.delivery_date_required,
      label_text: settings.label_text
    };

    // remove novalidate attribute from form if the delivery date is required
    if(settings.delivery_date_required){
      var form = document.getElementsByTagName('form');
      for(var i=0; i<form.length; i++){
        var novalidateStatus = form[i].getAttribute('novalidate');
        novalidateStatus !== false ? form[i].removeAttribute('novalidate') : null;
      }
    }

    return callback(datetimepickerOptions, appSettings);
  }

  function earliestDelivery(settings){
    // should calculate the current time at the shop - using timezone -
    //  then if the cutoff is past, add one day to the earliest delivery date
    settings = settings || {};
    var cutoff = settings.daily_cutoff;
    var delivery_lead_time = settings.delivery_lead_time;
    var timezone = settings.timezone;

    isPastCutOff(cutoff, timezone) ? delivery_lead_time++ : null;
    var today = Date.now();
    var earliestDelivery = new Date(today + delivery_lead_time * 24 * 60 * 60 * 1000);
    return earliestDelivery;
  }

  function isPastCutOff(cutOff, timezone){
    /* 
     * calculate if cutoff time has passed
     * the approach taken assumes the cutoff time is calculated based on the current date 
     * in the local time of the client e.g. if local time is '09/19/17 18:00 GMT-08' and
     * the cutoff time is '12:00 GMT-05' then the cutoff in local time will be
     * '09/19/17 09:00 GMT-08'.  This is done to avoid ambiguity about the date when the
     * cutoff in local time crosses into the next or previous day.
     *
     * NOTE: This can result in the situation where the right combination of cutoff time and 
     * timezone will always result in calls from clients from a particular timezone 
     * always returning 'true' or 'false'
     *
     * NOTE: The way timezones are managed is suboptimal.  The user should select a location
     * and then have the time offset recalculated whenever the widget is loaded.  This is because
     * time zone offsets are not constant and vary with the time of the year
     */

    var isPastCutOff;  // indicates if cutoff time has passed. 
    var offsetHours = parseInt(timezone.split(':')[0], 10);
    var offsetMinutes = parseInt(timezone.split(':')[1], 10);

    if(isNaN(offsetHours) || isNaN(offsetMinutes)){
      // if error occurs while parsing timezone, take conservative position on whether cutoff has passed
      isPastCutOff = true;
      return isPastCutOff;
    }

    // apply right sign to offset minutes
    offsetMinutes = (offsetHours >= 0) ? offsetMinutes : offsetMinutes * -1;

    var now = new Date();
    
    // convert cutoff time into local time
    var localCutOffHour = cutOff - offsetHours - Math.round(now.getTimezoneOffset() / 60);
    var localCutOffMinutes = 0 - offsetMinutes;
    var cutOffTime = new Date(now.getFullYear(), 
                                now.getMonth(), 
                                now.getDate(), 
                                localCutOffHour,
                                localCutOffMinutes
                              );

    isPastCutOff = (now.valueOf() - cutOffTime.valueOf() > 0) ? true : false;

    return isPastCutOff;
  }

  function latestDelivery(settings){
    // calculate latest delivery date
    var latestDelivery = new Date(Date.now() + settings.latest_future_delivery * 24 * 60 * 60 * 1000);
    return latestDelivery;
  }

  function disabledDays(settings){
    // convert settings.no_delivery_days_of_the_week to array if necessary
    var disabledDays = Array.isArray(settings.no_delivery_days_of_the_week) ? settings.no_delivery_days_of_the_week : [];

    return disabledDays;
  }

  function disabledDates(settings){
    // create array of specific delivery blackout dates
    var disabledDateArray = settings.blackout_dates || [];
    var disabledDates = [];
    disabledDateArray.forEach(function(disabledDate){
      disabledDates.push(new Date(disabledDate));
    });
    return disabledDates;
  }

  function createDatePicker(appSettings){
    var deliveryDatePicker = document.getElementById(deliveryDateWidgetContainerId);
    var delivery_date_required = appSettings.delivery_date_required ? 'required' : '';

    var datePicker = "" +
      "<div class='form-group'>" + 
        "<label for='" + formInputTarget + "_input" + "'>" + appSettings.label_text + "</label>" +
        "<div class='input-group date'>" +
          "<input " +  delivery_date_required + " class='form-control datetimepicker-input' id='" + formInputTarget + "' type='text' data-target='#" + formInputTarget + "' data-target-input='nearest'  name='attributes[" + formInputTarget + "]' value='{{ cart.attributes." + formInputTarget + " }}' />" +
          "<span class='input-group-addon' data-target='#" + formInputTarget + "' data-toggle='datetimepicker'>" + 
            "<span class='glyphicon glyphicon-calendar'></span>" +
          "</span>" +
        "</div>" +
      "</div>" +
    "";

    deliveryDatePicker.innerHTML = datePicker;

    var inputText = document.getElementById(formInputTarget);

    /* prevent editing of the input text box by keyboard */
    inputText.addEventListener('keydown', preventKeyBoardInput);


    function preventKeyBoardInput(e){
      e.preventDefault();
    }

    /* open and close datepicker when text input is clicked */
    inputText.addEventListener('click', toggleDatepicker);

    function toggleDatepicker(e){
      e.preventDefault();
      jQ('#' + formInputTarget).datetimepicker('toggle');
    }

  }


  function disableFastClickjs(){
    /* disable fastclick.js
     * Fast Click is a library that addresses mobile browser issues (removes 300ms 
     * touch delay that used to exist) but inadvertently adds its own bugs
     * see https://github.com/ftlabs/fastclick/issues/119
     */

    var deliveryDatePicker = document.getElementById(deliveryDateWidgetContainerId);

    deliveryDatePicker.addEventListener("touchstart", function(e){
      e.target.classList.add("needsclick");  // disable fast click on elements within this container
    });
  }


})(jQ);